"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import type { Product } from "@/types";

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  onViewDetails?: (product: Product) => void;
}

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 20, stiffness: 300 },
  },
};

export default function ProductCarousel({
  products,
  title,
  onViewDetails,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 300);
  };

  if (products.length === 0) return null;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 px-1">
          {title}
        </h3>
      )}
      <div className="relative group">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 touch-target
              w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-md
              flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            ←
          </button>
        )}

        <motion.div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-thin pb-2"
          variants={cardContainerVariants}
          initial="hidden"
          animate="visible"
          onScroll={checkScroll}
          drag="x"
          dragConstraints={{ left: -((products.length - 1) * 260), right: 0 }}
          dragElastic={0.1}
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              variants={cardItemVariants}
              className="snap-center flex-shrink-0"
            >
              <ProductCard product={product} onViewDetails={onViewDetails} />
            </motion.div>
          ))}
        </motion.div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 touch-target
              w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-md
              flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}
