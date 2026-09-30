import React from "react";

interface QrProps {
  value: string;
  size?: number;
  label?: string;
}

/**
 * High-precision vector QR Code simulation with brand center emblem
 * Generates an authentic, scan-ready aesthetic for official receipts
 */
export const DocumentQrCode: React.FC<QrProps> = ({ value, size = 80, label }) => {
  // Deterministic pattern generator based on string
  const hash = Array.from(value).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  
  return (
    <div className="inline-flex flex-col items-center justify-center p-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs select-none">
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* QR Background */}
        <rect width="100" height="100" fill="#ffffff" />

        {/* 3 Corner Detection Patterns */}
        {/* Top-Left */}
        <rect x="6" y="6" width="26" height="26" fill="#0e3a82" rx="3" />
        <rect x="10" y="10" width="18" height="18" fill="#ffffff" rx="1.5" />
        <rect x="14" y="14" width="10" height="10" fill="#dc2626" rx="1" />

        {/* Top-Right */}
        <rect x="68" y="6" width="26" height="26" fill="#0e3a82" rx="3" />
        <rect x="72" y="10" width="18" height="18" fill="#ffffff" rx="1.5" />
        <rect x="76" y="14" width="10" height="10" fill="#dc2626" rx="1" />

        {/* Bottom-Left */}
        <rect x="6" y="68" width="26" height="26" fill="#0e3a82" rx="3" />
        <rect x="10" y="72" width="18" height="18" fill="#ffffff" rx="1.5" />
        <rect x="14" y="76" width="10" height="10" fill="#dc2626" rx="1" />

        {/* Timing Lines */}
        <line x1="34" y1="19" x2="66" y2="19" stroke="#0e3a82" strokeWidth="2" strokeDasharray="3 3" />
        <line x1="19" y1="34" x2="19" y2="66" stroke="#0e3a82" strokeWidth="2" strokeDasharray="3 3" />

        {/* Realistic Data Pattern Grid */}
        <g fill="#0e3a82">
          {Array.from({ length: 9 }).map((_, r) =>
            Array.from({ length: 9 }).map((_, c) => {
              const x = 32 + c * 4;
              const y = 32 + r * 4;
              const active = ((hash ^ (r * 17 + c * 37)) & (1 << ((r + c) % 8))) !== 0;
              if (active && !(r > 2 && r < 6 && c > 2 && c < 6)) {
                return <rect key={`${r}-${c}`} x={x} y={y} width="3.2" height="3.2" rx="0.6" />;
              }
              return null;
            })
          )}
          {/* Edge dots */}
          <rect x="36" y="10" width="3" height="3" fill="#0e3a82" />
          <rect x="44" y="14" width="3" height="3" fill="#dc2626" />
          <rect x="52" y="10" width="3" height="3" fill="#0e3a82" />
          <rect x="60" y="14" width="3" height="3" fill="#0e3a82" />
          <rect x="10" y="36" width="3" height="3" fill="#0e3a82" />
          <rect x="14" y="44" width="3" height="3" fill="#dc2626" />
          <rect x="10" y="52" width="3" height="3" fill="#0e3a82" />
          <rect x="14" y="60" width="3" height="3" fill="#0e3a82" />
          <rect x="74" y="38" width="3" height="3" fill="#0e3a82" />
          <rect x="84" y="46" width="3" height="3" fill="#0e3a82" />
          <rect x="78" y="56" width="3" height="3" fill="#dc2626" />
          <rect x="86" y="64" width="3" height="3" fill="#0e3a82" />
          <rect x="38" y="74" width="3" height="3" fill="#0e3a82" />
          <rect x="46" y="84" width="3" height="3" fill="#0e3a82" />
          <rect x="56" y="78" width="3" height="3" fill="#dc2626" />
          <rect x="64" y="86" width="3" height="3" fill="#0e3a82" />
        </g>

        {/* Center Emblem Jewel */}
        <circle cx="50" cy="50" r="7.5" fill="#ffffff" stroke="#0e3a82" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="4.5" fill="#dc2626" />
      </svg>
      {label && <span className="text-[8px] font-bold text-slate-500 mt-0.5 tracking-tight">{label}</span>}
    </div>
  );
};

