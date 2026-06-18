import { invoke } from '@tauri-apps/api/core';

export interface PatientData {
  patientId: string;
  lastUpdated: string;
  copmProblems: { description: string; importance: number | null }[];
}

export async function ensureDataDirs(): Promise<string> {
  return invoke<string>('ensure_data_dirs');
}

export async function saveAssessment(filename: string, json: string): Promise<void> {
  return invoke('save_assessment', { filename, json });
}

export async function listAssessments(): Promise<string[]> {
  return invoke<string[]>('list_assessments');
}

export async function loadAssessment(filename: string): Promise<string> {
  return invoke<string>('load_assessment', { filename });
}

export async function savePatientData(patientId: string, data: PatientData): Promise<void> {
  return invoke('save_patient_data', { patientId, json: JSON.stringify(data, null, 2) });
}

export async function loadPatientData(patientId: string): Promise<PatientData | null> {
  const json = await invoke<string | null>('load_patient_data', { patientId });
  if (!json) return null;
  try {
    return JSON.parse(json) as PatientData;
  } catch {
    return null;
  }
}
