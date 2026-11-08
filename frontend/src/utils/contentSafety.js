// frontend/src/utils/contentSafety.js
let model = null;

export const loadModel = async () => {
  if (!model) {
    const nsfwjs = await import('nsfwjs');
    model = await nsfwjs.load();
  }
  return model;
};

export const checkImageSafety = async (imgElement) => {
  try {
    if (!model) await loadModel();
    if (!model) return false;
    const predictions = await model.classify(imgElement);
    
    // Check for 'Porn' or 'Hentai' with > 60% probability
    const unsafe = predictions.find(p => 
      (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.6
    );
    
    return !!unsafe;
  } catch (err) {
    console.warn('Content safety check bypassed or failed:', err);
    return false;
  }
};