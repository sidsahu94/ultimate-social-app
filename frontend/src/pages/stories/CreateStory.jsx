import React,{useState} from 'react';
import API from '../../services/api';

export default function CreateStory(){
  const [file,setFile]=useState(null);
  const [caption,setCap]=useState('');
  const [color,setColor]=useState('#ffffff');

  const upload=async()=>{
    const form=new FormData();
    form.append('media',file);
    form.append('caption',caption);
    form.append('color',color);
    await API.post('/stories',form);
    window.location='/';
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <input type="file" onChange={e=>setFile(e.target.files[0])}/>
      <input placeholder="Caption" value={caption} onChange={e=>setCap(e.target.value)}/>
      <input type="color" value={color} onChange={e=>setColor(e.target.value)}/>
      <button onClick={upload} className="btn-primary">Publish</button>
    </div>
  );
}
