// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { X, Eye, EyeOff } from "lucide-react";
// import { API_BASE } from "@/lib/constants";
// import { isValidMobile, validateAuthForm } from "@/lib/authValidation";

// interface Props {
//   open: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function AuthModal({ open, onClose, onSuccess }: Props) {
//   const [mode, setMode] = useState<"login" | "signup">("login");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [name, setName] = useState("");
//   const [profession, setProfession] = useState("Customer");
//   const [mobile, setMobile] = useState("");
  
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   if (!open) return null;

//   const handleSubmit = async () => {
//     const validationError = validateAuthForm({
//       mode,
//       email,
//       password,
//       name,
//       mobile,
//     });

//     if (validationError) {
//       setError(validationError);
//       return;
//     }

//     setLoading(true);
//     setError("");
//     try {
//       const endpoint = mode === "login" ? "/cust_login" : "/cust_signup";
      
//       const payload = mode === "login" 
//         ? { email: email.trim(), password } 
//         : { 
//             name: name.trim(), 
//             email: email.trim(), 
//             profession: profession.trim() || "Customer", 
//             mobile: mobile.trim(), 
//             password 
//           };

//       const res = await axios.post(`${API_BASE}${endpoint}`, payload);

//       if (mode === "login") {
//         if (res.data.pgatoken) {
//           sessionStorage.setItem("pgatoken", res.data.pgatoken);
//           onSuccess();
//           onClose();
//         } else {
//           setError("Login failed. Please check your credentials.");
//         }
//       } else {
//         if (res.data === "success" || res.data?.success) {
//           setError("Account created successfully! Please login.");
//           setMode("login");
//           setPassword("");
//         } else {
//           setError("Signup response received. Please try login.");
//           setMode("login");
//           setPassword("");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.response?.data || "Authentication error occurred.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
//       <div className="bg-white w-full max-w-[450px] rounded-[40px] p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
//         <button onClick={onClose} className="absolute top-6 right-8 text-gray-400 hover:text-black transition-colors">
//           <X size={24} />
//         </button>

//         <h2 className="text-3xl font-semibold text-gray-900 mb-2">
//           {mode === "login" ? "Login to continue" : "Create Account"}
//         </h2>
        
//         <div className="space-y-4 mt-6">
//           {mode === "signup" && (
//             <>
//               <div>
//                 <label className="block text-xs font-bold uppercase mb-1">Full Name</label>
//                 <input
//                   type="text"
//                   placeholder="Enter Name"
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
//                   value={name}
//                   onChange={(e) => {
//                     setName(e.target.value);
//                     if (error) setError("");
//                   }}
//                   autoComplete="name"
//                 />
//               </div>
//               <div className="flex gap-3">
//                 <div className="flex-1">
//                   <label className="block text-xs font-bold uppercase mb-1">Profession</label>
//                   <input
//                     type="text"
//                     placeholder="e.g. Architect"
//                     className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
//                     value={profession}
//                     onChange={(e) => setProfession(e.target.value)}
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <label className="block text-xs font-bold uppercase mb-1">Mobile</label>
//                   <input
//                     type="text"
//                     placeholder="Mobile No"
//                     className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
//                     value={mobile}
//                     onChange={(e) => {
//                       setMobile(e.target.value);
//                       if (error) setError("");
//                     }}
//                     inputMode="tel"
//                     autoComplete="tel"
//                     aria-invalid={mode === "signup" && !!mobile && !isValidMobile(mobile)}
//                   />
//                 </div>
//               </div>
//             </>
//           )}

//           <div>
//             <label className="block text-xs font-bold uppercase mb-1">Email Address</label>
//             <input
//               type="email"
//               placeholder="email@example.com"
//               className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
//               value={email}
//               onChange={(e) => {
//                 setEmail(e.target.value);
//                 if (error) setError("");
//               }}
//               autoComplete="email"
//             />
//           </div>

//           <div className="relative">
//             <label className="block text-xs font-bold uppercase mb-1">Password</label>
//             <input
//               type={showPassword ? "text" : "password"}
//               placeholder="Password"
//               className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
//               value={password}
//               onChange={(e) => {
//                 setPassword(e.target.value);
//                 if (error) setError("");
//               }}
//               autoComplete={mode === "login" ? "current-password" : "new-password"}
//             />
//             <button 
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-4 top-9 text-gray-400"
//             >
//               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//             </button>
//           </div>

