/**
 * Compresses and resizes an uploaded image file to a 16:9 HD (1280x720) Data URL
 * suitable for fast cloud persistence in Firestore while using minimal storage (~80-150 KB).
 */
export async function compressThumbnailFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxWidth;
          canvas.height = maxHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo inicializar el procesador de imagen.'));
            return;
          }

          // Fill black background and center-crop to 16:9 (YouTube standard aspect ratio)
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, maxWidth, maxHeight);

          const targetRatio = maxWidth / maxHeight;
          const srcRatio = img.width / img.height;

          let sx = 0;
          let sy = 0;
          let sWidth = img.width;
          let sHeight = img.height;

          if (srcRatio > targetRatio) {
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
          } else if (srcRatio < targetRatio) {
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, maxWidth, maxHeight);

          // Prefer WebP for best quality-to-size ratio; fallback to JPEG
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // If still larger than ~380KB string length, step down quality slightly
          if (dataUrl.length > 380_000) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.68);
          }
          if (dataUrl.length > 380_000) {
            // Fallback to 960x540 if image is extraordinarily complex
            const smallCanvas = document.createElement('canvas');
            smallCanvas.width = 960;
            smallCanvas.height = 540;
            const sCtx = smallCanvas.getContext('2d');
            if (sCtx) {
              sCtx.drawImage(canvas, 0, 0, 960, 540);
              dataUrl = smallCanvas.toDataURL('image/jpeg', 0.72);
            }
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
