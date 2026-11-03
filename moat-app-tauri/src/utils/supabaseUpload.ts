import { supabase } from './supabaseClient';

const BUCKET = 'moat-assessments';

export interface UploadResult {
  success: boolean;
  message: string;
  path?: string;
}

export function normalizePatientFolder(rawId: string): string {
  const trimmed = rawId.trim().toLowerCase();
  if (trimmed.startsWith('p')) return trimmed;
  return `p${trimmed}`;
}

export async function uploadAssessmentToSupabase(
  wb: unknown,
  filename: string,
  patientId: string,
): Promise<UploadResult> {
  if (!supabase) {
    return { success: false, message: 'Supabase not configured' };
  }

  if (!patientId.trim()) {
    return { success: false, message: 'No patient ID' };
  }

  const folder = normalizePatientFolder(patientId);
  const storagePath = `${folder}/${filename}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (wb as any).outputAsync() as ArrayBuffer;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, data, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    });

  if (error) {
    return { success: false, message: `Upload failed: ${error.message}` };
  }

  return { success: true, message: `Backed up to ${storagePath}`, path: storagePath };
}

export async function notifyAssessmentUploaded(
  patientId: string,
  phaseLabel: string,
  filename: string,
  assessor?: string,
): Promise<void> {
  if (!supabase) return;

  const folder = normalizePatientFolder(patientId);

  try {
    await supabase.functions.invoke('notify-assessment', {
      body: {
        patientId: folder,
        phase: phaseLabel,
        filename,
        storagePath: `${folder}/${filename}`,
        timestamp: new Date().toISOString(),
        assessor: assessor || undefined,
      },
    });
  } catch (e) {
    console.warn('Email notification failed:', e);
  }
}
