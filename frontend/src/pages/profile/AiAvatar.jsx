import React, { useState } from 'react';
import API from '../../services/api';

export default function AiAvatar() {
  const [image,setImage] = useState(null);
  const [result,setResult] = useState(null);

  const upload = async(e)=>{
    const file = e.target.files[0];
    setImage(URL.createObjectURL(file));

    const form = new FormData();
    form.append('avatar', file);
    const r = await API.post('/extra/ai/avatar', form);
    setResult(r.data.url);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h3 className="font-bold text-lg mb-3">AI Avatar Generator</h3>
      <input type="file" onChange={upload}/>
      <div className="mt-4 flex gap-3">
        {image && <img src={image} className="w-32 h-32 rounded-xl object-cover"/>}
        {result && <img src={result} className="w-32 h-32 rounded-xl ring-2 ring-indigo-500"/>}
      </div>
    </div>
  );
}
