import { AWS_CONFIG } from '../../../../packages/shared/src/constants';
import type { TVState } from '../../../../packages/shared/src/types';

const BASE = AWS_CONFIG.apiBaseUrl;

// Get TV state from DynamoDB via Lambda
export async function getTV(tvId: string): Promise<TVState | null> {
  try {
    const res = await fetch(`${BASE}/tv/${tvId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Update TV layout + cells in DynamoDB, publish to IoT
export async function updateTV(tvId: string, layoutId: string, cells: any[]): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/tv/${tvId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layoutId, cells }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Get pre-signed S3 upload URL
export async function getUploadUrl(filename: string, contentType: string) {
  const res = await fetch(`${BASE}/media/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType }),
  });
  return await res.json();
}
