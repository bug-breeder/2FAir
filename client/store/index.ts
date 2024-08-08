// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";

import otpReducer from "@/store/otp-slice";
import loginHistoryReducer from "@/store/login-history-slice";
import authReducer from "@/store/auth-slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    otp: otpReducer,
    loginHistory: loginHistoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
