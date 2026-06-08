"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FocusTrap from "focus-trap-react";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types";

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
};

export default function ProductDetail({ product, onClose }: ProductDetailProps) {
  const { dispatch } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    product.variants?.[0]?.value
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product.images?.length
    ? product.images
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        productId: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        quantity,
        imageUrl: product.imageUrl,
        variant: selectedVariant,
      },
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <FocusTrap>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 w-full
              md:max-w-2xl md:mx-4 md:rounded-2xl md:max-h-[90vh]
              max-md:h-full max-md:rounded-none
              bg-white dark:bg-gray-900 overflow-y-auto shadow-2xl"
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 touch-target w-10 h-10 rounded-full
                bg-white/80 dark:bg-gray-800/80 backdrop-blur
                flex items-center justify-center text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close product details"
            >
              ✕
            </button>

            {/* Image gallery */}
            {images.length > 0 && (
              <div className="relative h-64 md:h-80 w-full bg-gray-100 dark:bg-gray-800">
                <Image
                  src={images[currentImageIndex]}
                  alt={`${product.name} — photo ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentImageIndex
                            ? "bg-primary-500"
                            : "bg-gray-400/60"
                        }`}
                        aria-label={`View image ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Details */}
            <div className="p-5">
              {product.category && (
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                  {product.category}
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {product.name}
              </h2>
              <p className="text-2xl font-bold text-primary-800 dark:text-primary-400 mt-2">
                {product.currency} {product.price.toLocaleString()}
              </p>

              {product.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Options
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          selectedVariant === v.value
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                            : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                        }`}
                      >
                        {v.name}: {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity
                </label>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="touch-target w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="touch-target w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="mt-5 w-full touch-target py-3 rounded-xl font-medium text-white
                  bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
              >
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>
          </motion.div>
        </div>
      </FocusTrap>
    </AnimatePresence>
  );
}