//           {error ? (
//             <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//               {error}
//             </p>
//           ) : null}

//           <button
//             onClick={handleSubmit}
//             disabled={loading}
//             className="w-full bg-black text-white py-4 rounded-full font-bold uppercase tracking-widest mt-4 hover:bg-gray-800 transition-all disabled:bg-gray-400"
//           >
//             {loading ? "Processing..." : mode === "login" ? "Login" : "Create Account"}
//           </button>

//           <p className="text-center text-sm text-gray-600 mt-6">
//             {mode === "login" ? "Don't have an account? " : "Already have an account? "}
//             <button 
//               type="button"
//               onClick={() => {
//                 setMode(mode === "login" ? "signup" : "login");
//                 setError("");
//               }}
//               className="text-blue-600 font-bold hover:underline"
//             >
//               {mode === "login" ? "Create Account" : "Login"}
//             </button>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
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
  const [error, setError] = useState("");

  if (!open) return null;



const handleSubmit = async () => {
  setError("");
  if (!email || !password) { setError("Please enter email and password."); return; }
  if (mode === "signup" && (!name || !mobile)) { setError("Please enter name and mobile."); return; }

  setLoading(true);
  try {
    const endpoint = mode === "login" ? "cust_login" : "cust_signup";

    // build URL safely
    const rawBase = String(API_BASE ?? "");
    const base = rawBase.trim().replace(/\/+$/, "");
    if (!base) {
      setError("API base URL not configured (NEXT_PUBLIC_API_BASE).");
      setLoading(false);
      return;
    }

    let url = "";
    try {
      url = new URL(`/${endpoint}`, base).toString();
    } catch (e) {
      console.error("Bad API URL parts:", { rawBase, base, endpoint, e });
      setError("Invalid API base URL.");
      setLoading(false);
      return;
    }

    console.log("Auth URL =", url);

    const payload = mode === "login"
      ? { email, password }
      : { name, email, profession, mobile, password };

    const res = await axios.post(url, payload, { withCredentials: true });

    if (mode === "login") {
      if (res.data?.pgatoken) {
        sessionStorage.setItem("pgatoken", res.data.pgatoken);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("auth-changed", { detail: { loggedIn: true } })
          );
        }
        onSuccess();
        onClose();
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } else {
      setMode("login");
      setError("Account created! Please login.");
    }
  } catch (err: any) {
    console.error("Auth error full:", err);
    console.error("Auth error response:", err?.response);
    setError(
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "Authentication error occurred."
    );
  } finally {
    setLoading(false);
  }
};



  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 100000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        pointerEvents: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "380px",
          boxShadow: "0 5px 30px rgba(0,0,0,0.3)",
          border: "1px solid rgba(0,0,0,0.18)",
          overflow: "hidden",
          fontFamily: "'UbuntuM', sans-serif",
          pointerEvents: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px 14px",
          borderBottom: "1px solid #ebebeb",
        }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#111", lineHeight: 1.2 }}>
              {mode === "login" ? "Login" : "Create Account"}
            </div>
            <div style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>
              Continue to Visualizer
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "22px", color: "#000", opacity: 0.45,
              lineHeight: 1, padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>

          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Profession"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: "44px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: "12px", top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "#94a3b8", display: "flex", alignItems: "center",
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{
              background: error.includes("created") ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${error.includes("created") ? "#bbf7d0" : "#fecaca"}`,
              color: error.includes("created") ? "#166534" : "#b91c1c",
              borderRadius: "8px", padding: "8px 12px", fontSize: "12px",
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", height: "44px",
              background: loading ? "#94a3b8" : "#0f172a",
              color: "#fff", border: "none", borderRadius: "8px",
              fontFamily: "'UbuntuM', sans-serif",
              fontSize: "13px", fontWeight: 700,
              letterSpacing: "0.10em", textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "2px",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Please wait..." : mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
          </button>

          <p style={{ textAlign: "center", fontSize: "13px", color: "#555", margin: "4px 0 0" }}>
            {mode === "login" ? "No account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#1d4ed8", fontFamily: "'UbuntuM', sans-serif",
                fontSize: "13px", fontWeight: 700, padding: 0,
              }}
            >
              {mode === "login" ? "Create one" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "42px",
  border: "1px solid #d1d9e0",
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "14px",
  color: "#0f172a",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'UbuntuM', sans-serif",
};
