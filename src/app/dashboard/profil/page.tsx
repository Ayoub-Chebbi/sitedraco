"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameLoading(true);
    setNameError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setNameLoading(false);
    if (res.ok) {
      await update({ name });
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } else {
      setNameError("Erreur lors de la mise à jour.");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setPwLoading(true);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (res.ok) {
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } else {
      setPwError(data.error || "Erreur lors du changement de mot de passe.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm">Dashboard</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Mon profil</h1>
      </div>

      {/* Profile info */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-white mb-5">Informations personnelles</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          {nameSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-800/40 rounded-lg px-4 py-3">
              <CheckCircle className="h-4 w-4" /> Profil mis à jour avec succès
            </div>
          )}
          {nameError && <p className="text-sm text-red-400">{nameError}</p>}
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
          <Button type="submit" disabled={nameLoading} className="gap-2">
            {nameLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-white mb-5">Changer le mot de passe</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {pwSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-800/40 rounded-lg px-4 py-3">
              <CheckCircle className="h-4 w-4" /> Mot de passe modifié avec succès
            </div>
          )}
          {pwError && <p className="text-sm text-red-400">{pwError}</p>}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Mot de passe actuel</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Nouveau mot de passe</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Confirmer le nouveau mot de passe</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
            className="gap-2"
          >
            {pwLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Changer le mot de passe
          </Button>
        </form>
      </div>
    </div>
  );
}
