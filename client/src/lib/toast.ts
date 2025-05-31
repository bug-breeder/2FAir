import { addToast } from "@heroui/toast";

export const toast = {
  success: (message: string) => {
    addToast({
      title: message,
      color: "success",
      timeout: 4000,
    });
  },
  
  error: (message: string) => {
    addToast({
      title: message,
      color: "danger",
      timeout: 4000,
    });
  },
  
  info: (message: string) => {
    addToast({
      title: message,
      color: "primary",
      timeout: 4000,
    });
  },
  
  warning: (message: string) => {
    addToast({
      title: message,
      color: "warning",
      timeout: 4000,
    });
  },
}; 