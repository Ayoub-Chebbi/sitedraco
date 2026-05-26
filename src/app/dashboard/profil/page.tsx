"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle, Eye, EyeOff, Camera } from "lucide-react";
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

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const data = await res.json();
    setAvatarLoading(false);
    if (res.ok) {
      await update({ avatarUrl: data.avatarUrl });
    } else {
      setAvatarError(data.error || "Échec de l'upload.");
    }
    e.target.value = "";
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

  const avatarUrl = session?.user?.avatarUrl;
  const initials = (session?.user?.name ?? session?.user?.email ?? "U")[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm">Dashboard</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Mon profil</h1>
      </div>

      {/* Avatar */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-white mb-5">Photo de profil</h2>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
              ) : (
                <span className="text-white text-2xl font-bold">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 border-2 border-gray-900 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {avatarLoading ? (
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm text-gray-300 font-medium">Changer la photo</p>
            <p className="text-xs text-gray-500 mt-0.5">JPG, PNG ou WebP · max 2 Mo</p>
            {avatarError && <p className="text-xs text-red-400 mt-1">{avatarError}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
            >
              {avatarLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Envoi...</> : "Choisir une photo"}
            </Button>
          </div>
        </div>
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
