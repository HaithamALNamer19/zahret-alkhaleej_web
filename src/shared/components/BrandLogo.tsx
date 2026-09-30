import React from "react";

interface EmblemProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

/**
 * The official circular emblem for "زهرة المحيط لتصدير الأسماك / Ocean Flower For Fishes Exporting"
 * Exact replication of the visual brand:
 * - Outer navy ring with inner crimson accent border
 * - Stylized marine waves at base in gradient ocean navy/blue
 * - Three flower petals / droplets: vibrant crimson center petal, sapphire blue lateral petals
 * - Stylized brand typography "Ocean FLOWER"
 */
export const OceanFlowerEmblem: React.FC<EmblemProps> = ({
  className = "",
  size = 48,
  showText = false,
}) => {
  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm select-none"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="ofNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a4ca8" />
            <stop offset="50%" stopColor="#0e3a82" />
            <stop offset="100%" stopColor="#08204d" />
          </linearGradient>

          <linearGradient id="ofRedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="60%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          <linearGradient id="ofWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0b2e6b" />
            <stop offset="50%" stopColor="#124ca6" />
            <stop offset="100%" stopColor="#0e3a82" />
          </linearGradient>

          <linearGradient id="ofPetalBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#0e3a82" />
          </linearGradient>

          <clipPath id="emblemCircle">
            <circle cx="100" cy="100" r="92" />
          </clipPath>
        </defs>

        {/* Outer Frame Circle */}
        <circle cx="100" cy="100" r="94" stroke="#0e3a82" strokeWidth="5" fill="#ffffff" />
        <circle cx="100" cy="100" r="88" stroke="#dc2626" strokeWidth="2.5" fill="none" />

        {/* Inner Content Clipped */}
        <g clipPath="url(#emblemCircle)">
          {/* Background clean white / light oceanic tint */}
          <circle cx="100" cy="100" r="88" fill="#ffffff" />

          {/* Background subtle radial glow */}
          <circle cx="100" cy="90" r="60" fill="#f0f7ff" opacity="0.6" />

          {/* === FLOWER PETALS (Emerging from ocean) === */}
          {/* Left Petal (Blue Ocean Petal) */}
          <path
            d="M 66 122 C 54 98, 62 66, 84 54 C 82 78, 86 100, 94 120 C 84 122, 74 123, 66 122 Z"
            fill="url(#ofPetalBlueGrad)"
          />

          {/* Right Petal (Blue Ocean Petal) */}
          <path
            d="M 134 122 C 146 98, 138 66, 116 54 C 118 78, 114 100, 106 120 C 116 122, 126 123, 134 122 Z"
            fill="url(#ofPetalBlueGrad)"
          />

          {/* Center Petal (Vibrant Crimson Ruby Petal) - Prominent & Dominant */}
          <path
            d="M 100 36 C 82 62, 82 92, 94 122 C 98 123, 102 123, 106 122 C 118 92, 118 62, 100 36 Z"
            fill="url(#ofRedGrad)"
          />

          {/* Center Petal Inner Highlight */}
          <path
            d="M 100 44 C 90 68, 92 88, 98 114 C 100 114, 100 114, 102 114 C 108 88, 110 68, 100 44 Z"
            fill="#ffffff"
            opacity="0.3"
          />

          {/* === OCEAN WAVES (At base) === */}
          {/* Back Wave */}
          <path
            d="M 10 135 Q 55 125, 100 138 T 190 135 L 190 195 L 10 195 Z"
            fill="#08204d"
            opacity="0.4"
          />

          {/* Middle Wave */}
          <path
            d="M 8 144 Q 50 130, 98 146 T 192 142 L 192 195 L 8 195 Z"
            fill="url(#ofNavyGrad)"
          />

          {/* Wave Crests Foam Accent (Red & White ribbons) */}
          <path
            d="M 12 154 Q 60 142, 102 156 Q 148 142, 188 152"
            stroke="#dc2626"
            strokeWidth="3.5"
            fill="none"
          />

          {/* Front Foreground Wave */}
          <path
            d="M 5 158 Q 50 146, 100 160 T 195 154 L 195 195 L 5 195 Z"
            fill="url(#ofWaveGrad)"
          />

          <path
            d="M 5 168 Q 50 156, 100 170 T 195 164 L 195 195 L 5 195 Z"
            fill="#08204d"
          />
        </g>
      </svg>

      {showText && (
        <div className="mt-1 text-center">
          <div className="font-extrabold tracking-wider text-[#0e3a82] text-xs uppercase leading-tight">
            Ocean <span className="text-[#dc2626]">Flower</span>
          </div>
          <div className="text-[10px] font-bold text-slate-500">لصيد وتصدير الأسماك</div>
        </div>
      )}
    </div>
  );
};

/**
 * Faint semi-transparent watermark of the Ocean Flower emblem for printable document pages
 */
export const OceanFlowerWatermark: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none ${className}`}
    >
      <div className="opacity-[0.045] transform scale-125">
        <OceanFlowerEmblem size={440} showText={false} />
      </div>
    </div>
  );
};

