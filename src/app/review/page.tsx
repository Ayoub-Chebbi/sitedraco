"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Star, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type OrderInfo = {
  orderNumber: string;
  alreadyReviewed: boolean;
  existingRating: number | null;
  existingComment: string | null;
  products: { id: string; name: string; imageUrl: string | null }[];
};

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-4xl transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`h-10 w-10 transition-colors ${
              n <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-700 text-gray-700"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = ["", "Mauvais", "Passable", "Bien", "Très bien", "Excellent !"];

function ReviewContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const presetRating = Number(params.get("rating") ?? 0);

  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [fetchError, setFetchError] = useState("");

  const [rating, setRating] = useState(presetRating || 0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!token) { setFetchError("Lien invalide."); setLoading(false); return; }

    fetch(`/api/reviews/token?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setFetchError(data.error); }
        else {
          setOrderInfo(data);
          if (data.alreadyReviewed) {
            setRating(data.existingRating ?? 0);
            setComment(data.existingComment ?? "");
            setSubmitted(true);
          } else if (presetRating >= 1 && presetRating <= 5) {
            setRating(presetRating);
          }
        }
      })
      .catch(() => setFetchError("Erreur réseau."))
      .finally(() => setLoading(false));
  }, [token, presetRating]);

  async function submit() {
    if (!rating || !token) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? "Erreur."); }
      else { setSubmitted(true); }
    } catch {
      setSubmitError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-purple-400 mx-auto mb-3" />
        <p className="text-gray-400">Chargement…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-24">
        <XCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Lien invalide</h2>
        <p className="text-gray-400 text-sm">{fetchError}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-24">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Merci pour votre avis !</h2>
        <p className="text-gray-400 text-sm mb-1">Commande #{orderInfo?.orderNumber}</p>
        <div className="flex gap-1 justify-center mt-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-7 w-7 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-700 text-gray-700"}`}
            />
          ))}
        </div>
        {comment && <p className="text-gray-400 text-sm mt-3 max-w-sm mx-auto italic">"{comment}"</p>}
        <a href="https://loot.tn/produits" className="mt-8 inline-block">
          <Button variant="outline">Continuer mes achats</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Votre avis</h1>
        <p className="text-gray-400 text-sm">Commande <span className="font-mono text-purple-300">#{orderInfo?.orderNumber}</span></p>
      </div>

      {orderInfo && orderInfo.products.length > 0 && (
        <div className="mb-6 space-y-2">
          {orderInfo.products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-lg shrink-0">🎮</div>
              <p className="text-sm text-gray-200 font-medium">{p.name}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">Comment évaluez-vous votre expérience ?</p>
          <StarPicker value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-purple-300 text-sm font-semibold mt-2">{RATING_LABELS[rating]}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
            Commentaire <span className="normal-case font-normal">(optionnel)</span>
          </label>
          <Textarea
            placeholder="Décrivez votre expérience — livraison, qualité de la clé, service…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-gray-600 text-right mt-1">{comment.length}/1000</p>
        </div>

        {submitError && <p className="text-red-400 text-sm text-center">{submitError}</p>}

        <Button
          className="w-full gap-2"
          size="lg"
          disabled={!rating || submitting}
          onClick={submit}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
          Publier mon avis
        </Button>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-purple-400 mx-auto" />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
