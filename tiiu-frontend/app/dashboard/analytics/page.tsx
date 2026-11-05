"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ParastatalsAnalytics from "@/components/analytics/ParastatalsAnalytics";
import DepartmentsAnalytics from "@/components/analytics/DepartmentsAnalytics";
import ODKAnalytics from "@/components/analytics/ODKAnalytics";

export default function ExecutiveAnalyticsContainerPage() {
  const [activeTab, setActiveTab] = useState<"parastatals" | "departments" | "odk">("parastatals");
  const [showMandates, setShowMandates] = useState<boolean>(false);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Executive Header Banner */}
        <div className="bg-emerald-950 text-white rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-emerald-900 pb-6">
            
            {/* Top-Left Logo & Title */}
            <div className="flex items-center gap-4">
              {/* Nigeria Coat of Arms Logo Placeholder */}
              <div className="w-16 h-16 bg-white/10 rounded-2xl border border-emerald-700/50 flex items-center justify-center overflow-hidden shrink-0">
                <Image 
                  src="/Coat_of_arms_of_Nigeria.jpg" 
                  alt="Nigeria Coat of Arms" 
                  width={56} 
                  height={56}
                  className="object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="text-2xl text-emerald-300 font-bold"></span>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Link 
                    href="/dashboard" 
                    className="text-xs bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-semibold transition"
                  >
                    ← Back to Operational Pipeline
                  </Link>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    FMITI Executive Intelligence Engine
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Analytics & Policy Command Center</h1>
              </div>
            </div>

            {/* Expandable Core Mandate Toggle Button */}
            <button
              onClick={() => setShowMandates(!showMandates)}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-5 py-3 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 border border-emerald-400/40 shrink-0"
            >
              <span>🏛️</span>
              <span className="text-white">{showMandates ? "Hide Core Mandates & Objectives" : "View Core Mandates & Strategic Objectives"}</span>
              <span className="text-white">{showMandates ? "▲" : "▼"}</span>
            </button>
          </div>

          {/* Institutional Mandate Statement */}
          <div className="bg-emerald-900/40 border border-emerald-800 p-4 rounded-2xl text-xs text-white leading-relaxed">
            <span className="font-extrabold text-white uppercase text-[10px] tracking-wider block mb-1">Mandate Statement:</span>
            <p className="text-slate-100 font-medium">
              To formulate and implement policies that stimulate the growth of the domestic economy through industrialization, trade expansion, and investment attraction.
            </p>
          </div>

          {/* Expandable Strategic Objectives Card */}
          {showMandates && (
            <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-2xl p-6 text-xs text-white space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                <h3 className="font-black text-sm uppercase text-white tracking-wide flex items-center gap-2">
                  <span>📜</span> FMITI Core Mandates & Objectives
                </h3>
                <span className="text-[10px] bg-emerald-800 text-white px-3 py-1 rounded-full font-mono font-bold">
                  Policy Framework 2023-2027
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Economic Diversification */}
                <div className="bg-emerald-950/70 p-4 rounded-xl border border-emerald-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-200 font-bold text-xs">
                    <span>🌾</span> Economic Diversification
                  </div>
                  <p className="text-[11px] text-white/95 leading-normal font-normal">
                    Reduce Nigeria's heavy reliance on oil and gas by promoting the production and export of non-oil products.
                  </p>
                </div>

                {/* 2. Industrialization */}
                <div className="bg-emerald-950/70 p-4 rounded-xl border border-emerald-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-200 font-bold text-xs">
                    <span>🏗️</span> Industrialization
                  </div>
                  <p className="text-[11px] text-white/95 leading-normal font-normal">
                    Drive domestic industrial growth, build local manufacturing capacity, and transition into an innovation-driven industrial hub.
                  </p>
                </div>

                {/* 3. Investment Promotion */}
                <div className="bg-emerald-950/70 p-4 rounded-xl border border-emerald-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-200 font-bold text-xs">
                    <span>📈</span> Investment Promotion
                  </div>
                  <p className="text-[11px] text-white/95 leading-normal font-normal">
                    Attract and sustain both local and foreign direct investments (FDI) to boost economic productivity.
                  </p>
                </div>

                {/* 4. Trade Expansion */}
                <div className="bg-emerald-950/70 p-4 rounded-xl border border-emerald-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-200 font-bold text-xs">
                    <span>🌐</span> Trade Expansion
                  </div>
                  <p className="text-[11px] text-white/95 leading-normal font-normal">
                    Enhance Nigeria's competitiveness in regional (AfCFTA) and global trade markets.
                  </p>
                </div>

                {/* 5. SME Support */}
                <div className="bg-emerald-950/70 p-4 rounded-xl border border-emerald-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-200 font-bold text-xs">
                    <span>🌱</span> SME Support
                  </div>
                  <p className="text-[11px] text-white/95 leading-normal font-normal">
                    Empower micro, small, and medium-sized enterprises (MSMEs) to foster enterprise development, job creation, and poverty reduction.
                  </p>
                </div>

                {/* 6. Ease of Doing Business */}
                <div className="bg-emerald-950/70 p-4 rounded-xl border border-emerald-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-200 font-bold text-xs">
                    <span>🤝</span> Ease of Doing Business
                  </div>
                  <p className="text-[11px] text-white/95 leading-normal font-normal">
                    Streamline regulatory frameworks and build public-private partnerships (PPPs) to create a business-friendly environment.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("parastatals")}
            className={`px-5 py-3 font-extrabold text-xs rounded-2xl transition flex items-center gap-2 ${
              activeTab === "parastatals"
                ? "bg-emerald-900 text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span>🏢</span> Parastatals Registry & Analytics
          </button>

          <button
            onClick={() => setActiveTab("departments")}
            className={`px-5 py-3 font-extrabold text-xs rounded-2xl transition flex items-center gap-2 ${
              activeTab === "departments"
                ? "bg-emerald-900 text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span>🏛️</span> Departmental KPIs & Intelligence
          </button>

          <button
            onClick={() => setActiveTab("odk")}
            className={`px-5 py-3 font-extrabold text-xs rounded-2xl transition flex items-center gap-2 ${
              activeTab === "odk"
                ? "bg-emerald-900 text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span>📊</span> ODK Field Survey Intelligence
          </button>
        </div>

        {/* Dynamic Analytics Tab Host */}
        <div className="mt-4">
          {activeTab === "parastatals" && <ParastatalsAnalytics />}
          {activeTab === "departments" && <DepartmentsAnalytics />}
          {activeTab === "odk" && <ODKAnalytics />}
        </div>

      </div>
    </main>
  );
}