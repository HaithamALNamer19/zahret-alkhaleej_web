"use client";

import React, { useState } from "react";
import { OceanFlowerEmblem, OceanFlowerWatermark } from "./BrandLogo";
import { DocumentQrCode, DocumentBarcode } from "./DocumentSecurity";
import { Printer, FileText, CheckCircle2, SlidersHorizontal } from "lucide-react";

export type LetterheadMode = "authentic" | "vector" | "preprinted";

interface OfficialLetterheadProps {
  children: React.ReactNode;
  receiptNumber?: string;
  dateArabic?: string;
  dateEnglish?: string;
  documentTitle: string;
  documentSubtitle?: string;
  isCancelled?: boolean;
  cancellationReason?: string;
  qrValue?: string;
}

export const OfficialLetterhead: React.FC<OfficialLetterheadProps> = ({
  children,
  receiptNumber,
  dateArabic,
  dateEnglish,
  documentTitle,
  documentSubtitle,
  isCancelled = false,
  cancellationReason,
  qrValue,
}) => {
  // Mode selection:
  // "authentic": Uses the exact high-res scanned official corporate stationery (/images/letterhead.jpg)
  // "vector": Uses the crisp, infinite-resolution SVG vector letterhead
  // "preprinted": For printing only content onto physical pre-printed letterhead paper
  const [mode, setMode] = useState<LetterheadMode>("authentic");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Top Floating Print Controller (Hidden in Print) */}
      <div className="w-full max-w-[210mm] mb-6 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#0e3a82] to-[#08204d] text-white shadow-xs">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">نمط الطباعة:</span>
            <span className="text-[11px] text-slate-500 font-medium">
              اختر نوع الورق قبل الطباعة
            </span>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
          <button
            type="button"
            onClick={() => setMode("authentic")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === "authentic"
                ? "bg-white text-[#0e3a82] shadow-xs font-black border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>طباعة كاملة مع الترويسة</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("vector")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === "vector"
                ? "bg-white text-[#0e3a82] shadow-xs font-black border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0e3a82]" />
            <span>ترويسة رقمية واضحة</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("preprinted")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === "preprinted"
                ? "bg-white text-[#0e3a82] shadow-xs font-black border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>ورق مروّس جاهز (محتوى فقط)</span>
          </button>
        </div>

        {/* Print Trigger Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0e3a82] to-[#124ca6] hover:from-[#0b2e6b] hover:to-[#0e3a82] text-white font-bold text-xs shadow-md transition-all active:scale-95 active:shadow-inner flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة السند</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* THE A4 PRINTABLE DOCUMENT CONTAINER                            */}
      {/* ============================================================== */}
      <div
        className={`relative bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none border border-slate-300 print:border-none flex flex-col justify-between overflow-hidden text-slate-900 font-sans print:m-0 print:p-0 ${
          mode === "authentic" ? "letterhead-authentic-bg" : ""
        }`}
        style={
          mode === "authentic"
            ? {
                backgroundImage: "url('/images/letterhead.jpg')",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }
            : undefined
        }
      >
        {/* ========================================================== */}
        {/* MODE A: AUTHENTIC SCANNED LETTERHEAD BACKGROUND OVERLAY    */}
        {/* ========================================================== */}
        {mode === "authentic" && (
          <>
            {/* Top Date & Reference Overlays onto the printed line */}
            <div className="pt-[168px] px-14 pb-2 flex items-center justify-between text-xs z-20">
              {/* Arabic Info */}
              <div className="text-right space-y-0.5">
                {dateArabic && (
                  <div className="text-slate-800 font-bold">
                    <span className="text-slate-500 font-semibold">التاريخ:</span>{" "}
                    <strong className="font-mono text-sm text-[#0e3a82]">{dateArabic}</strong>
                  </div>
                )}
                {receiptNumber && (
                  <div className="text-slate-700">
                    <span className="text-slate-500 font-semibold">رقم السند:</span>{" "}
                    <strong className="font-mono text-xs font-black text-[#dc2626]">
                      {receiptNumber}
                    </strong>
                  </div>
                )}
              </div>

              {/* Center Barcode */}
              {receiptNumber && (
                <div className="hidden sm:block opacity-90">
                  <DocumentBarcode code={receiptNumber} height={30} />
                </div>
              )}

              {/* English Info */}
              <div className="text-left font-mono space-y-0.5" dir="ltr">
                {dateEnglish && (
                  <div className="text-slate-800 font-bold text-xs">
                    <span className="text-slate-500">Date:</span>{" "}
                    <strong className="text-[#0e3a82]">{dateEnglish}</strong>
                  </div>
                )}
                {receiptNumber && (
                  <div className="text-slate-700 text-xs">
                    <span className="text-slate-500">Ref:</span>{" "}
                    <strong className="text-[#dc2626] font-bold">{receiptNumber}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="px-12 mt-2 text-center z-20">
              <div className="inline-block relative">
                <div className="bg-gradient-to-r from-[#0e3a82] via-[#124ca6] to-[#0e3a82] text-white font-black text-sm py-1 px-8 rounded-lg shadow-sm border border-blue-950 tracking-wider">
                  {documentTitle}
                </div>
                {documentSubtitle && (
                  <span className="block text-[10px] font-black text-slate-600 mt-0.5 tracking-wider uppercase">
                    {documentSubtitle}
                  </span>
                )}
              </div>

              {/* Cancellation Banner */}
              {isCancelled && (
                <div className="mt-1 text-rose-700 font-black text-xs border-2 border-rose-500 bg-rose-50/95 py-1 px-4 rounded-lg inline-block shadow-xs">
                  ⚠️ هذا السند ملغي رسمياً في النظام (CANCELLED)
                  {cancellationReason && ` — سبب الإلغاء: ${cancellationReason}`}
                </div>
              )}
            </div>

            {/* Document Body Content */}
            <div className="px-12 py-3 z-20 flex-1">{children}</div>

            {/* Bottom Spacer to prevent overlap with footer waves */}
            <div className="h-[95px] w-full z-10 pointer-events-none" />
          </>
        )}

        {/* ========================================================== */}
        {/* MODE B: PURE DIGITAL VECTOR LETTERHEAD                      */}
        {/* ========================================================== */}
        {mode === "vector" && (
          <>
            <OceanFlowerWatermark />

            {/* Top Wave Graphic Ribbon */}
            <div className="w-full h-8 overflow-hidden relative z-10">
              <svg className="w-full h-full" viewBox="0 0 1000 35" preserveAspectRatio="none" fill="none">
                <path d="M0 0 L1000 0 L1000 12 Q750 32 500 10 Q250 -10 0 16 Z" fill="#dc2626" />
                <path d="M0 0 L1000 0 L1000 18 Q750 6 500 24 Q250 36 0 12 Z" fill="#0e3a82" opacity="0.95" />
                <path d="M0 0 L1000 0 L1000 8 Q800 24 500 14 Q200 4 0 6 Z" fill="#1d62ca" opacity="0.5" />
              </svg>
            </div>

            {/* Header Columns */}
            <div className="px-10 pt-3 pb-2 flex items-start justify-between gap-4 z-10">
              {/* Right: Arabic */}
              <div className="text-right flex-1 space-y-0.5">
                <h1 className="text-xl font-black tracking-tight leading-tight">
                  <span className="text-[#dc2626]">زهرة المحيط</span>{" "}
                  <span className="text-[#0e3a82]">لتصدير الأسماك</span>
                </h1>
                <p className="text-[11px] font-bold text-slate-700">المكلا - حضرموت - الجمهورية اليمنية</p>
                <div className="text-[10px] text-slate-600 font-medium space-y-0.5 pt-0.5">
                  <div>تلفاكس: <span dir="ltr" className="font-mono font-bold">+967 5 388211</span></div>
                  <div>جوال: <span dir="ltr" className="font-mono font-bold">733854999 / 776615111 / 73454191</span></div>
                  <div>ص.ب: <span className="font-mono font-bold">62144</span></div>
                </div>
              </div>

              {/* Center: Emblem */}
              <div className="flex flex-col items-center justify-center shrink-0 px-2">
                <OceanFlowerEmblem size={76} showText={false} />
                <div className="mt-1 text-center select-none">
                  <span className="text-xs font-black tracking-widest text-[#0e3a82] uppercase block font-serif">
                    Ocean <span className="text-[#dc2626]">FLOWER</span>
                  </span>
                  <span className="text-[8px] font-extrabold tracking-wider text-slate-500 block">
                    FOR FISHES EXPORTING
                  </span>
                </div>
              </div>

              {/* Left: English */}
              <div className="text-left flex-1 space-y-0.5" dir="ltr">
                <h2 className="text-lg font-black tracking-tight text-[#0e3a82] leading-tight">Ocean Flower</h2>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">For Fishes Exporting</p>
                <div className="text-[9.5px] text-slate-600 font-medium space-y-0.5 pt-0.5">
                  <div>Mukalla - Hadhramout - Yemen</div>
                  <div>Tel/Fax: <span className="font-mono font-bold">+967 5 388211</span></div>
                  <div>Mob: <span className="font-mono font-bold">733854999 / 776615111</span></div>
                  <div>Email: <span className="font-mono font-bold">oceanflower.ltd@gmail.com</span></div>
                </div>
              </div>
            </div>

            {/* Official Date & Ref Bar */}
            <div className="px-10 mt-1 z-10">
              <div className="relative border-t-2 border-b border-[#0e3a82] py-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-right">
                  {receiptNumber && (
                    <div>
                      <span className="text-slate-500 font-bold">رقم السند:</span>{" "}
                      <strong className="text-[#0e3a82] font-black font-mono text-sm">{receiptNumber}</strong>
                    </div>
                  )}
                  {dateArabic && (
                    <div>
                      <span className="text-slate-500 font-bold">التاريخ:</span>{" "}
                      <strong className="font-mono font-bold text-slate-800">{dateArabic}</strong>
                    </div>
                  )}
                </div>

                {/* Central Decorative Accent */}
                <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 flex items-center justify-center">
                  <svg width="64" height="20" viewBox="0 0 64 20" fill="none">
                    <polygon points="12,0 52,0 44,20 20,20" fill="#0e3a82" />
                    <polygon points="24,2 40,2 36,18 28,18" fill="#dc2626" />
                    <circle cx="32" cy="10" r="2.5" fill="#ffffff" />
                  </svg>
                </div>

                <div className="flex items-center gap-4 text-left font-mono" dir="ltr">
                  {receiptNumber && (
                    <div>
                      <span className="text-slate-500 font-bold">Ref No:</span>{" "}
                      <strong className="text-[#0e3a82] font-bold">{receiptNumber}</strong>
                    </div>
                  )}
                  {dateEnglish && (
                    <div>
                      <span className="text-slate-500 font-bold">Date:</span>{" "}
                      <strong className="text-slate-800 font-bold">{dateEnglish}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="px-10 mt-4 text-center z-10">
              <div className="inline-block relative">
                <div className="bg-gradient-to-r from-[#0e3a82] via-[#124ca6] to-[#0e3a82] text-white font-black text-base py-1.5 px-8 rounded-lg shadow-sm border border-blue-900 tracking-wide">
                  {documentTitle}
                </div>
                {documentSubtitle && (
                  <span className="block text-[11px] font-bold text-slate-500 mt-1">{documentSubtitle}</span>
                )}
              </div>

              {isCancelled && (
                <div className="mt-2 text-rose-700 font-black text-xs border-2 border-rose-500 bg-rose-50 py-1.5 px-4 rounded-lg inline-block">
                  ⚠️ هذا السند ملغي رسمياً (CANCELLED)
                  {cancellationReason && ` — سبب الإلغاء: ${cancellationReason}`}
                </div>
              )}
            </div>

            {/* Document Body Content */}
            <div className="relative z-10 flex-1 px-10 py-4">{children}</div>

            {/* Footer */}
            <div className="relative z-10 mt-auto">
              <div className="px-10 pb-3 text-center text-xs text-slate-600 font-medium flex items-center justify-between border-t border-slate-200 pt-2">
                <span>الجمهورية اليمنية - وزارة الثروة السمكية - ص.ب: 62144</span>
                <span className="font-mono text-[11px]">Website: www.oceanflowerfish.com</span>
                <span className="font-mono text-[11px]">oceanflower.ltd@gmail.com</span>
              </div>

              <div className="w-full h-8 overflow-hidden relative">
                <svg className="w-full h-full" viewBox="0 0 1000 40" preserveAspectRatio="none" fill="none">
                  <path d="M0 35 Q250 5 500 26 Q750 45 1000 20 L1000 40 L0 40 Z" fill="#dc2626" />
                  <path d="M0 25 Q250 42 500 18 Q750 -4 1000 26 L1000 40 L0 40 Z" fill="#0e3a82" />
                  <path d="M0 27 Q250 44 500 20 Q750 -2 1000 28" stroke="#60a5fa" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            </div>
          </>
        )}

        {/* ========================================================== */}
        {/* MODE C: PRE-PRINTED PHYSICAL PAPER (CONTENT ONLY)          */}
        {/* ========================================================== */}
        {mode === "preprinted" && (
          <div className="pt-[190px] pb-[100px] px-12 flex-1 flex flex-col justify-between">
            {/* Minimal Header */}
            <div className="border-b-2 border-slate-800 pb-2 mb-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-bold">السند:</span>{" "}
                <strong className="font-mono text-sm">{receiptNumber}</strong>
              </div>
              <div className="text-center font-black text-sm">
                {documentTitle}
              </div>
              <div>
                <span className="text-slate-500 font-bold">التاريخ:</span>{" "}
                <strong className="font-mono">{dateArabic || dateEnglish}</strong>
              </div>
            </div>

            {/* Document Body */}
            <div className="flex-1">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
};

