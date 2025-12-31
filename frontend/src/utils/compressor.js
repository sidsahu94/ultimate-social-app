import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  if (!file || !file.type.startsWith('image/')) return file; // Skip if not image

  const options = {
    maxSizeMB: 0.8, // Compress to ~800KB
    maxWidthOrHeight: 1920, // Resize if huge
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Create a new File object with the original name (compression usually returns a Blob)
    return new File([compressedFile], file.name, { type: file.type });
  } catch (error) {
    console.warn("Image compression failed, using original", error);
    return file;
  }
};