import { invoke, isTauri } from '@tauri-apps/api/core';
import { COPMData } from '../types';

// --- Browser (non-Tauri) storage backend: IndexedDB, one store, keyed like the Rust filesystem layout ---
const DB_NAME = 'moat-data';
const STORE = 'files';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbKeys(prefix: string): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as string[]).filter(k => k.startsWith(prefix)));
    req.onerror = () => reject(req.error);
  });
}

export interface PatientData {
  patientId: string;
  lastUpdated: string;
  copmProblems: {
    description: string;
    importance: number | null;
    perfT1: number | null;
    satT1: number | null;
    notes: string;
    progression: { phase: string; date: string; perfT2: number | null; satT2: number | null }[];
  }[];
  identificationNotes: COPMData['identificationNotes'];
  importanceRatings: COPMData['importanceRatings'];
}

export async function ensureDataDirs(): Promise<string> {
  if (!isTauri()) return 'Browser storage (IndexedDB)';
  return invoke<string>('ensure_data_dirs');
}

export async function saveAssessment(filename: string, json: string): Promise<void> {
  if (!isTauri()) return idbPut(`assessments/${filename}`, json);
  return invoke('save_assessment', { filename, json });
}

export async function saveXlsxBytes(filename: string, bytes: number[]): Promise<void> {
  if (!isTauri()) return idbPut(`assessments/${filename}`, new Uint8Array(bytes));
  return invoke('save_xlsx_bytes', { filename, bytes });
}

export async function openAssessmentsFolder(): Promise<void> {
  if (!isTauri()) {
    alert('Assessments are stored in your browser. Use Export to download a file.');
    return;
  }
  return invoke('open_assessments_folder');
}

export async function listAssessments(): Promise<string[]> {
  if (!isTauri()) {
    const keys = await idbKeys('assessments/');
    return keys.map(k => k.slice('assessments/'.length));
  }
  return invoke<string[]>('list_assessments');
}

export async function loadAssessment(filename: string): Promise<string> {
  if (!isTauri()) return (await idbGet<string>(`assessments/${filename}`)) ?? '';
  return invoke<string>('load_assessment', { filename });
}

export async function savePatientData(patientId: string, data: PatientData): Promise<string> {
  const json = JSON.stringify(data, null, 2);
  if (!isTauri()) {
    await idbPut(`patient_data/${patientId}.json`, json);
    return 'Browser storage (IndexedDB)';
  }
  return invoke<string>('save_patient_data', { patientId, json });
}

export async function loadPatientData(patientId: string): Promise<PatientData | null> {
  const json = !isTauri()
    ? (await idbGet<string>(`patient_data/${patientId}.json`)) ?? null
    : await invoke<string | null>('load_patient_data', { patientId });
  if (!json) return null;
  try {
    return JSON.parse(json) as PatientData;
  } catch {
    return null;
  }
}
