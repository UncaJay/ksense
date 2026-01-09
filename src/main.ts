import { request as httpsRequest, RequestOptions } from 'https';
import { PatientRecord, PatientsApiResponse, Resp } from './interfaces';
import { verify } from 'crypto';
import { sys } from 'typescript';

async function get(url: string, timeout = 10000): Promise<{ status: number; body: string }> {
    console.debug('GET ', url);
    return new Promise((resolve, reject) => {
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch (err) {
            reject(new Error('Invalid URL'));
            return;
        }

        const opts: RequestOptions = {
            method: 'GET',
            timeout: timeout,
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            port: parsed.port || undefined,
            // exposed, but should be in a separate file. In real world usage, use environment variable or secure vault
            headers: {
                'x-api-key': 'ak_886a1c7b0748c2404664a578ab63e470873bea5768559f77'
            }
        };

        const req = httpsRequest(opts, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => {
                chunks.push(Buffer.from(chunk));
            });
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                resolve({ status: res.statusCode || 0, body });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });
        req.setTimeout(timeout, () => {
            req.destroy(new Error('Request timed out'));
        });
        req.end();
    });
}

async function retryGet(url: string, retries: number, delayMs: number, timeout?: number): Promise<any> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await get(url);
            if (!response.body) {
                throw new Error('Empty response body');
            }
            let ret = JSON.parse(response.body);
            if (!ret || ret.error) {
                throw new Error('API error: ' + (ret.error || 'Unknown error'));
            }
            return ret;
        } catch (err) {
            if (attempt === retries) {
                throw err;
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    throw new Error('Unreachable code');
}

async function getData(limit?: number): Promise<Array<PatientRecord>> {
    let mainResp: PatientsApiResponse;
    let ret: Array<PatientRecord> = [];

    try {
        mainResp = await retryGet('https://assessment.ksensetech.com/api/patients?limit=' + (limit || 20), 3, 5000);
        if (!mainResp || !mainResp.data || !mainResp.pagination) {
            throw new Error('Invalid API response');
        }
        ret.push(...mainResp.data);
    } catch (err) {
        console.error('Error fetching data:', err);
        return [];
    }

    while (mainResp.pagination.hasNext) {
        try {
            mainResp = await retryGet('https://assessment.ksensetech.com/api/patients?limit=' + (limit || 20) + '&page=' + (mainResp.pagination.page + 1), 3, 2000);
            if (!mainResp || !mainResp.data || !mainResp.pagination) {
                throw new Error('Invalid API response');
            }
            ret.push(...mainResp.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }

    return ret;
}

function verifyRecord(rec: PatientRecord) {
    if (!rec.age || (typeof rec.age !== 'number' || isNaN(rec.age))) {
        return false;
    }
    if (!rec.temperature || (typeof rec.temperature !== 'number' || isNaN(rec.temperature))) {
        return false;
    }
    if (!rec.blood_pressure || typeof rec.blood_pressure !== 'string' || !rec.blood_pressure.includes('/')) {
        return false;
    }
    let temp = rec.blood_pressure.split('/');
    if (temp.length !== 2 || !temp[0] || !temp[1] || isNaN(Number(temp[0])) || isNaN(Number(temp[1]))) {
        return false;
    }
    return true;
}

async function main() {
    let data: Array<PatientRecord> = await getData();

    let ret: Resp = {
        high_risk_patients: [],
        fever_patients: [],
        data_quality_issues: []
    };

    for (let i = 0, len = data.length; i < len; i++) {
        let rec: PatientRecord = data[i];

        if (!verifyRecord(rec)) {
            ret.data_quality_issues.push(rec.patient_id);
        }

        let totalPoints = 0;
        // age risk
        if (typeof rec.age === 'number') {
            if (rec.age > 65) {
                totalPoints += 2;
            } else if (rec.age >= 40) {
                totalPoints += 1;
            }
        }

        // temp risk
        if (typeof rec.temperature === 'number') {
            if (rec.temperature >= 101) {
                totalPoints += 2;
                ret.fever_patients.push(rec.patient_id);
            } else if (rec.temperature > 99.5) {
                totalPoints += 1;
                ret.fever_patients.push(rec.patient_id);
            }
        }

        // bp risk
        if (typeof rec.blood_pressure == 'string') {
            let bpParts = rec.blood_pressure.split('/');
            let systolic = Number(bpParts[0]);
            let diastolic = Number(bpParts[1]);
            if (!isNaN(systolic) && !isNaN(diastolic) && systolic > 0 && diastolic > 0) {
                if (systolic >= 140 || diastolic >= 90) {
                    totalPoints += 3;
                } else if (systolic >= 130 || diastolic >= 80) {
                    totalPoints += 2;
                } else if (systolic >= 120 && diastolic < 80) {
                    totalPoints += 1;
                }
            }
        }

        if (totalPoints >= 4) {
            ret.high_risk_patients.push(rec.patient_id);
        }

        rec['risk_score'] = totalPoints;
    }
    return ret;
}

main();

