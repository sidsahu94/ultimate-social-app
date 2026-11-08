// frontend/src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/api";

// --- THUNKS ---

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, thunkAPI) => {
    try {
      const res = await API.post("/auth/login", credentials);
      
      // Handle both Unified ({ success: true, data: {...} }) and Legacy formats
      const payload = res.data.data || res.data;
      
      const { token, refreshToken, user } = payload;
      
      // Store credentials securely
      if (token) localStorage.setItem("token", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
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
    const token = localStorage.getItem('token');
    // Don't even try if no token exists
    if (!token) return null;

    const res = await API.get("/users/me");
    const user = res.data.data || res.data;
    if (user?._id) {
      localStorage.setItem("meId", user._id);
    }
    return user;
  } catch (err) {
    // Only clear local session if the token is explicitly rejected by the server
    if (err?.response?.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
    }
    return thunkAPI.rejectWithValue(err?.response?.status || 'Network Error'); 
  }
});

// Used for optimistic UI updates (e.g. Profile Edit, Wallet Balance update)
export const updateAuthUser = createAsyncThunk(
    "auth/updateUser", 
    async (userData, thunkAPI) => {
        return userData; // Passes data directly to the reducer
    }
);

// --- SLICE ---

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false, 
    error: null,
    // Start checking auth only if a token exists in storage
    checkingAuth: !!localStorage.getItem("token"), 
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      state.loading = false;
      state.checkingAuth = false;
      
      // Full Cleanup: Clear all local and session cache scopes
      localStorage.clear();
      sessionStorage.clear();
    },
    clearError: (state) => { 
        state.error = null; 
    },
    setUser: (state, action) => { 
        state.user = action.payload; 
        state.checkingAuth = false;
        if (action.payload?._id) {
          localStorage.setItem("meId", action.payload._id);
        }
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Login User ---
      .addCase(loginUser.pending, (state) => { 
          state.loading = true; 
          state.error = null; 
      })
      .addCase(loginUser.fulfilled, (state, action) => { 
          state.loading = false; 
          state.user = action.payload; 
          state.checkingAuth = false; 
          state.error = null; 
      })
      .addCase(loginUser.rejected, (state, action) => { 
          state.loading = false; 
          state.user = null;
          state.error = action.payload; 
          state.checkingAuth = false; 
      })
      
      // --- Fetch Me (Session Check) ---
      .addCase(fetchMe.pending, (state) => { 
          state.checkingAuth = true; 
      })
      .addCase(fetchMe.fulfilled, (state, action) => { 
          state.user = action.payload || null; 
          state.checkingAuth = false; 
          state.error = null;
      })
      .addCase(fetchMe.rejected, (state, action) => { 
          state.user = null; 
          state.checkingAuth = false; 
          
          if (action.payload === 401) {
              localStorage.clear();
              sessionStorage.clear();
          }
      })

      // --- Manual Update ---
      .addCase(updateAuthUser.fulfilled, (state, action) => {
          if (state.user) {
              // Merge new data into existing user object
              state.user = { ...state.user, ...action.payload };
          }
      });
  }
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;