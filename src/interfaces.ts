/**
 * Single patient record from the API.
 * Note: `age` is `number | string` because source data contains both numeric ages and string errors.
 */
export interface PatientRecord {
    patient_id: string;
    name: string;
    age: number;
    gender: 'M' | 'F' | string;
    blood_pressure: string;
    temperature: number;
    visit_date: string; // ISO date string (e.g. 2024-02-24)
    diagnosis: string;
    medications: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface Metadata {
    timestamp: string; // ISO timestamp
    version: string;
    requestId: string;
}

export interface PatientsApiResponse {
    data: Array<PatientRecord>;
    pagination: Pagination;
    metadata: Metadata;
}

export interface Resp {
    high_risk_patients: Array<string>;
    fever_patients: Array<string>;
    data_quality_issues: Array<string>;
}