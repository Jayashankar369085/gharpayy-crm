// @ts-nocheck
import * as React from "react";
export type ToastProps = React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" };
export type ToastActionElement = React.ReactElement;
export const ToastProvider = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const ToastViewport = () => null;
export const Toast = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const ToastTitle = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const ToastDescription = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const ToastClose = () => null;
export const ToastAction = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
