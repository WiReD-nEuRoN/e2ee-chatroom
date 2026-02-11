import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

export const storageService = {
  async uploadFile(
    file: File,
    roomId: string,
    userId: string
  ): Promise<UploadedFile> {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${roomId}/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Storage] Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  },

  async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('chat-files')
      .remove([filePath]);

    if (error) {
      console.error('[Storage] Delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },

  getFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath);
    return data.publicUrl;
  },

  isMediaFile(type: string): { isImage: boolean; isVideo: boolean; isAudio: boolean } {
    return {
      isImage: type.startsWith('image/'),
      isVideo: type.startsWith('video/'),
      isAudio: type.startsWith('audio/'),
    };
  },
};
