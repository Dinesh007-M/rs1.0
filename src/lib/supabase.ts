import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL || 'https://kbefnpofbsgsumkpkfpa.supabase.co';
const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_8LtFE7690_7AFhN4sMTmIg_oX-hKYJZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const STORAGE_BUCKET_REPORTS = 'road-report-images';

/**
 * Upload an image blob/file to Supabase Storage and retrieve its public CDN URL.
 */
export async function uploadReportImageToStorage(
  file: Blob | File,
  prefix: string = 'defect'
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  try {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.type.includes('png') ? 'png' : 'jpg';
    const filePath = `${prefix}_${timestamp}_${randomStr}.${ext}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_REPORTS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      console.warn('Direct Supabase storage upload notice:', error.message);
      // Fallback: convert file to base64 and upload via server API proxy
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64String,
          filename: filePath,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return { url: json.url, path: json.path || filePath, error: null };
      }
      return { url: null, path: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_REPORTS)
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      path: data.path,
      error: null,
    };
  } catch (err: any) {
    console.error('Storage upload exception:', err);
    return { url: null, path: null, error: err.message || 'Upload failed' };
  }
}
