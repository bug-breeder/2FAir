// src/store/otpSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "@/libs/axios";

interface OTP {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  period: number;
  active: boolean;
}

interface OTPState {
  otps: OTP[];
  loading: boolean;
  error: string | null;
}

const initialState: OTPState = {
  otps: [],
  loading: false,
  error: null,
};

export const addOTP = createAsyncThunk(
  "otp/addOTP",
  async (otp: Partial<OTP>, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/otps", otp);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const listOTPs = createAsyncThunk(
  "otp/listOTPs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/otps");

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const inactivateOTP = createAsyncThunk(
  "otp/inactivateOTP",
  async (otpID: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/otps/${otpID}/inactivate`);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

const otpSlice = createSlice({
  name: "otp",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.otps.push(action.payload);
      })
      .addCase(addOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(listOTPs.pending, (state) => {
        state.loading = true;
      })
      .addCase(listOTPs.fulfilled, (state, action) => {
        state.loading = false;
        state.otps = action.payload;
      })
      .addCase(listOTPs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(inactivateOTP.fulfilled, (state, action) => {
        const index = state.otps.findIndex(
          (otp) => otp.id === action.payload.id
        );

        if (index !== -1) {
          state.otps[index].active = false;
        }
      });
  },
});

export default otpSlice.reducer;
