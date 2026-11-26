import type { GeminiAnalysisResult } from '../types';

export interface CompressedImage {
  thumbnailDataUrl: string;
  analysisBase64: string;
  mimeType: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}

function resizeToJpeg(img: HTMLImageElement, maxDimension: number, quality: number): string {
  const ratio = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas-Kontext nicht verfügbar.');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function processUploadedImage(file: File): Promise<CompressedImage> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  // High enough resolution for label reading via Gemini Vision
  const analysisDataUrl = resizeToJpeg(img, 1200, 0.84);
  // Compact thumbnail (< 120KB) so up to 4 images easily fit inside Firestore 1MB docs
  let thumbnailDataUrl = resizeToJpeg(img, 640, 0.7);
  if (thumbnailDataUrl.length > 160000) {
    thumbnailDataUrl = resizeToJpeg(img, 480, 0.6);
  }

  return {
    thumbnailDataUrl,
    analysisBase64: analysisDataUrl.replace(/^data:[^;]+;base64,/, ''),
    mimeType: 'image/jpeg',
  };
}

export async function analyzeItemImages(
  images: readonly CompressedImage[]
): Promise<GeminiAnalysisResult> {
  const response = await fetch('/api/analyze-item', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: images.map((img) => ({
        mimeType: img.mimeType,
        data: img.analysisBase64,
      })),
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<GeminiAnalysisResult> & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.error || 'Die KI-Bildanalyse ist fehlgeschlagen. Bitte prüfe die Verbindung.'
    );
  }

  return payload as GeminiAnalysisResult;
}
