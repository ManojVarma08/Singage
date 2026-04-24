import { getUploadUrl } from './api';

// Upload file to S3 via pre-signed URL
// Phone uploads directly to S3 — Lambda not involved in data transfer
export async function uploadToS3(
  fileUri: string,
  filename: string,
  contentType: string
): Promise<string> {
  // 1. Get pre-signed URL from backend
  const { uploadUrl, publicUrl } = await getUploadUrl(filename, contentType);

  // 2. Upload directly to S3
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`S3 upload failed: ${uploadRes.status}`);
  }

  // Return public URL (permanent, works even after app closes)
  return publicUrl;
}
