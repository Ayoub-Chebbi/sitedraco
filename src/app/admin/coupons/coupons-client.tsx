"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Tag, CheckCircle, XCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

type Coupon = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  _count: { orders: number };
};

const EMPTY_FORM = {
  code: "",
  type: "percentage" as "percentage" | "fixed",
  value: "",
  minAmount: "",
  maxUses: "",
  isActive: true,
  expiresAt: "",
};

function CouponForm({
  initial,
  onSave,
  onCancel,
  loading,
  error,
}: {
  initial: typeof EMPTY_FORM;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof EMPTY_FORM, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="rounded-xl border border-purple-800/40 bg-gray-900 p-6 space-y-4">
      <h3 className="font-semibold text-white">
        {initial.code ? "Modifier le coupon" : "Nouveau coupon"}
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Code *</label>
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="EX : PROMO20"
            className="uppercase placeholder:normal-case"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Type *</label>
          <div className="flex gap-2">
            {(["percentage", "fixed"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("type", t)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  form.type === t
                    ? "border-purple-500 bg-purple-900/30 text-white"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                {t === "percentage" ? "%" : "TND"} fixe
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">
            Valeur * {form.type === "percentage" ? "(0-100%)" : "(TND)"}
          </label>
          <Input
            type="number"
            min="0"
            max={form.type === "percentage" ? 100 : undefined}
            step="0.01"
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
            placeholder={form.type === "percentage" ? "20" : "10.000"}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Montant minimum (TND)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.minAmount}
            onChange={(e) => set("minAmount", e.target.value)}
            placeholder="Optionnel"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Limite d&apos;utilisations</label>
          <Input
            type="number"
            min="1"
            value={form.maxUses}
            onChange={(e) => set("maxUses", e.target.value)}
            placeholder="Illimité"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Expiration</label>
          <Input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
        />
        <label htmlFor="isActive" className="text-sm text-gray-300">Actif</label>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button onClick={() => onSave(form)} disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </div>
  );
}

function CouponRow({
  coupon,
  onEdit,
  onToggle,
  onDelete,
}: {
  coupon: Coupon;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const isFull = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;

  function copy() {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const statusBadge = !coupon.isActive
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Inactif</span>
    : isExpired
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">Expiré</span>
    : isFull
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-400">Épuisé</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400">Actif</span>;

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-mono font-bold text-white text-sm">{coupon.code}</span>
          <button onClick={copy} className="text-gray-600 hover:text-gray-300 transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {statusBadge}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
          <span>
            {coupon.type === "percentage" ? `${coupon.value}% de remise` : `${formatPrice(coupon.value)} de remise`}
          </span>
          {coupon.minAmount && <span>Min : {formatPrice(coupon.minAmount)}</span>}
          <span>
            {coupon.usedCount} utilisation{coupon.usedCount !== 1 ? "s" : ""}
            {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ""}
          </span>
          {coupon.expiresAt && (
            <span>Expire : {new Date(coupon.expiresAt).toLocaleDateString("fr-FR")}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggle}
          title={coupon.isActive ? "Désactiver" : "Activer"}
          className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {coupon.isActive
            ? <XCircle className="h-4 w-4 text-gray-400 hover:text-red-400" />
            : <CheckCircle className="h-4 w-4 text-gray-400 hover:text-green-400" />
          }
        </button>
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
          <Pencil className="h-4 w-4 text-gray-400 hover:text-white" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-900/20 transition-colors">
          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
        </button>
      </div>
    </div>
  );
}

export function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  async function reload() {
    const res = await fetch("/api/admin/coupons");
    if (res.ok) setCoupons(await res.json());
  }

  async function handleSave(form: typeof EMPTY_FORM) {
    setFormError("");
    if (!form.code || !form.value) {
      setFormError("Code et valeur sont obligatoires.");
      return;
    }
    setFormLoading(true);

    const body = {
      code: form.code,
      type: form.type,
      value: parseFloat(form.value),
      minAmount: form.minAmount ? parseFloat(form.minAmount) : null,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      isActive: form.isActive,
      expiresAt: form.expiresAt || null,
    };

    const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setFormLoading(false);
    if (!res.ok) {
      setFormError(data.error || "Erreur.");
      return;
    }
    await reload();
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  }

  async function handleToggle(coupon: Coupon) {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    });
    await reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce coupon ?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    await reload();
  }

  function openEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setShowForm(true);
    setFormError("");
  }

  const editingCoupon = coupons.find((c) => c.id === editingId);
  const formInitial = editingCoupon
    ? {
        code: editingCoupon.code,
        type: editingCoupon.type,
        value: String(editingCoupon.value),
        minAmount: editingCoupon.minAmount ? String(editingCoupon.minAmount) : "",
        maxUses: editingCoupon.maxUses ? String(editingCoupon.maxUses) : "",
        isActive: editingCoupon.isActive,
        expiresAt: editingCoupon.expiresAt
          ? new Date(editingCoupon.expiresAt).toISOString().slice(0, 16)
          : "",
      }
    : EMPTY_FORM;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-bold text-white">Codes promo</h1>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{coupons.length}</span>
        </div>
        {!showForm && (
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormError(""); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nouveau coupon
          </Button>
        )}
      </div>

      {showForm && (
        <CouponForm
          initial={formInitial}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingId(null); setFormError(""); }}
          loading={formLoading}
          error={formError}
        />
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        {coupons.length === 0 ? (
          <div className="py-16 text-center">
            <Tag className="h-8 w-8 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun coupon. Créez-en un pour commencer.</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <CouponRow
              key={coupon.id}
              coupon={coupon}
              onEdit={() => openEdit(coupon)}
              onToggle={() => handleToggle(coupon)}
              onDelete={() => handleDelete(coupon.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
