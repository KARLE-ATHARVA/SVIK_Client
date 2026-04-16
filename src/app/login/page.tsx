"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/constants";
import { isValidMobile, validateAuthForm } from "@/lib/authValidation";

type Mode = "login" | "signup";

function resolveAuthUrl(endpoint: string) {
  const rawBase = String(API_BASE ?? "").trim();
  if (!rawBase) {
    throw new Error("API base URL not configured (NEXT_PUBLIC_API_BASE).");
  }
  const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
  return `${base}${endpoint}`;
}

function LoginPageContent() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("Customer");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = useMemo(
    () => searchParams.get("returnUrl") || "/visualizer",
    [searchParams]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateAuthForm({
      mode,
      email,
      password,
      name,
      mobile,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "cust_login" : "cust_signup";
      const payload =
        mode === "login"
          ? { email: email.trim(), password }
          : {
              name: name.trim(),
              email: email.trim(),
              profession: profession.trim() || "Customer",
              mobile: mobile.trim(),
              password,
            };

      const res = await fetch(resolveAuthUrl(endpoint), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const data = await res.json().catch(() => null);

      if (mode === "login") {
        const token = data?.pgatoken;
        if (!token) {
          setError("Login failed. Please check your credentials.");
          return;
        }
        sessionStorage.setItem("pgatoken", token);
        router.push(returnUrl);
      } else {
        if (String(data).toLowerCase().includes("success") || data?.success) {
          setError("Account created. Please login.");
          setMode("login");
          setPassword("");
          return;
        }
        setError("Signup response received. Please try login.");
        setMode("login");
        setPassword("");
      }
    } catch (e: any) {
      setError(e?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {mode === "login" ? "Login" : "Create Account"}
        </h1>
        <p className="text-sm text-slate-500 mb-6">Continue to Visualizer</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          {mode === "signup" && (
            <>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Full Name"
                autoComplete="name"
                aria-invalid={mode === "signup" && !!error && !name.trim()}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Profession"
                  autoComplete="organization-title"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
                <input
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Mobile"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={mode === "signup" && !!mobile && !isValidMobile(mobile)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            placeholder="Email"
            autoComplete="email"
            aria-invalid={!!error && !!email && !email.includes("@")}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="Password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-semibold disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600 text-center">
          {mode === "login" ? "No account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="text-blue-600 font-semibold"
          >
            {mode === "login" ? "Create one" : "Login"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-100" />}>
      <LoginPageContent />
    </Suspense>
  );
}
