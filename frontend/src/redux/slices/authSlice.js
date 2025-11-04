// frontend/src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/api";

// login thunk
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, thunkAPI) => {
    try {
      const res = await API.post("/auth/login", credentials);
      const token = res.data.token ?? res.data?.data?.token;
      const user = res.data.user ?? res.data?.data?.user ?? res.data;
      if (token) localStorage.setItem("token", token);
      if (user && user._id) localStorage.setItem("meId", user._id);
      return user;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Login failed";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// fetchMe thunk
export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, thunkAPI) => {
  try {
    const res = await API.get("/users/me");
    const user = res.data;
    if (user && user._id) localStorage.setItem("meId", user._id);
    return user;
  } catch (err) {
    // Clear token if fetchMe fails (invalid/expired)
    localStorage.removeItem("token");
    localStorage.removeItem("meId");
    const msg = err?.response?.data?.message || "Failed to fetch user";
    return thunkAPI.rejectWithValue(msg);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
    checkingAuth: !!localStorage.getItem("token"),
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("meId");
    },
    clearError: (state) => { state.error = null; },
    setUser: (state, action) => { state.user = action.payload; state.checkingAuth = false; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.checkingAuth = false; })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; s.checkingAuth = false; })

      .addCase(fetchMe.pending, (s) => { s.checkingAuth = true; })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.checkingAuth = false; })
      .addCase(fetchMe.rejected, (s, a) => { s.user = null; s.error = a.payload; s.checkingAuth = false; });
  }
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
