import React from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner-native';

export const Toaster = () => {
  return (
    <SonnerToaster
      position="top-center"
      theme="system"
      richColors
      closeButton
      autoWiggleOnUpdate="always"
    />
  );
};

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description });
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description });
  },
  message: (message: string, description?: string) => {
    sonnerToast(message, { description });
  },
};
