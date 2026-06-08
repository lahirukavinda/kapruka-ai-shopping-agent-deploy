"use client";

import { useState, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import DeliveryCityAutocomplete from "./DeliveryCityAutocomplete";

interface CheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceOrder: (details: OrderDetails) => void;
}

export interface OrderDetails {
  deliveryCity: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  giftMessage?: string;
}

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Order Summary",
  2: "Delivery Details",
  3: "Confirm & Pay",
};

export default function CheckoutFlow({ isOpen, onClose, onPlaceOrder }: CheckoutFlowProps) {
  const { state, totalItems, totalPrice } = useCart();
  const reducedMotion = useReducedMotion();

  const [step, setStep] = useState<Step>(1);
  const [deliveryCity, setDeliveryCity] = useState(state.deliveryCity || "");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [giftMessage, setGiftMessage] = useState(state.giftMessage || "");
  const [deliveryInfo, setDeliveryInfo] = useState<{
    available: boolean;
    date?: string;
    rate?: number;
  } | null>(null);

  const handleCityConfirmed = useCallback(async (city: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Check delivery availability to ${city}` }],
          language: "en",
        }),
      });
      if (res.ok) {
        setDeliveryInfo({ available: true, date: "2–3 business days", rate: 350 });
      }
    } catch {
      setDeliveryInfo(null);
    }
  }, []);

  const handleSubmitDelivery = (e: FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePlaceOrder = () => {
    onPlaceOrder({
      deliveryCity,
      recipientName,
      recipientPhone,
      recipientAddress,
      giftMessage: giftMessage || undefined,
    });
    onClose();
  };

  const isDeliveryFormValid =
    deliveryCity.length >= 2 &&
    recipientName.trim().length > 0 &&
    recipientPhone.trim().length > 0 &&
    recipientAddress.trim().length > 0;

  const animationProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.25 },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-[5vh] bottom-[5vh] md:inset-x-auto md:left-1/2 md:top-1/2
              md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[85vh]
              z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Checkout
                </h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  Step {step}/3
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-gray-500
                  hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close checkout"
              >
                ✕
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex px-4 pt-3 gap-1">
              {([1, 2, 3] as Step[]).map((s) => (
                <div key={s} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`h-1 w-full rounded-full transition-colors ${
                      s <= step
                        ? "bg-amber-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                  <span className={`text-[10px] font-medium ${
                    s === step
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" {...animationProps}>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Your Cart ({totalItems} items)
                    </h3>
                    <div className="space-y-2 mb-4">
                      {state.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 ml-2">
                            {item.currency} {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Subtotal</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        LKR {totalPrice.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      disabled={totalItems === 0}
                      className="mt-4 w-full py-3 rounded-xl font-medium text-white
                        bg-gradient-to-r from-amber-500 to-orange-500
                        hover:from-amber-600 hover:to-orange-600
                        disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Continue to Delivery
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.form key="step2" {...animationProps} onSubmit={handleSubmitDelivery}>
                    <div className="space-y-4">
                      <DeliveryCityAutocomplete
                        value={deliveryCity}
                        onChange={setDeliveryCity}
                        onCityConfirmed={handleCityConfirmed}
                      />

                      {deliveryInfo && (
                        <div className={`text-xs p-2 rounded-lg ${
                          deliveryInfo.available
                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        }`}>
                          {deliveryInfo.available
                            ? `Delivery available — ${deliveryInfo.date} (LKR ${deliveryInfo.rate})`
                            : "Delivery not available for this city"}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Recipient Name
                        </label>
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Full name"
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          placeholder="+94 7X XXX XXXX"
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Delivery Address
                        </label>
                        <textarea
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          placeholder="Full delivery address"
                          required
                          rows={2}
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Gift Message <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Happy Birthday! 🎂"
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300
                          border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={!isDeliveryFormValid}
                        className="flex-1 py-3 rounded-xl font-medium text-white
                          bg-gradient-to-r from-amber-500 to-orange-500
                          hover:from-amber-600 hover:to-orange-600
                          disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Review Order
                      </button>
                    </div>
                  </motion.form>
                )}

                {step === 3 && (
                  <motion.div key="step3" {...animationProps}>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      Order Review
                    </h3>

                    {/* Items summary */}
                    <div className="space-y-1 mb-3">
                      {state.items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {item.currency} {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery details */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-2 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Deliver to</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{deliveryCity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Recipient</span>
                        <span className="text-gray-900 dark:text-gray-100">{recipientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Phone</span>
                        <span className="text-gray-900 dark:text-gray-100">{recipientPhone}</span>
                      </div>
                      {deliveryInfo?.rate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Delivery</span>
                          <span className="text-gray-900 dark:text-gray-100">LKR {deliveryInfo.rate.toLocaleString()}</span>
                        </div>
                      )}
                      {giftMessage && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Gift msg</span>
                          <span className="text-gray-900 dark:text-gray-100 text-right max-w-[60%] truncate">{giftMessage}</span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 mb-4">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        LKR {(totalPrice + (deliveryInfo?.rate || 0)).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex-1 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300
                          border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        className="flex-1 py-3 rounded-xl font-semibold text-white
                          bg-gradient-to-r from-green-500 to-emerald-600
                          hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25 transition-all"
                      >
                        Place Order
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
