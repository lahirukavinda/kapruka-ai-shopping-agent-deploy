"use client";

import { motion, useAnimationControls } from "framer-motion";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  recommendation?: string;
}

function getStockColor(product: Product) {
  if (!product.inStock) return "text-red-500 bg-red-50 dark:bg-red-900/20";
  if (product.stockLevel === "low") return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
  return "text-green-600 bg-green-50 dark:bg-green-900/20";
}

function getStockLabel(product: Product) {
  if (!product.inStock) return "Out of Stock";
  if (product.stockLevel === "low") return "Low Stock";
  return "In Stock";
}

export default function ProductCard({
  product,
  onViewDetails,
  recommendation,
}: ProductCardProps) {
  const { dispatch } = useCart();
  const controls = useAnimationControls();

  const handleAddToCart = () => {
    controls.start({
      scale: [1, 1.2, 1],
      transition: { duration: 0.3, times: [0, 0.4, 1] },
    });
    dispatch({
      type: "ADD_ITEM",
      payload: {
        productId: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        quantity: 1,
        imageUrl: product.imageUrl,
      },
    });
  };

  return (
    <div
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow min-w-[240px] max-w-[300px]"
      role="article"
      aria-label={`${product.name}, ${product.currency} ${product.price.toLocaleString()}, ${getStockLabel(product)}`}
    >
      <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`${product.name} — product photo`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-500/90 text-white">
            {product.category}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-primary-800 dark:text-primary-400">
            {product.currency} {product.price.toLocaleString()}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStockColor(product)}`}>
            {getStockLabel(product)}
          </span>
        </div>

        {recommendation && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">
            💡 Kapri: {recommendation}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails?.(product)}
            className="touch-target flex-1 py-2 px-3 text-sm font-medium rounded-lg
              border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View Details
          </button>
          <motion.button
            onClick={handleAddToCart}
            animate={controls}
            disabled={!product.inStock}
            className="touch-target flex-1 py-2 px-3 text-sm font-medium rounded-lg
              bg-primary-500 hover:bg-primary-600 text-white
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Cart
          </motion.button>
        </div>
      </div>
    </div>
  );
}
