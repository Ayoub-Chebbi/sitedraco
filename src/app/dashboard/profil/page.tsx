"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) {
      await update({ name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm">Dashboard</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Mon profil</h1>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <form onSubmit={handleSave} className="space-y-4">
          {success && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-800/40 rounded-lg px-4 py-3">
              <CheckCircle className="h-4 w-4" />
              Profil mis à jour avec succès
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <Input value={session?.user?.email || ""} disabled className="opacity-60" />
            <p className="text-xs text-gray-600">L&apos;email ne peut pas être modifié</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Prénom / Pseudo</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre prénom"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </form>
      </div>
    </div>
  );
}
