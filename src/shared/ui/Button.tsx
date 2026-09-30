"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading: externalLoading,
  loadingText = "جاري التحميل...",
  disabled,
  onClick,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading ?? internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      try {
        const result: unknown = (onClick as Function)(e);
        // If onClick returns a Promise, automatically handle loading state
        if (result && typeof (result as Record<string, any>).then === "function") {
          setInternalLoading(true);
          await (result as Promise<unknown>);
        }
      } catch (error) {
        throw error;
      } finally {
        setInternalLoading(false);
      }
    }
  };

  // Strong tactile depression on active click: scale-95 + translate-y-0.5 + shadow-inner
  const baseStyles =
    "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-75 ease-out select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 active:translate-y-0.5 active:shadow-inner active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:translate-y-0 disabled:active:shadow-none disabled:active:brightness-100";

  const variants = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md focus:ring-primary-500 shadow-sm",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 hover:shadow-sm focus:ring-slate-300 border border-slate-200",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md focus:ring-rose-500 shadow-sm",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:ring-primary-500 shadow-xs",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md focus:ring-emerald-500 shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-2.5 text-base gap-2.5",
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span className="font-semibold">{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

