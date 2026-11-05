"use client";
import React from 'react';
import { useAuthUser } from '@/hooks/useAuth';

interface DashboardActionsProps {
  onTabChange?: (tab: "admin" | "excel" | "verification" | "aggregations" | "registry" | "departments") => void;
}

export default function DashboardActions({ onTabChange }: DashboardActionsProps) {
  const { role, isSuperAdmin, isDepartmentOfficer, isParastatalOfficer, isFieldAuditor } = useAuthUser();

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Role Action Matrix</h3>
          <p className="text-xs text-slate-500">Quick operational controls tailored for: <span className="font-semibold text-emerald-900">{role}</span></p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {(isSuperAdmin || isDepartmentOfficer) && (
          <button 
            onClick={() => onTabChange?.("departments")} 
            className="bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition"
          >
            🏛️ Log Department KPI
          </button>
        )}

        {(isSuperAdmin || isParastatalOfficer) && (
          <button 
            onClick={() => onTabChange?.("registry")} 
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition"
          >
            🏢 Search Parastatal Registry
          </button>
        )}

        {(isSuperAdmin || isFieldAuditor) && (
          <button 
            onClick={() => onTabChange?.("excel")} 
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition"
          >
            📤 Upload Remote Field Excel
          </button>
        )}

        {isSuperAdmin && (
          <button 
            onClick={() => onTabChange?.("verification")} 
            className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition"
          >
            🔍 Verify Parastatal Registration
          </button>
        )}

        <button 
          onClick={() => onTabChange?.("aggregations")} 
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition border border-slate-200"
        >
          📈 View Field Intelligence
        </button>
      </div>
    </div>
  );
}