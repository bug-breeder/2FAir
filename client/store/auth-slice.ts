// src/store/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import axiosClient from "@/libs/axios";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const startAuth = createAsyncThunk(
  "auth/startAuth",
  async (provider: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/auth/${provider}`);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  "auth/refreshAuthToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/auth/refresh");

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/auth/logout");

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(startAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startAuth.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(startAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(refreshAuthToken.fulfilled, (state) => {
        state.isAuthenticated = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
      });
  },
});

export default authSlice.reducer;
