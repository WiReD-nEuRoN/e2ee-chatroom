-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to chat-files bucket
CREATE POLICY "Allow public access to chat-files" ON storage.objects
  FOR ALL
  USING (bucket_id = 'chat-files')
  WITH CHECK (bucket_id = 'chat-files');
