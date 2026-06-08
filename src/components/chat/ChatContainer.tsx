"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat, Message } from "ai/react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ThinkingDots from "./ThinkingDots";
import QuickActionChips from "./QuickActionChips";
import ChatInput from "./ChatInput";
import OfflineBanner from "./OfflineBanner";
import ToolResultRenderer from "./ToolResultRenderer";
import CartPanel from "@/components/cart/CartPanel";
import ProductDetail from "@/components/products/ProductDetail";
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

  const { messages, isLoading, append } = useChat({
    api: "/api/chat",
    body: { language },
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
    handleSendMessage("I want to proceed to checkout");
  }, [handleSendMessage]);

  const handleCategorySelect = useCallback(
    (category: { name: string }) => {
      handleSendMessage(`Show me products in ${category.name}`);
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
        className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin"
        role="log"
        aria-label="Chat conversation"
        aria-live="polite"
      >
        {showWelcome && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-5xl mb-4">🛍️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Ayubowan! 🙏
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              I&apos;m Kapri, your shopping buddy at Kapruka. I can help you find products,
              compare options, check delivery, and even place orders. What can I help you with?
            </p>
            <QuickActionChips onAction={handleQuickAction} />
          </div>
        )}

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
