"use client";
import React, { useState } from "react";
import { verifyParastatal } from "@/services/tiiuApi";

export default function QuickVerificationTool() {
  const [parastatalType, setParastatalType] = useState("cac");
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setLoading(true);
    try {
      const data = await verifyParastatal(parastatalType, identifier);
      setResult(data);
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-xl mx-auto">
      <h3 className="text-sm font-black uppercase text-slate-900">🛡️ Single Verification API Tool</h3>
      <form onSubmit={handleVerify} className="space-y-3 text-xs">
        <div>
          <label className="block font-bold uppercase text-slate-600 mb-1">Select Parastatal Agency</label>
          <select value={parastatalType} onChange={(e) => setParastatalType(e.target.value)} className="w-full border rounded-xl p-3 bg-slate-50 font-bold">
            <option value="cac">Corporate Affairs Commission (CAC)</option>
            <option value="boi">Bank of Industry (BOI)</option>
            <option value="son">Standards Organisation of Nigeria (SON)</option>
          </select>
        </div>
        <div>
          <label className="block font-bold uppercase text-slate-600 mb-1">Enter Registration / License Number</label>
          <input type="text" required placeholder="e.g. RC-123456" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full border rounded-xl p-3 font-mono" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow transition">
          {loading ? "Verifying..." : "Verify Record Status"}
        </button>
      </form>
      {result && (
        <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-xs font-mono">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}