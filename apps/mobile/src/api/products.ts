import { api } from "./client";
import type { Product } from "@/types";

export interface ProductsQuery {
  platform?: string;
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function getProducts(query: ProductsQuery = {}): Promise<{ products: Product[]; total: number }> {
  const params = new URLSearchParams();
  if (query.platform) params.set("platform", query.platform);
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return api.get<{ products: Product[]; total: number }>(`/api/products${qs ? `?${qs}` : ""}`);
}

export async function getProductBySlug(slug: string): Promise<Product> {
  return api.get<Product>(`/api/products/${slug}`);
}

export async function getHomeData(): Promise<{
  newArrivals: Product[];
  deals: Product[];
  platforms: Record<string, Product[]>;
}> {
  return api.get("/api/home");
}
