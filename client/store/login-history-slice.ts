// src/store/loginHistorySlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import axiosClient from "@/libs/axios";

interface LoginHistoryState {
  history: Array<{ timestamp: string; provider: string }>;
  loading: boolean;
  error: string | null;
}

const initialState: LoginHistoryState = {
  history: [],
  loading: false,
  error: null,
};

export const fetchLoginHistory = createAsyncThunk(
  "loginHistory/fetchLoginHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/login-history");

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

const loginHistorySlice = createSlice({
  name: "loginHistory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoginHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLoginHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchLoginHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default loginHistorySlice.reducer;
