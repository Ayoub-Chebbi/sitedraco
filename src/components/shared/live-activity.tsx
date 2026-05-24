"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShoppingBag } from "lucide-react";

const NAMES = ["Aymen", "Sami", "Ines", "Karim", "Nour", "Yassine", "Rania", "Mehdi", "Sara", "Ali"];
const PRODUCTS = [
  "FIFA 25 PS5",
  "God of War Ragnarök",
  "Spider-Man 2 PS5",
  "Fortnite V-Bucks",
  "PlayStation Plus 12 mois",
  "Xbox Game Pass Ultimate",
  "Minecraft Java Edition",
  "GTA V Premium",
  "Call of Duty MW3",
  "Elden Ring",
];

type Notif = { name: string; product: string; time: string };

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeNotif(): Notif {
  return {
    name: NAMES[rand(0, NAMES.length - 1)],
    product: PRODUCTS[rand(0, PRODUCTS.length - 1)],
    time: `il y a ${rand(1, 8)} min`,
  };
}

export function LiveActivity() {
  const [notif, setNotif] = useState<Notif | null>(null);
  const [visible, setVisible] = useState(false);
  const hideRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nextRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(() => {
    setNotif(makeNotif());
    setVisible(false);
    setTimeout(() => {
      setVisible(true);
      hideRef.current = setTimeout(() => {
        setVisible(false);
        nextRef.current = setTimeout(show, rand(7000, 13000));
      }, 4500);
    }, 50);
  }, []);

  useEffect(() => {
    nextRef.current = setTimeout(show, rand(3000, 6000));
    return () => {
      clearTimeout(hideRef.current);
      clearTimeout(nextRef.current);
    };
  }, [show]);

  if (!notif) return null;

  return (
    <div
      className={`fixed bottom-6 left-4 z-50 max-w-[280px] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-900/95 backdrop-blur-sm px-4 py-3 shadow-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600/20">
          <ShoppingBag className="h-4 w-4 text-purple-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {notif.name} a acheté
          </p>
          <p className="text-xs text-gray-400 truncate">{notif.product}</p>
          <p className="text-xs text-gray-600">{notif.time}</p>
        </div>
      </div>
    </div>
  );
}
