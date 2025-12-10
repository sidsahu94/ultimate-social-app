import React, { useState } from 'react';
import API from '../../services/api';
import { useToast } from '../ui/ToastProvider';

export default function StoryCreate({ onCreated }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const { add } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('media', file);
      await API.post('/stories', fd, { headers: { 'Content-Type':'multipart/form-data' } });
      add('Story posted', { type:'info' });
      setFile(null);
      onCreated && onCreated();
    } catch (err) {
      add(err.userMessage || 'Failed', { type:'error' });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input type="file" accept="image/*,video/*" onChange={e=>setFile(e.target.files[0])} />
      <button disabled={!file || busy} className="btn-primary">{busy?'Posting...':'Add story'}</button>
    </form>
  );
}
