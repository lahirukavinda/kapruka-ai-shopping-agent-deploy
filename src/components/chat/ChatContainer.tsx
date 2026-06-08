"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat, Message } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ThinkingDots from "./ThinkingDots";
import QuickActionChips from "./QuickActionChips";
import ChatInput from "./ChatInput";
import OfflineBanner from "./OfflineBanner";
import ToolResultRenderer from "./ToolResultRenderer";
import CartPanel from "@/components/cart/CartPanel";
import ProductDetail from "@/components/products/ProductDetail";
import CheckoutFlow, { type OrderDetails } from "@/components/checkout/CheckoutFlow";
import KapriAvatar from "./KapriAvatar";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AvatarState, Product } from "@/types";

function getAvatarState(isLoading: boolean, messages: Message[]): AvatarState {
  if (isLoading) return "thinking";
  if (messages.length === 0) return "idle";

  const lastMsg = messages[messages.length - 1];
  if (lastMsg?.role === "assistant") {
    const content = lastMsg.content.toLowerCase();
    if (/order.*placed|order.*confirmed|successfully/i.test(content)) return "celebrating";
    if (/broke up|sad|sorry|miss you|condolence/i.test(content)) return "empathetic";
    if (lastMsg.toolInvocations?.length) return "excited";
  }
  return "idle";
}

export default function ChatContainer() {
  const { language } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const { messages, isLoading, append } = useChat({
    api: "/api/chat",
    body: { language },
    onError: (err) => {
      console.error("Chat error:", err);
      setError("Oops! Something went wrong. Please try again.");
    },
  });

  const avatarState = getAvatarState(isLoading, messages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length > 0) setShowWelcome(false);
  }, [messages]);

  const handleSendMessage = useCallback(
    (text: string) => {
      setError(null);
      append({ role: "user", content: text });
    },
    [append]
  );

  const handleQuickAction = useCallback(
    (text: string) => {
      handleSendMessage(text);
    },
    [handleSendMessage]
  );

  const handleCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);

  const handlePlaceOrder = useCallback(
    (details: OrderDetails) => {
      setIsCheckoutOpen(false);
      const msg = [
        `Place my order:`,
        `Delivery to ${details.deliveryCity}`,
        `Recipient: ${details.recipientName}`,
        `Phone: ${details.recipientPhone}`,
        `Address: ${details.recipientAddress}`,
        details.giftMessage ? `Gift message: ${details.giftMessage}` : "",
      ].filter(Boolean).join("\n");
      handleSendMessage(msg);
    },
    [handleSendMessage]
  );

  const handleCategorySelect = useCallback(
    (category: { name: string }) => {
      handleSendMessage(`Show me products in ${category.name}`);
    },
    [handleSendMessage]
  );

  const handleCitySelect = useCallback(
    (cityName: string) => {
      handleSendMessage(`Check delivery to ${cityName}`);
    },
    [handleSendMessage]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedProduct) setSelectedProduct(null);
        else if (isCartOpen) setIsCartOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedProduct, isCartOpen]);

  return (
    <div className="app-container flex flex-col bg-gray-50 dark:bg-gray-950">
      <OfflineBanner />
      <ChatHeader
        avatarState={avatarState}
        onCartOpen={() => setIsCartOpen(true)}
      />

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin chat-bg"
        role="log"
        aria-label="Chat conversation"
        aria-live="polite"
      >
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              className="flex flex-col items-center justify-center py-8 md:py-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Hero avatar */}
              <motion.div
                className="mb-6 avatar-glow rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <KapriAvatar state="idle" size={96} />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="gradient-text">Ayubowan!</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">🙏</span>
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                className="text-gray-500 dark:text-gray-400 max-w-md mb-2 text-base leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                I&apos;m <strong className="text-gray-700 dark:text-gray-200">Kapri</strong>, your AI shopping buddy at Kapruka.
              </motion.p>
              <motion.p
                className="text-gray-400 dark:text-gray-500 max-w-md mb-8 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                Search products, compare prices, check delivery, and checkout — all through chat.
              </motion.p>

              {/* Quick actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <QuickActionChips onAction={handleQuickAction} />
              </motion.div>

              {/* Powered by badge */}
              <motion.div
                className="mt-8 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <span>Powered by</span>
                <span className="font-semibold text-gray-500 dark:text-gray-500">Kapruka MCP</span>
                <span>×</span>
                <span className="font-semibold text-gray-500 dark:text-gray-500">AI</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.content && (
                <MessageBubble
                  role={msg.role as "user" | "assistant"}
                  content={msg.content}
                  isStreaming={isLoading && msg.id === messages[messages.length - 1]?.id && msg.role === "assistant"}
                  avatarState={avatarState}
                />
              )}

              {/* Render tool results inline */}
              {msg.toolInvocations?.map((invocation) => {
                if (invocation.state !== "result") {
                  return (
                    <ToolResultRenderer
                      key={invocation.toolCallId}
                      toolName={invocation.toolName}
                      result={null}
                      isLoading={true}
                    />
                  );
                }
                return (
                  <div key={invocation.toolCallId} className="my-2 ml-10">
                    <ToolResultRenderer
                      toolName={invocation.toolName}
                      result={invocation.result}
                      onViewProduct={setSelectedProduct}
                      onSelectCategory={handleCategorySelect}
                      onSelectCity={handleCitySelect}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          {isLoading && !messages[messages.length - 1]?.content && (
            <div className="flex gap-2 items-center mb-3">
              <ThinkingDots />
            </div>
          )}

          {error && (
            <motion.div
              className="flex justify-center mb-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm">
                <span className="text-base">⚠️</span>
                {error}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {!showWelcome && messages.length > 0 && !isLoading && (
          <div className="max-w-3xl mx-auto mt-2">
            <QuickActionChips onAction={handleQuickAction} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <ChatInput
        onSubmit={handleSendMessage}
        isLoading={isLoading}
        inputRef={inputRef}
      />

      {/* Cart panel */}
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />

      {/* Checkout flow modal */}
      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* SR-only announcements */}
      {!isLoading && messages.length > 0 && (
        <span className="sr-only" aria-live="assertive">
          Kapri finished responding.
        </span>
      )}
    </div>
  );
}
