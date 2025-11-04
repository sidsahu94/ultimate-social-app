// src/redux/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchChats = createAsyncThunk('chat/fetchChats', async (_, thunkAPI) => {
  try {
    const res = await API.get('/chat');
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const chatSlice = createSlice({
  name: 'chat',
  initialState: { chats: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => { state.loading = true; })
      .addCase(fetchChats.fulfilled, (state, action) => { state.loading = false; state.chats = action.payload; })
      .addCase(fetchChats.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export default chatSlice.reducer;
