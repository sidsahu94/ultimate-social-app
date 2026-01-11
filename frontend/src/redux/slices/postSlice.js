// frontend/src/redux/slices/postSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/api";

export const fetchFeed = createAsyncThunk("posts/fetchFeed", async (_, thunkAPI) => {
  try {
    const res = await API.get("/posts/feed");
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

export const likePost = createAsyncThunk("posts/likePost", async (postId, thunkAPI) => {
  try {
    const res = await API.put(`/posts/like/${postId}`);
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

const postSlice = createSlice({
  name: "posts",
  initialState: { posts: [], loading: false, error: null },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => { state.loading = true; })
      .addCase(fetchFeed.fulfilled, (state, action) => { state.loading = false; state.posts = action.payload; })
      .addCase(fetchFeed.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(likePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p._id === action.payload._id);
        if (index !== -1) state.posts[index] = action.payload;
      });
  },
});

export default postSlice.reducer;
