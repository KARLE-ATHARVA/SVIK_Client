"use client";

import { useState } from "react";
import axios from "axios";
import { X, Eye, EyeOff } from "lucide-react";
import { API_BASE } from "@/lib/constants";
import { isValidMobile, validateAuthForm } from "@/lib/authValidation";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ open, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("Customer");
  const [mobile, setMobile] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async () => {
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
      const endpoint = mode === "login" ? "/cust_login" : "/cust_signup";
      
      const payload = mode === "login" 
        ? { email: email.trim(), password } 
        : { 
            name: name.trim(), 
            email: email.trim(), 
            profession: profession.trim() || "Customer", 
            mobile: mobile.trim(), 
            password 
          };

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);

      if (mode === "login") {
        if (res.data.pgatoken) {
          sessionStorage.setItem("pgatoken", res.data.pgatoken);
          onSuccess();
          onClose();
        } else {
          setError("Login failed. Please check your credentials.");
        }
      } else {
        if (res.data === "success" || res.data?.success) {
          setError("Account created successfully! Please login.");
          setMode("login");
          setPassword("");
        } else {
          setError("Signup response received. Please try login.");
          setMode("login");
          setPassword("");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data || "Authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-[450px] rounded-[40px] p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-8 text-gray-400 hover:text-black transition-colors">
          <X size={24} />
        </button>

        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          {mode === "login" ? "Login to continue" : "Create Account"}
        </h2>
        
        <div className="space-y-4 mt-6">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter Name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="name"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase mb-1">Profession</label>
                  <input
                    type="text"
                    placeholder="e.g. Architect"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase mb-1">Mobile</label>
                  <input
                    type="text"
                    placeholder="Mobile No"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      if (error) setError("");
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={mode === "signup" && !!mobile && !isValidMobile(mobile)}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Email Address</label>
            <input
              type="email"
              placeholder="email@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold uppercase mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-9 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-full font-bold uppercase tracking-widest mt-4 hover:bg-gray-800 transition-all disabled:bg-gray-400"
          >
            {loading ? "Processing..." : mode === "login" ? "Login" : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-600 mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              {mode === "login" ? "Create Account" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
