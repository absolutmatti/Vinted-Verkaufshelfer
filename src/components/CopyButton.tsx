import React, { useState } from 'react';
import { Check, Clipboard } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label: string;
  compact?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, label, compact = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
        copied
          ? 'border-[#007782] bg-[#E6F4F5] text-[#005F68]'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {copied ? <Check className="w-4 h-4 text-[#007782]" /> : <Clipboard className="w-4 h-4" />}
      <span>{copied ? 'Kopiert!' : compact ? 'Kopieren' : label}</span>
    </button>
  );
};
