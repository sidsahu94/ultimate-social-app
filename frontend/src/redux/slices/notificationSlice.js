// frontend/src/redux/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, thunkAPI) => {
  try {
    const res = await API.get('/notifications');
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

export const markNotificationsRead = createAsyncThunk('notifications/markRead', async (_, thunkAPI) => {
  try {
    await API.put('/notifications/mark-read');
    return true;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => { state.items = action.payload; })
      .addCase(fetchNotifications.rejected, (state, action) => { state.error = action.payload; });
  }
});

export default notificationSlice.reducer;
