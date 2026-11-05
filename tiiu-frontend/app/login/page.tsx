"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("field_auditor");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isRegistering) {
        // Register API call (JSON body)
        const res = await fetch("http://localhost:8000/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Registration failed");
        }

        setSuccessMessage("Account registered successfully! You can now log in.");
        setIsRegistering(false);
      } else {
        // OAuth2 Password Request Form Login Call (Form Data)
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const res = await fetch("http://localhost:8000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Authentication failed");
        }

        const data = await res.json();

        // Save token and user details to LocalStorage
        localStorage.setItem("tiiu_token", data.access_token);
        localStorage.setItem(
          "tiiu_user",
          JSON.stringify({
            email: data.email,
            role: data.role,
            token: data.access_token,
          })
        );

        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-950">FMITI TIIU Portal</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isRegistering
              ? "Create your platform account"
              : "Sign in to access your role dashboard"}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 text-sm p-3 rounded-xl border border-emerald-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g., uzzokel@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Default Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-800"
              >
                <option value="field_auditor">Field Auditor</option>
                <option value="department_officer">Department Officer</option>
                <option value="parastatal_officer">Parastatal Officer</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition text-sm shadow cursor-pointer disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : isRegistering
              ? "Register Account"
              : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setSuccessMessage(null);
            }}
            className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
          >
            {isRegistering
              ? "Already registered? Sign In"
              : "First time user? Register here"}
          </button>
        </div>
      </div>
    </main>
  );
}