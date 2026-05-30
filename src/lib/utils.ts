import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 3,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `CMD-${year}-${random}`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export const PLATFORMS = [
  { value: "ps4", label: "PS4" },
  { value: "ps5", label: "PS5" },
  { value: "xbox", label: "Xbox" },
  { value: "pc", label: "PC" },
  { value: "steam", label: "Steam" },
  { value: "nintendo", label: "Nintendo" },
  { value: "mobile", label: "Mobile" },
  { value: "other", label: "Autre" },
] as const;

export const CATEGORIES = [
  { value: "game", label: "Jeu complet" },
  { value: "dlc", label: "DLC" },
  { value: "subscription", label: "Abonnement" },
  { value: "credit", label: "Crédit" },
  { value: "giftcard", label: "Carte cadeau" },
] as const;

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "En traitement", color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Livré", color: "bg-green-100 text-green-800" },
  failed: { label: "Échoué", color: "bg-red-100 text-red-800" },
  refund_initiated: { label: "Remboursement initié", color: "bg-orange-100 text-orange-800" },
  refunded: { label: "Remboursé", color: "bg-gray-100 text-gray-800" },
};

export const PAYMENT_METHODS = [
  { value: "flouci", label: "Carte bancaire", description: "Visa, Mastercard — Paiement sécurisé" },
] as const;
