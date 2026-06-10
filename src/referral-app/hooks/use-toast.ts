// @ts-nocheck
import { toast as sonnerToast } from "sonner";

type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
};

export function toast(input: ToastInput | string) {
  if (typeof input === "string") return sonnerToast(input);
  const { title, description, variant } = input;
  const message = (title ?? description ?? "") as string;
  if (variant === "destructive") return sonnerToast.error(message, { description: title ? (description as any) : undefined });
  return sonnerToast(message, { description: title ? (description as any) : undefined });
}

export function useToast() {
  return { toast, toasts: [] as any[], dismiss: () => {} };
}
