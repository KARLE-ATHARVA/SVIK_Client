"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import AuthModal from "@/components/visualizer/AuthModal";
import { isLoggedIn } from "@/lib/auth";
import {
  CART_UPDATED_EVENT,
  listCartAPI,
  removeFromCartAPI,
  updateCartQuantityAPI,
  type CartItem,
} from "@/lib/cartApi";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [loading, setLoading] = useState(false);
  const [busyTileId, setBusyTileId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0),
    [cartItems]
  );

  const refreshCart = useCallback(async () => {
    if (!isLoggedIn()) {
      setLoggedIn(false);
      setCartItems([]);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const items = await listCartAPI();
      setLoggedIn(true);
      setCartItems(items);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to load cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    const onCartUpdated = () => {
      void refreshCart();
    };
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
  }, [refreshCart]);

  const handleUpdateQuantity = async (tileId: number, quantity: number) => {
    if (quantity <= 0) {
      await handleRemove(tileId);
      return;
    }

    setBusyTileId(tileId);
    setErrorMessage(null);
    try {
      await updateCartQuantityAPI(tileId, quantity);
      await refreshCart();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to update quantity.");
    } finally {
      setBusyTileId(null);
    }
  };

  const handleRemove = async (tileId: number) => {
    setBusyTileId(tileId);
    setErrorMessage(null);
    try {
      await removeFromCartAPI(tileId);
      await refreshCart();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to remove item.");
    } finally {
      setBusyTileId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f8f6] px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-4xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.14)] lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-600">Shopping Cart</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">My Cart</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{cartCount} item(s)</p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-full border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Continue Shopping
          </Link>
        </div>

        {!loggedIn && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-base font-semibold text-amber-900">Please login to view and manage your cart.</p>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="mt-4 inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-bold uppercase tracking-wide text-white"
            >
              Login to continue
            </button>
          </div>
        )}

        {loggedIn && (
          <div className="mt-6 space-y-3">
            {loading && (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Loader2 size={16} className="animate-spin" />
                Loading cart...
              </div>
            )}

            {!loading && cartItems.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                Your cart is empty. Add tiles from product details.
              </div>
            )}

            {cartItems.map((item) => (
              <article key={item.tile_id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                      {item.sku_name || "Tile"}
                    </h2>
                    <p className="text-sm font-semibold text-slate-500">{item.sku_code}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.tile_id)}
                    disabled={busyTileId === item.tile_id}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-200">
                    <button
                      type="button"
                      onClick={() => void handleUpdateQuantity(item.tile_id, item.quantity - 1)}
                      disabled={busyTileId === item.tile_id}
                      className="inline-flex h-9 w-9 items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-9 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => void handleUpdateQuantity(item.tile_id, item.quantity + 1)}
                      disabled={busyTileId === item.tile_id}
                      className="inline-flex h-9 w-9 items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {errorMessage && <p className="mt-5 text-sm font-semibold text-red-600">{errorMessage}</p>}
        {successMessage && <p className="mt-5 text-sm font-semibold text-emerald-700">{successMessage}</p>}

        <div className="mt-8 flex justify-end border-t border-slate-200 pt-5">
          <button
            type="button"
            disabled={cartCount === 0 || !loggedIn}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={16} />
            Proceed to Checkout
          </button>
        </div>
      </section>

      <AuthModal
        open={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setLoggedIn(true);
          setSuccessMessage("Login successful.");
          setErrorMessage(null);
          void refreshCart();
          setIsAuthOpen(false);
        }}
      />
    </main>
  );
}
