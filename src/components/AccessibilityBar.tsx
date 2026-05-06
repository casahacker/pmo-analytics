import React from "react";
import { cn } from "../lib/utils";

interface AccessibilityBarProps {
  highContrast: boolean;
  onHighContrastToggle: () => void;
  fontScale: 0 | 1 | 2;
  onFontScaleChange: (v: 0 | 1 | 2) => void;
  onReset: () => void;
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({
  highContrast,
  onHighContrastToggle,
  fontScale,
  onFontScaleChange,
  onReset,
}) => {
  const hasCustomSettings = highContrast || fontScale !== 0;
  return (
    <div
      role="toolbar"
      aria-label="Controles de acessibilidade"
      className="w-full bg-[#1c1c1c] text-[#cccccc] flex items-center justify-end gap-1 px-4 h-8 shrink-0 print:hidden"
    >
      {/* High contrast */}
      <button
        onClick={onHighContrastToggle}
        aria-pressed={highContrast}
        aria-label={highContrast ? "Desativar alto contraste" : "Ativar alto contraste"}
        title={highContrast ? "Desativar alto contraste" : "Ativar alto contraste"}
        className={cn(
          "flex items-center gap-1.5 px-2 h-6 rounded text-[11px] font-bold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400",
          highContrast
            ? "bg-yellow-400 text-black"
            : "hover:bg-white/10 text-[#cccccc]"
        )}
      >
        {/* Half-circle icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 1a6 6 0 0 1 0 12V1z" fill="currentColor" />
        </svg>
        <span className="hidden sm:inline">Alto Contraste</span>
      </button>

      <div className="w-px h-4 bg-white/20 mx-1" aria-hidden="true" />

      {/* Font size controls */}
      <div className="flex items-center gap-0.5" role="group" aria-label="Tamanho de fonte">
        <button
          onClick={() => onFontScaleChange(Math.min(2, fontScale + 1) as 0 | 1 | 2)}
          disabled={fontScale === 2}
          aria-label="Aumentar fonte"
          title="Aumentar fonte"
          className="flex items-center justify-center w-7 h-6 rounded text-[13px] font-bold transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          A+
        </button>
        <button
          onClick={() => onFontScaleChange(Math.max(0, fontScale - 1) as 0 | 1 | 2)}
          disabled={fontScale === 0}
          aria-label="Diminuir fonte"
          title="Diminuir fonte"
          className="flex items-center justify-center w-7 h-6 rounded text-[11px] font-bold transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          A-
        </button>
        <span className="hidden sm:inline ml-1 text-[10px] font-bold uppercase tracking-wide text-[#888]">
          Tamanho de Fonte
        </span>
      </div>

      {/* Reset button — only visible when any setting is active */}
      {hasCustomSettings && (
        <>
          <div className="w-px h-4 bg-white/20 mx-1" aria-hidden="true" />
          <button
            onClick={onReset}
            aria-label="Redefinir configurações de acessibilidade"
            title="Redefinir tudo ao padrão"
            className="flex items-center gap-1 px-2 h-6 rounded text-[11px] font-bold uppercase tracking-wide text-[#aaa] hover:bg-white/10 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            Redefinir
          </button>
        </>
      )}
    </div>
  );
};
