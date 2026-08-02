import { encode } from '@jsquash/jpeg';
import { scaledDimensions } from '../lib/image-dimensions.mjs';

const MAX_EDGE = 2048;
const THUMB_EDGE = 320;

self.addEventListener('message', async (event) => {
  const { id, name, type, buffer } = event.data;
  let bitmap;
  try {
    bitmap = await createImageBitmap(new Blob([buffer], { type }), { imageOrientation: 'from-image' });
    const output = scaledDimensions(bitmap.width, bitmap.height, MAX_EDGE);
    const canvas = new OffscreenCanvas(output.width, output.height);
    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, output.width, output.height);
    bitmap.close();
    bitmap = null;

    const imageData = context.getImageData(0, 0, output.width, output.height);
    const encoded = await encode(imageData, {
      quality: 80,
      chroma_quality: 80,
      progressive: true,
      optimize_coding: true,
      trellis_multipass: true,
      trellis_opt_zero: true,
    });

    const thumb = scaledDimensions(output.width, output.height, THUMB_EDGE);
    const thumbCanvas = new OffscreenCanvas(thumb.width, thumb.height);
    thumbCanvas.getContext('2d', { alpha: false }).drawImage(canvas, 0, 0, thumb.width, thumb.height);
    const thumbBlob = await thumbCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.62 });
    const thumbBuffer = await thumbBlob.arrayBuffer();

    self.postMessage({
      ok: true,
      id,
      name,
      width: output.width,
      height: output.height,
      encoded,
      thumb: thumbBuffer,
    }, [encoded, thumbBuffer]);
  } catch {
    bitmap?.close();
    self.postMessage({ ok: false, id, name, error: `Could not encode ${name}` });
  }
});
