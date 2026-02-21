"use client";

import { useState } from "react";
import axios from "axios";
import { X, Eye, EyeOff } from "lucide-react";
import { API_BASE } from "@/lib/constants";

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

  if (!open) return null;

  const handleSubmit = async () => {
    if (!email || !password) return alert("Please fill in email and password.");
    if (mode === "signup" && (!name || !mobile)) return alert("Please fill in name and mobile number.");

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/cust_login" : "/cust_signup";
      
      const payload = mode === "login" 
        ? { email, password } 
        : { 
            name, 
            email, 
            profession, 
            mobile, 
            password 
          };

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);

      if (mode === "login") {
        if (res.data.pgatoken) {
          // Changed to sessionStorage for automatic logout when tab closes
          sessionStorage.setItem("pgatoken", res.data.pgatoken);
          onSuccess();
          onClose();
        } else {
          alert("Login failed: " + (res.data || "Invalid credentials"));
        }
      } else {
        if (res.data === "success") {
          alert("Account created successfully! Please login.");
          setMode("login");
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data || "Authentication error occurred.");
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
                  onChange={(e) => setName(e.target.value)}
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
                    onChange={(e) => setMobile(e.target.value)}
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
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold uppercase mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-9 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

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
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
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