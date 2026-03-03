"use client";

import { useCallback, useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/auth";
import { CART_UPDATED_EVENT, listCartAPI } from "@/lib/cartApi";

export function useCartCount() {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setCount(0);
      setReady(true);
      return;
    }

    try {
      const items = await listCartAPI();
      const total = items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0);
      setCount(total);
    } catch {
      setCount(0);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onCartUpdated = () => {
      void refresh();
    };

    const onWindowFocus = () => {
      void refresh();
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [refresh]);

  return { count, ready, refresh };
}
