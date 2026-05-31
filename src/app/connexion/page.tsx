"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Shield, Zap, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TRUST = [
  { icon: Shield,       text: "Paiement sécurisé SSL" },
  { icon: Zap,          text: "Livraison en 1h à 24h" },
  { icon: MessageCircle,text: "Support 7j/7" },
];

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-center flex-1 bg-linear-to-br from-gray-900 via-purple-950/30 to-gray-900 px-16 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-purple-800/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="text-5xl mb-6">🎮</div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Vos jeux numériques,<br />
            <span className="text-purple-400">livrés rapidement.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Accédez à votre espace client pour suivre vos commandes, récupérer vos clés et contacter le support.
          </p>

          <div className="space-y-4">
            {TRUST.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center items-center flex-1 lg:max-w-md px-6 py-12 lg:border-l lg:border-gray-800 lg:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mb-4 text-2xl">
              🕹️
            </div>
            <h1 className="text-2xl font-bold text-white">Connexion</h1>
            <p className="text-gray-500 text-sm mt-1">Accédez à votre espace client</p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Email</label>
                <Input
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Mot de passe</label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    onClick={() => setShowPwd(!showPwd)}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link href="/mot-de-passe-oublie" className="text-xs text-gray-500 hover:text-purple-400 transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-purple-400 hover:text-purple-300 font-medium">
              Créer un compte
            </Link>
          </p>

          {/* Mobile trust strip */}
          <div className="lg:hidden flex justify-center gap-6 mt-8 flex-wrap">
            {TRUST.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-gray-600">
                <Icon className="h-3.5 w-3.5" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
