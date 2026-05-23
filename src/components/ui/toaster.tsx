"use client";

import * as React from "react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastIcons,
} from "@/components/ui/toast";
import { ToastContext } from "@/lib/use-toast";

export function Toaster() {
  const [toasts, setToasts] = React.useState<
    { id: string; title: string; description?: string; variant?: "default" | "success" | "error" | "info" }[]
  >([]);

  const toast = React.useCallback(
    (t: { title: string; description?: string; variant?: "default" | "success" | "error" | "info" }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
    },
    []
  );

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      <ToastProvider>
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant} open>
            <div className="flex items-start gap-2">
              {ToastIcons[t.variant || "default"]}
              <div className="flex-1">
                <ToastTitle>{t.title}</ToastTitle>
                {t.description && <ToastDescription>{t.description}</ToastDescription>}
              </div>
            </div>
            <ToastClose onClick={() => dismiss(t.id)} />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}
