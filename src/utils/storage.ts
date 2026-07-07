import { supabase } from '@/lib/supabaseClient';

/**
 * Uploads a file to a folder in the 'photos' bucket and returns its public URL.
 * 
 * @param file The file to upload.
 * @param folder The folder path (e.g. 'profiles', 'branches', 'members').
 * @returns The public URL of the uploaded image.
 */
export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
  return data.publicUrl;
}
