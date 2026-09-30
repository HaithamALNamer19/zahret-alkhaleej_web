"use client";

import React from "react";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  label?: string;
}

export function PrintButton({ label = "طباعة المستند (A4)" }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-sm active:scale-95"
    >
      <Printer className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
