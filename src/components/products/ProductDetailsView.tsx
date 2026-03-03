"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ProductDetails } from "@/lib/productDetailsApi";
import AuthModal from "@/components/visualizer/AuthModal";
import { isLoggedIn } from "@/lib/auth";
import {
  addToCartAPI,
  listCartAPI,
  removeFromCartAPI,
  updateCartQuantityAPI,
  type CartItem,
} from "@/lib/cartApi";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

type ProductDetailsViewProps = {
  product: ProductDetails;
};

export default function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const fallbackImage = product.fallbackImageUrl;
  const [mainImageSrc, setMainImageSrc] = useState<string>(product.faceImageUrl || fallbackImage);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [busyTileId, setBusyTileId] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pendingAddAfterLogin, setPendingAddAfterLogin] = useState(false);
  const [addQuantity, setAddQuantity] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMainImageSrc(product.faceImageUrl || fallbackImage);
  }, [product.faceImageUrl, fallbackImage]);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0),
    [cartItems]
  );

  const loadCart = async () => {
    if (!isLoggedIn()) {
      setCartItems([]);
      return;
    }

    setIsCartLoading(true);
    setErrorMessage(null);
    try {
      const items = await listCartAPI();
      setCartItems(items);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to load cart.");
    } finally {
      setIsCartLoading(false);
    }
  };

  useEffect(() => {
    if (!loggedIn) {
      setCartItems([]);
      return;
    }
    void loadCart();
  }, [loggedIn]);

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      setPendingAddAfterLogin(true);
      setIsAuthOpen(true);
      return;
    }

    setIsAddingToCart(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await addToCartAPI(product.tileId, addQuantity);
      await loadCart();
      setStatusMessage("Added to cart successfully.");
      setIsCartOpen(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to add item to cart.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleUpdateQuantity = async (tileId: number, quantity: number) => {
    if (quantity <= 0) {
      await handleRemoveItem(tileId);
      return;
    }

    setBusyTileId(tileId);
    setErrorMessage(null);
    try {
      await updateCartQuantityAPI(tileId, quantity);
      await loadCart();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to update quantity.");
    } finally {
      setBusyTileId(null);
    }
  };

  const handleRemoveItem = async (tileId: number) => {
    setBusyTileId(tileId);
    setErrorMessage(null);
    try {
      await removeFromCartAPI(tileId);
      await loadCart();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to remove item.");
    } finally {
      setBusyTileId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-slate-900">
      <section className="relative overflow-hidden px-4 py-6 lg:px-8">
        <div className="pointer-events-none absolute right-[-5%] top-[-8%] h-[420px] w-[420px] rounded-full bg-amber-200/25 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-12%] left-[-4%] h-[500px] w-[500px] rounded-full bg-slate-200/50 blur-[120px]" />

        <div className="relative mx-auto max-w-[1380px]">
          <div className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            <span className="h-[1px] w-8 bg-amber-500" />
            <span>Home / {product.category}</span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-[30px] border border-white/80 bg-white/70 p-4 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.22)] backdrop-blur-sm lg:p-6">
              <div className="relative h-[360px] overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-100 lg:h-[520px]">
                <div className="absolute left-4 top-4 z-10 rounded-full bg-white/92 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 shadow-sm">
                  {product.skuCode}
                </div>
                <Image
                  src={mainImageSrc}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-cover"
                  onError={() => setMainImageSrc(fallbackImage)}
                />
              </div>
            </div>

            <aside className="rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] lg:p-8">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  {product.application}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                  {product.finish}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                  {product.color}
                </span>
              </div>

              <h1 className="mb-7 text-3xl font-extrabold leading-tight text-slate-900 lg:text-5xl">
                {product.name}
              </h1>

              <div className="mb-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Order this tile</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setAddQuantity((q) => Math.max(1, q - 1))}
                      className="inline-flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-100"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="min-w-10 text-center text-sm font-bold text-slate-900">{addQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setAddQuantity((q) => Math.min(99, q + 1))}
                      className="inline-flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-100"
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleAddToCart()}
                    disabled={isAddingToCart}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAddingToCart ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </button>

                </div>
                {statusMessage && <p className="mt-3 text-sm font-semibold text-emerald-700">{statusMessage}</p>}
                {errorMessage && <p className="mt-2 text-sm font-semibold text-red-600">{errorMessage}</p>}
              </div>

              <dl className="space-y-4">
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">SKU Code</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.skuCode}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Category</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.category}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Application</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.application}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Space</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.space}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Size</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.size}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Finish</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.finish}</dd>
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3 border-b border-slate-100 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wide text-slate-400">Color</dt>
                  <dd className="text-base font-semibold text-slate-900">{product.color}</dd>
                </div>
                <div className="h-1" />
              </dl>
            </aside>
          </div>
        </div>
      </section>

      {isCartOpen && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/45" onClick={() => setIsCartOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Your Cart</h2>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{cartCount} item(s)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {!loggedIn && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Login required to use cart.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsAuthOpen(true);
                  }}
                  className="mt-3 inline-flex h-9 items-center rounded-full bg-slate-900 px-4 text-xs font-bold uppercase tracking-wide text-white"
                >
                  Login to continue
                </button>
              </div>
            )}

            {loggedIn && (
              <div className="mt-5 space-y-3 overflow-y-auto pb-12">
                {isCartLoading && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Loader2 size={16} className="animate-spin" />
                    Loading cart...
                  </div>
                )}

                {!isCartLoading && cartItems.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    Your cart is empty.
                  </div>
                )}

                {cartItems.map((item) => (
                  <article
                    key={item.tile_id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_15px_35px_-25px_rgba(15,23,42,0.55)]"
                  >
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                      {item.sku_name || item.sku_code || "Tile"}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.sku_code}</p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center overflow-hidden rounded-full border border-slate-200">
                        <button
                          type="button"
                          onClick={() => void handleUpdateQuantity(item.tile_id, item.quantity - 1)}
                          disabled={busyTileId === item.tile_id}
                          className="inline-flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => void handleUpdateQuantity(item.tile_id, item.quantity + 1)}
                          disabled={busyTileId === item.tile_id}
                          className="inline-flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleRemoveItem(item.tile_id)}
                        disabled={busyTileId === item.tile_id}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      <AuthModal
        open={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          const shouldAddCurrentTile = pendingAddAfterLogin;
          setPendingAddAfterLogin(false);
          setLoggedIn(true);
          setErrorMessage(null);
          setStatusMessage("Login successful.");
          void loadCart();
          if (shouldAddCurrentTile) {
            void handleAddToCart();
          }
        }}
      />
    </main>
  );
}
