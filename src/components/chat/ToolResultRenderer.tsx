"use client";

import ProductCarousel from "@/components/products/ProductCarousel";
import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";
import CategoryTiles from "@/components/products/CategoryTiles";
import ComparisonView from "@/components/comparison/ComparisonView";
import OrderTimeline from "@/components/tracking/OrderTimeline";
import type { Product, Category, OrderTracking } from "@/types";

interface ToolResultRendererProps {
  toolName: string;
  result: unknown;
  isLoading?: boolean;
  onViewProduct?: (product: Product) => void;
  onSelectCategory?: (category: Category) => void;
}

function parseProducts(data: unknown): Product[] {
  try {
    const obj = typeof data === "string" ? JSON.parse(data) : data;
    const content = obj?.content;
    let parsed = obj;

    if (Array.isArray(content) && content.length > 0) {
      const textItem = content.find(
        (c: { type: string }) => c.type === "text"
      );
      if (textItem?.text) {
        parsed = JSON.parse(textItem.text);
      }
    }

    const products = parsed?.products || parsed?.results || parsed?.items;
    if (Array.isArray(products)) {
      return products.map((p: Record<string, unknown>) => {
        const priceObj = p.price as { amount?: number; currency?: string } | number | null;
        const price = typeof priceObj === "object" && priceObj !== null
          ? Number(priceObj.amount || 0)
          : Number(priceObj || p.selling_price || 0);
        const currency = typeof priceObj === "object" && priceObj !== null
          ? String(priceObj.currency || "LKR")
          : String(p.currency || "LKR");
        const catObj = p.category as { name?: string } | string | null;
        const category = typeof catObj === "object" && catObj !== null
          ? String(catObj.name || "")
          : catObj ? String(catObj) : undefined;

        return {
          id: String(p.id || p.product_id || ""),
          name: String(p.name || p.title || ""),
          price,
          currency: currency as "LKR" | "USD",
          imageUrl: String(p.image_url || p.imageUrl || p.image || ""),
          images: Array.isArray(p.images) ? p.images.map(String) : undefined,
          description: p.description ? String(p.description) : p.summary ? String(p.summary) : undefined,
          category,
          inStock: p.in_stock !== false && p.inStock !== false,
          stockLevel: p.stock_level ? String(p.stock_level) as "high" | "medium" | "low" : undefined,
          rating: p.rating ? Number(p.rating) : undefined,
          url: p.url ? String(p.url) : undefined,
          variants: Array.isArray(p.variants)
            ? p.variants.map((v: Record<string, unknown>) => ({
                id: String(v.id || ""),
                name: String(v.name || ""),
                value: String(v.value || ""),
              }))
            : undefined,
        };
      });
    }
    return [];
  } catch {
    return [];
  }
}

function parseCategories(data: unknown): Category[] {
  try {
    const obj = typeof data === "string" ? JSON.parse(data) : data;
    const content = obj?.content;
    let parsed = obj;

    if (Array.isArray(content) && content.length > 0) {
      const textItem = content.find(
        (c: { type: string }) => c.type === "text"
      );
      if (textItem?.text) {
        parsed = JSON.parse(textItem.text);
      }
    }

    const categories = parsed?.categories || parsed?.results || parsed;
    if (Array.isArray(categories)) {
      return categories.map((c: Record<string, unknown>) => ({
        id: String(c.id || c.name || ""),
        name: String(c.name || c.title || ""),
        url: c.url ? String(c.url) : undefined,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

function parseTracking(data: unknown): OrderTracking | null {
  try {
    const obj = typeof data === "string" ? JSON.parse(data) : data;
    const content = obj?.content;
    let parsed = obj;

    if (Array.isArray(content) && content.length > 0) {
      const textItem = content.find(
        (c: { type: string }) => c.type === "text"
      );
      if (textItem?.text) {
        parsed = JSON.parse(textItem.text);
      }
    }

    if (parsed?.order_id || parsed?.orderId || parsed?.status) {
      return {
        orderId: String(parsed.order_id || parsed.orderId || ""),
        status: String(parsed.status || ""),
        steps: Array.isArray(parsed.steps)
          ? parsed.steps.map((s: Record<string, unknown>) => ({
              title: String(s.title || s.name || ""),
              description: s.description ? String(s.description) : undefined,
              timestamp: s.timestamp ? String(s.timestamp) : undefined,
              completed: Boolean(s.completed),
              current: Boolean(s.current),
            }))
          : [],
        estimatedDelivery: parsed.estimated_delivery
          ? String(parsed.estimated_delivery)
          : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function ToolResultRenderer({
  toolName,
  result,
  isLoading = false,
  onViewProduct,
  onSelectCategory,
}: ToolResultRendererProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (toolName === "kapruka_search_products" || toolName === "kapruka_get_product") {
    const products = parseProducts(result);
    if (products.length === 0) return null;

    if (products.length === 1 && toolName === "kapruka_get_product") {
      return (
        <ProductCarousel
          products={products}
          onViewDetails={onViewProduct}
        />
      );
    }

    return (
      <ProductCarousel
        products={products}
        title={products.length > 1 ? `Found ${products.length} products` : undefined}
        onViewDetails={onViewProduct}
      />
    );
  }

  if (toolName === "kapruka_list_categories") {
    const categories = parseCategories(result);
    if (categories.length === 0) return null;
    return <CategoryTiles categories={categories} onSelect={onSelectCategory || (() => {})} />;
  }

  if (toolName === "kapruka_track_order") {
    const tracking = parseTracking(result);
    if (!tracking) return null;
    return <OrderTimeline tracking={tracking} />;
  }

  // For comparison scenarios: if multiple products detected
  if (toolName === "comparison") {
    const products = parseProducts(result);
    if (products.length < 2) return null;
    return <ComparisonView products={products} />;
  }

  return null;
}
