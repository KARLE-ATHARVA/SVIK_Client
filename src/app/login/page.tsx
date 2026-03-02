"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/constants";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("Customer");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = useMemo(
    () => searchParams.get("returnUrl") || "/visualizer_old",
    [searchParams]
  );

  const onSubmit = async () => {
    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }
    if (mode === "signup" && (!name || !mobile)) {
      alert("Please fill name and mobile.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "cust_login" : "cust_signup";
      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, profession, mobile, password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
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
          alert("Login failed. Please check credentials.");
          return;
        }
        sessionStorage.setItem("pgatoken", token);
        router.push(returnUrl);
      } else {
        if (String(data).toLowerCase().includes("success") || data?.success) {
          alert("Account created. Please login.");
          setMode("login");
          return;
        }
        alert("Signup response received. Please try login.");
        setMode("login");
      }
    } catch (e: any) {
      alert(e?.message || "Authentication failed.");
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

        <div className="space-y-4">
          {mode === "signup" && (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Profession"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Mobile"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />

          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-semibold disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"}
          </button>
        </div>

        <div className="mt-4 text-sm text-slate-600 text-center">
          {mode === "login" ? "No account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-blue-600 font-semibold"
          >
            {mode === "login" ? "Create one" : "Login"}
          </button>
        </div>
      </div>
    </main>
  );
}
