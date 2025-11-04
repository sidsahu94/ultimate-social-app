// frontend/src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchMe = createAsyncThunk('user/fetchMe', async (_, thunkAPI) => {
  try {
    const res = await API.get('/users/me');
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch');
  }
});

export const fetchUserById = createAsyncThunk('user/fetchById', async (id, thunkAPI) => {
  try {
    const res = await API.get(`/users/${id}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: { me: null, profile: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (state, action) => { state.me = action.payload; })
      .addCase(fetchUserById.fulfilled, (state, action) => { state.profile = action.payload; });
  }
});

export default userSlice.reducer;
