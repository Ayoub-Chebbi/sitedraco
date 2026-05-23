"use client";

import { useState, useEffect } from "react";
import { Clock, Flame } from "lucide-react";

type Props = {
  hours: number;
  label?: string;
};

export function UrgencyTimer({ hours, label = "Offre valable encore" }: Props) {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const endKey = `urgency-end-${hours}`;
    let end = Number(localStorage.getItem(endKey));
    if (!end || end < Date.now()) {
      end = Date.now() + hours * 3600 * 1000;
      localStorage.setItem(endKey, String(end));
    }

    function update() {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hours]);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.h === 0 && timeLeft.m < 30;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
      isUrgent
        ? "bg-red-900/20 border-red-700/40 text-red-300"
        : "bg-orange-900/20 border-orange-700/40 text-orange-300"
    }`}>
      {isUrgent ? (
        <Flame className="h-4 w-4 animate-pulse shrink-0" />
      ) : (
        <Clock className="h-4 w-4 shrink-0" />
      )}
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1 ml-auto font-mono">
        {[
          { v: timeLeft.h, label: "h" },
          { v: timeLeft.m, label: "m" },
          { v: timeLeft.s, label: "s" },
        ].map(({ v, label: l }, i) => (
          <span key={l} className="flex items-center gap-0.5">
            {i > 0 && <span className="text-gray-600">:</span>}
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
              isUrgent ? "bg-red-900/40 text-red-200" : "bg-orange-900/40 text-orange-200"
            }`}>
              {v.toString().padStart(2, "0")}
            </span>
            <span className="text-xs opacity-60">{l}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