/**
 * Barcode component rendering official Code 128 look
 */
export const DocumentBarcode: React.FC<{ code: string; height?: number }> = ({
  code,
  height = 36,
}) => {
  // Generate pseudo-code128 bars from string
  const bars = Array.from(code).flatMap((char, i) => {
    const codeVal = char.charCodeAt(0);
    return [
      (codeVal & 1) ? 2.5 : 1.2,
      (codeVal & 2) ? 1.5 : 2.8,
      (codeVal & 4) ? 3.0 : 1.0,
      (codeVal & 8) ? 1.8 : 2.2,
    ];
  });

  let curX = 10;

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={bars.length * 3 + 20} height={height} className="select-none">
        {bars.map((w, idx) => {
          const x = curX;
          curX += w + 1.2;
          return idx % 2 === 0 ? (
            <rect key={idx} x={x} y="0" width={w} height={height - 8} fill="#0e3a82" />
          ) : null;
        })}
      </svg>
      <span className="font-mono text-[9px] font-bold tracking-widest text-slate-600 -mt-1">
        *{code}*
      </span>
    </div>
  );
};

/**
 * Official embossed stamp seal of Ocean Flower
 */
export const OfficialEmbossedSeal: React.FC<{
  dateStr?: string;
  className?: string;
  size?: number;
}> = ({ dateStr, className = "", size = 96 }) => {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-90 transform -rotate-12 hover:rotate-0 transition-transform duration-300"
      >
        {/* Outer Circular Serrated / Dotted Ring */}
        <circle
          cx="80"
          cy="80"
          r="74"
          stroke="#0e3a82"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          fill="#f0f7ff"
          fillOpacity="0.3"
        />
        <circle cx="80" cy="80" r="69" stroke="#dc2626" strokeWidth="1.5" />
        <circle cx="80" cy="80" r="50" stroke="#0e3a82" strokeWidth="1" strokeDasharray="2 2" />

        {/* Circular Curved Text Paths */}
        <defs>
          <path id="sealTopTextPath" d="M 22 80 A 58 58 0 0 1 138 80" />
          <path id="sealBottomTextPath" d="M 138 80 A 58 58 0 0 1 22 80" />
        </defs>

        {/* Top Text: زهرة المحيط لتصدير الأسماك */}
        <text fill="#0e3a82" fontSize="9.5" fontWeight="900" letterSpacing="0.5">
          <textPath href="#sealTopTextPath" startOffset="50%" textAnchor="middle">
            زهرة المحيط لتصدير الأسماك
          </textPath>
        </text>

        {/* Bottom Text: OCEAN FLOWER FISH EXPORT */}
        <text fill="#dc2626" fontSize="7.5" fontWeight="800" letterSpacing="1">
          <textPath href="#sealBottomTextPath" startOffset="50%" textAnchor="middle">
            OFFICIAL STAMP • معتمد
          </textPath>
        </text>

        {/* Center Graphics */}
        <g transform="translate(62, 58) scale(0.18)">
          {/* Center 3 Petals */}
          <path d="M 66 122 C 54 98, 62 66, 84 54 C 82 78, 86 100, 94 120 Z" fill="#0e3a82" />
          <path d="M 134 122 C 146 98, 138 66, 116 54 C 118 78, 114 100, 106 120 Z" fill="#0e3a82" />
          <path d="M 100 36 C 82 62, 82 92, 94 122 Q 100 123 106 122 C 118 92, 118 62, 100 36 Z" fill="#dc2626" />
          <path d="M 10 135 Q 55 125, 100 138 T 190 135 L 190 170 L 10 170 Z" fill="#0e3a82" />
        </g>

        {/* Center Text */}
        <text
          x="80"
          y="102"
          textAnchor="middle"
          fill="#0e3a82"
          fontSize="7.5"
          fontWeight="900"
          fontFamily="monospace"
        >
          {dateStr || "VERIFIED"}
        </text>

        {/* Decorative Stars */}
        <text x="26" y="83" fill="#dc2626" fontSize="10" fontWeight="bold">★</text>
        <text x="127" y="83" fill="#dc2626" fontSize="10" fontWeight="bold">★</text>
      </svg>
    </div>
  );
};

