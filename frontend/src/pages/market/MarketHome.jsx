import React,{useEffect,useState} from 'react';
import API from '../../services/api';

export default function MarketHome(){
  const [items,setItems]=useState([]);
  const [form,setForm]=useState({ title:'', price:0, desc:'' });
  const [image,setImage]=useState(null);

  const load=async()=> setItems((await API.get('/market')).data);
  useEffect(()=>{ load(); },[]);

  const create=async()=>{
    const fd = new FormData();
    fd.append('title',form.title);
    fd.append('price',form.price);
    fd.append('desc',form.desc);
    if (image) fd.append('image', image);
    await API.post('/market', fd, { headers:{'Content-Type':'multipart/form-data'} });
    setForm({title:'',price:0,desc:''}); setImage(null); load();
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold">Marketplace</h3>
      </div>

      <div className="card p-3 mb-4 grid md:grid-cols-4 gap-2">
        <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="p-2 border rounded" placeholder="Title"/>
        <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:Number(e.target.value)}))} className="p-2 border rounded" placeholder="Price"/>
        <input value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} className="p-2 border rounded" placeholder="Description"/>
        <label className="p-2 border rounded cursor-pointer text-sm text-gray-600">
          Image <input type="file" onChange={e=>setImage(e.target.files[0])} className="hidden"/>
        </label>
        <div className="md:col-span-4 text-right"><button className="btn-primary" onClick={create}>List Product</button></div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {items.map(x=>(
          <div key={x._id} className="card p-3">
            {x.image && <img src={x.image} className="w-full h-36 object-cover rounded mb-2"/>}
            <div className="font-medium">{x.title}</div>
            <div className="text-sm text-gray-500">₹ {x.price}</div>
            <div className="text-xs text-gray-500">{x.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
