import React from "react";
import { OceanFlowerEmblem, OceanFlowerWatermark } from "./BrandLogo";

interface OfficialLetterheadProps {
  children: React.ReactNode;
  receiptNumber?: string;
  dateArabic?: string;
  dateEnglish?: string;
  documentTitle: string;
  documentSubtitle?: string;
  isCancelled?: boolean;
  cancellationReason?: string;
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
}) => {
  return (
    <div className="relative bg-white w-full max-w-[210mm] mx-auto min-h-[297mm] shadow-lg print:shadow-none border border-slate-200 print:border-none flex flex-col justify-between overflow-hidden text-slate-900 font-sans print:m-0 print:p-0">
      {/* Background Watermark */}
      <OceanFlowerWatermark />

      {/* TOP HEADER SECTION */}
      <div className="relative z-10">
        {/* Top Wave Graphic Ribbon */}
        <div className="w-full h-7 overflow-hidden relative">
          <svg
            className="w-full h-full"
            viewBox="0 0 1000 35"
            preserveAspectRatio="none"
            fill="none"
          >
            {/* Top Red Curve */}
            <path
              d="M0 0 L1000 0 L1000 12 Q750 32 500 10 Q250 -10 0 16 Z"
              fill="#dc2626"
            />
            {/* Top Navy Blue Curve */}
            <path
              d="M0 0 L1000 0 L1000 18 Q750 6 500 24 Q250 36 0 12 Z"
              fill="#0e3a82"
              opacity="0.95"
            />
            {/* Inner accent wave */}
            <path
              d="M0 0 L1000 0 L1000 8 Q800 24 500 14 Q200 4 0 6 Z"
              fill="#1d62ca"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* Brand Information Header (3 Columns) */}
        <div className="px-8 pt-3 pb-2 flex items-start justify-between gap-4">
          {/* Right Column: Arabic Brand & Contact Info */}
          <div className="text-right flex-1 space-y-0.5">
            <h1 className="text-xl font-black tracking-tight leading-tight">
              <span className="text-[#dc2626]">زهرة المحيط</span>{" "}
              <span className="text-[#0e3a82]">لتصدير الأسماك</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-700">
              المكلا - حضرموت - الجمهورية اليمنية
            </p>
            <div className="text-[10px] text-slate-600 font-medium space-y-0.5 pt-0.5">
              <div>
                <span className="text-slate-500">تلفاكس:</span>{" "}
                <span dir="ltr" className="font-mono font-semibold">+967 5 388211</span>
              </div>
              <div>
                <span className="text-slate-500">جوال:</span>{" "}
                <span dir="ltr" className="font-mono font-semibold">733854999 / 776615111 / 73454191</span>
              </div>
              <div>
                <span className="text-slate-500">ص.ب:</span>{" "}
                <span className="font-mono font-semibold">62144</span>
              </div>
            </div>
          </div>

          {/* Center Column: Official Brand Emblem & Logo */}
          <div className="flex flex-col items-center justify-center shrink-0 px-2">
            <OceanFlowerEmblem size={72} showText={false} />
            <div className="mt-1 text-center select-none">
              <span className="text-xs font-black tracking-widest text-[#0e3a82] uppercase block font-serif">
                Ocean <span className="text-[#dc2626]">FLOWER</span>
              </span>
              <span className="text-[8px] font-extrabold tracking-wider text-slate-500 block">
                FOR FISHES EXPORTING
              </span>
            </div>
          </div>

          {/* Left Column: English Brand & Contact Info */}
          <div className="text-left flex-1 space-y-0.5" dir="ltr">
            <h2 className="text-lg font-black tracking-tight text-[#0e3a82] leading-tight">
              Ocean Flower
            </h2>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
              For Fishes Exporting
            </p>
            <div className="text-[9.5px] text-slate-600 font-medium space-y-0.5 pt-0.5">
              <div>Mukalla - Hadhramout - Yemen</div>
              <div>
                <span className="text-slate-500">Tel/Fax:</span>{" "}
                <span className="font-mono font-semibold">+967 5 388211</span>
              </div>
              <div>
                <span className="text-slate-500">Mob:</span>{" "}
                <span className="font-mono font-semibold">733854999 / 776615111</span>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>{" "}
                <span className="font-mono font-semibold">oceanflower.ltd@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Official Date & Ref Bar with Central Angular Shield Motif */}
        <div className="px-8 mt-1">
          <div className="relative border-t-2 border-b border-[#0e3a82] py-1.5 flex items-center justify-between text-xs">
            {/* Arabic Details */}
            <div className="flex items-center gap-4 text-right">
              {receiptNumber && (
                <div>
                  <span className="text-slate-500 font-bold">رقم السند:</span>{" "}
                  <strong className="text-[#0e3a82] font-black font-mono text-sm">
                    {receiptNumber}
                  </strong>
                </div>
              )}
              {dateArabic && (
                <div>
                  <span className="text-slate-500 font-bold">التاريخ:</span>{" "}
                  <strong className="font-mono font-bold text-slate-800">{dateArabic}</strong>
                </div>
              )}
            </div>

            {/* Central Decorative Brand Accent (Navy & Red Polygon) */}
            <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 flex items-center justify-center">
              <svg width="64" height="20" viewBox="0 0 64 20" fill="none">
                <polygon points="12,0 52,0 44,20 20,20" fill="#0e3a82" />
                <polygon points="24,2 40,2 36,18 28,18" fill="#dc2626" />
                <circle cx="32" cy="10" r="2.5" fill="#ffffff" />
              </svg>
            </div>

            {/* English Details */}
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
        <div className="px-8 mt-4 text-center">
          <div className="inline-block relative">
            <div className="bg-gradient-to-r from-[#0e3a82] via-[#124ca6] to-[#0e3a82] text-white font-black text-base py-1.5 px-8 rounded-lg shadow-sm border border-blue-900 tracking-wide">
              {documentTitle}
            </div>
            {documentSubtitle && (
              <span className="block text-[11px] font-bold text-slate-500 mt-1">
                {documentSubtitle}
              </span>
            )}
          </div>

          {/* Cancellation Warning Banner if Cancelled */}
          {isCancelled && (
            <div className="mt-2 text-rose-700 font-black text-xs border-2 border-rose-500 bg-rose-50 py-1.5 px-4 rounded-lg inline-block">
              ⚠️ هذا السند ملغي رسمياً (CANCELLED)
              {cancellationReason && ` — سبب الإلغاء: ${cancellationReason}`}
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT BODY CONTENT */}
      <div className="relative z-10 flex-1 px-8 py-4">{children}</div>

      {/* FOOTER SECTION */}
      <div className="relative z-10 mt-auto">
        {/* Signatures Row if needed by page */}
        <div className="px-8 pb-3 text-center text-xs text-slate-600 font-medium flex items-center justify-between border-t border-slate-200 pt-2">
          <span>الجمهورية اليمنية - وزارة الثروة السمكية - ص.ب: 62144</span>
          <span className="font-mono text-[11px]">Website: www.oceanflowerfish.com</span>
          <span className="font-mono text-[11px]">oceanflower.ltd@gmail.com</span>
        </div>

        {/* Bottom Curved Wave Ribbon */}
        <div className="w-full h-8 overflow-hidden relative">
          <svg
            className="w-full h-full"
            viewBox="0 0 1000 40"
            preserveAspectRatio="none"
            fill="none"
          >
            {/* Red Accent Wave */}
            <path
              d="M0 35 Q250 5 500 26 Q750 45 1000 20 L1000 40 L0 40 Z"
              fill="#dc2626"
            />
            {/* Deep Navy Main Bottom Wave */}
            <path
              d="M0 25 Q250 42 500 18 Q750 -4 1000 26 L1000 40 L0 40 Z"
              fill="#0e3a82"
            />
            {/* Light Blue Foam Line */}
            <path
              d="M0 27 Q250 44 500 20 Q750 -2 1000 28"
              stroke="#60a5fa"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

