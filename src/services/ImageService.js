import { assertImageFile } from '../utils/validators.js';

export class ImageService {
  validate(file) { return assertImageFile(file); }
  createPreview(blob) { return URL.createObjectURL(blob); }
  revokePreview(url) { if (url?.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url); }
  async process(file) {
    this.validate(file);
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => { const item = new Image(); item.onload = () => resolve(item); item.onerror = () => reject(new Error('Não foi possível ler a imagem.')); item.src = sourceUrl; });
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale)); const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
      if (!blob) throw new Error('Não foi possível processar a imagem.');
      return blob;
    } finally { URL.revokeObjectURL(sourceUrl); }
  }
}
