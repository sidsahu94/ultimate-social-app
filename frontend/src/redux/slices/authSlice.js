// frontend/src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/api";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, thunkAPI) => {
    try {
      const res = await API.post("/auth/login", credentials);
      // Correctly extract data structure from response variations
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

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, thunkAPI) => {
  try {
    const res = await API.get("/users/me");
    const user = res.data;
    if (user && user._id) localStorage.setItem("meId", user._id);
    return user;
  } catch (err) {
    // Clean up tokens on failure
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
    loading: false, // for login/register
    error: null,
    checkingAuth: !!localStorage.getItem("token"), // for initial check
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("meId");
      state.checkingAuth = false;
    },
    clearError: (state) => { state.error = null; },
    setUser: (state, action) => { state.user = action.payload; state.checkingAuth = false; },
    
    // 🔥 WIRED UP: Update user state locally (e.g. after profile edit)
    updateAuthUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Login
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.checkingAuth = false; s.error = null; })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.user = null; s.error = a.payload; s.checkingAuth = false; })
      // --- Fetch Me (Startup Check)
      .addCase(fetchMe.pending, (s) => { s.checkingAuth = true; })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.checkingAuth = false; s.error = null; })
      .addCase(fetchMe.rejected, (s, a) => { s.user = null; s.checkingAuth = false; s.error = a.payload; });
  }
});

export const { logout, clearError, setUser, updateAuthUser } = authSlice.actions;
export default authSlice.reducer;