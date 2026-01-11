// frontend/src/utils/contentSafety.js
import * as nsfwjs from 'nsfwjs';

let model;

export const loadModel = async () => {
  if (!model) model = await nsfwjs.load();
};

export const checkImageSafety = async (imgElement) => {
  if (!model) await loadModel();
  const predictions = await model.classify(imgElement);
  
  // Check for 'Porn' or 'Hentai' with > 60% probability
  const unsafe = predictions.find(p => 
    (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.6
  );
  
  return !!unsafe; // Returns true if unsafe
};