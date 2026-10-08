const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Could not load outfit image'));
  image.src = src;
});

export async function combineImagesVertically(sources: string[]): Promise<Blob> {
  const images = await Promise.all(sources.map(loadImage));
  const width = 720;
  const gap = 18;
  const height = images.reduce((total, image) => total + Math.round((width / image.naturalWidth) * image.naturalHeight), 0) + gap * (images.length - 1);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create outfit preview');
  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, width, height);
  let top = 0;
  images.forEach((image, index) => {
    const imageHeight = Math.round((width / image.naturalWidth) * image.naturalHeight);
    context.drawImage(image, 0, top, width, imageHeight);
    top += imageHeight + (index < images.length - 1 ? gap : 0);
  });
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create outfit image')), 'image/jpeg', 0.9));
}

export async function imageBlobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not preview outfit'));
    reader.onerror = () => reject(new Error('Could not preview outfit'));
    reader.readAsDataURL(blob);
  });
}
