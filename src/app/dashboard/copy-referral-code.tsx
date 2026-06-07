"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyReferralCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-4 py-2.5 transition-colors group"
    >
      <span className="font-mono text-lg font-black text-white tracking-widest">{code}</span>
      {copied
        ? <Check className="h-4 w-4 text-green-400 shrink-0" />
        : <Copy className="h-4 w-4 text-gray-500 group-hover:text-gray-300 shrink-0 transition-colors" />
      }
    </button>
  );
}
