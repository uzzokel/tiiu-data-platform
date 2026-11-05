"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  FileText, 
  Download, 
  BarChart3, 
  Activity,
  ShieldCheck,
  RefreshCw,
  Target,
  CheckCircle2,
  ChevronRight,
  Layers,
  CheckSquare,
  Filter,
  ListFilter
} from "lucide-react";
import { FMITI_DEPARTMENTS } from "@/lib/fmitiData";

interface LoggedKPI {
  id: number;
  department_name: string;
  area_of_focus: string;
  kpi_title: string;
  target_value: number;
  achieved_value: number;
  quarter_period: string;
  achievement_rate: number;
  objective_deliverable?: string;
  narrative?: string;
  created_at?: string;
}

interface DepartmentGroup {
  name: string;
  code: string;
  headOfDept: string;
  totalTarget: number;
  totalAchieved: number;
  achievementRate: number;
  kpiCount: number;
  kpis: LoggedKPI[];
  hasData: boolean;
  executiveSummary: string;
}

const getDeptCode = (name: string): string => {
  return name
    .split(" ")
    .filter(w => w.length > 2 && w.toLowerCase() !== "department" && w.toLowerCase() !== "and" && w.toLowerCase() !== "of")
    .map(w => w[0].toUpperCase())
    .join("") || "DEPT";
};

export default function DepartmentsAnalytics() {
  const [isMounted, setIsMounted] = useState(false);
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  
  // Dynamic 3-Step Cascade Selection State
  const [selectedDeptName, setSelectedDeptName] = useState<string>("");
  const [selectedFocusArea, setSelectedFocusArea] = useState<string>("");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>("");
  
  // Analytics Engine View Toggle State
  const [analyticsView, setAnalyticsView] = useState<"kpi" | "powerbi" | "streamlit">("kpi");
  const powerBiUrl = process.env.NEXT_PUBLIC_POWERBI_EMBED_URL || "";
  const streamlitUrl = process.env.NEXT_PUBLIC_STREAMLIT_URL || "http://localhost:8501";

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Policy Memo State
  const [memoTitle, setMemoTitle] = useState("");
  const [memoBody, setMemoBody] = useState("");
  const [memoActionItems, setMemoActionItems] = useState("");
  
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Fetch live KPI records from tiiu.db via FastAPI backend
  const fetchLiveDepartmentsData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("http://localhost:8000/api/v1/departments/kpis");
      let backendKpis: LoggedKPI[] = [];
      if (response.ok) {
        const data = await response.json();
        backendKpis = data.kpis || [];
      }

      const kpiGroupMap = new Map<string, LoggedKPI[]>();
      backendKpis.forEach((kpi) => {
        const key = (kpi.department_name || "").trim().toLowerCase();
        if (!kpiGroupMap.has(key)) {
          kpiGroupMap.set(key, []);
        }
        kpiGroupMap.get(key)!.push(kpi);
      });

      const builtList: DepartmentGroup[] = FMITI_DEPARTMENTS.map((deptName) => {
        const matchedKpis = kpiGroupMap.get(deptName.trim().toLowerCase()) || [];
        const hasData = matchedKpis.length > 0;
        
        const totalTarget = matchedKpis.reduce((acc, curr) => acc + (curr.target_value || 0), 0);
        const totalAchieved = matchedKpis.reduce((acc, curr) => acc + (curr.achieved_value || 0), 0);
        const achievementRate = totalTarget > 0 ? Number(((totalAchieved / totalTarget) * 100).toFixed(1)) : 0;
        const code = getDeptCode(deptName);

        const summary = hasData
          ? matchedKpis.map(k => `${k.kpi_title} (${k.quarter_period}): Target ${k.target_value}, Achieved ${k.achieved_value} (${k.achievement_rate}%).`).join(" ")
          : `No performance KPI entries logged yet for ${deptName} in tiiu.db.`;

        return {
          name: deptName,
          code: code,
          headOfDept: `Director, ${deptName}`,
          totalTarget,
          totalAchieved,
          achievementRate,
          kpiCount: matchedKpis.length,
          kpis: matchedKpis,
          hasData,
          executiveSummary: summary
        };
      });

      setDepartments(builtList);
      if (builtList.length > 0) {
        const activeDefault = builtList.find(d => d.hasData) || builtList[0];
        setSelectedDeptName(activeDefault.name);
      }
    } catch (err: any) {
      console.error("Database connection error:", err);
      setErrorMessage("Could not connect to FastAPI backend. Verify server is running at http://localhost:8000.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchLiveDepartmentsData();
  }, []);

  const currentDept = departments.find(d => d.name === selectedDeptName) || departments[0];

  // Cascading Effect 1: When Department changes, reset Focus Area dropdown
  useEffect(() => {
    if (currentDept && currentDept.kpis.length > 0) {
      const focusAreas = Array.from(new Set(currentDept.kpis.map(k => k.area_of_focus)));
      setSelectedFocusArea(focusAreas[0] || "");
    } else {
      setSelectedFocusArea("");
      setSelectedObjectiveId("");
    }
  }, [selectedDeptName, currentDept]);

  // Available Focus Areas for active department
  const availableFocusAreas = currentDept ? Array.from(new Set(currentDept.kpis.map(k => k.area_of_focus))) : [];
  
  // Filtered KPIs under selected Focus Area
  const focusAreaKpis = currentDept ? currentDept.kpis.filter(k => k.area_of_focus === selectedFocusArea) : [];

  // Cascading Effect 2: When Focus Area changes, select first Objective
  useEffect(() => {
    if (focusAreaKpis.length > 0) {
      setSelectedObjectiveId(String(focusAreaKpis[0].id));
    } else {
      setSelectedObjectiveId("");
    }
  }, [selectedFocusArea, selectedDeptName]);

  // Selected Objective KPI Record
  const activeObjectiveKpi = focusAreaKpis.find(k => String(k.id) === selectedObjectiveId) || focusAreaKpis[0];

  useEffect(() => {
    if (currentDept) {
      setMemoTitle(`Executive Policy Directive: ${currentDept.name} (${currentDept.code})`);
      setMemoBody(currentDept.executiveSummary);
      setMemoActionItems(
        currentDept.hasData
          ? currentDept.kpis.map((k, i) => `${i + 1}. [${k.area_of_focus}] ${k.kpi_title}: ${k.achieved_value}/${k.target_value} achieved (${k.achievement_rate}% rate).`).join("\n")
          : "1. Log initial quarterly KPIs from the dashboard entry form.\n2. Verify target parameters in tiiu.db."
      );
    }
  }, [selectedDeptName, currentDept]);

  const handleExportPDF = async () => {
    if (!pdfRef.current || !currentDept) return;
    setIsExportingPdf(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = pdfRef.current;
      const opt = {
        margin: 0.5,
        filename: `${currentDept.code}_Departmental_Policy_Briefing_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Export error:", error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs animate-pulse flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <span>Syncing live FMITI Departmental KPIs from tiiu.db...</span>
      </div>
    );
  }

  const sortedTrendKpis = currentDept ? [...currentDept.kpis].sort((a, b) => (a.quarter_period > b.quarter_period ? 1 : -1)) : [];

  return (
    <div className="space-y-8 p-6 bg-slate-50 min-h-screen text-slate-900">
      
      {/* Step 1: Department Selection Header & Analytics View Toggle */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                Departmental Intelligence Command
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Interactive 3-Step Selection & Dual Analytics Engine (Power BI & Streamlit Predictions) for <code className="text-indigo-600 font-mono font-bold">tiiu.db</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setAnalyticsView("kpi")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                  analyticsView === "kpi" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎯 KPI Explorer
              </button>
              <button
                onClick={() => setAnalyticsView("powerbi")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                  analyticsView === "powerbi" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📊 Power BI
              </button>
              <button
                onClick={() => setAnalyticsView("streamlit")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                  analyticsView === "streamlit" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🐍 Streamlit ML
              </button>
            </div>

            <button
              onClick={fetchLiveDepartmentsData}
              title="Refresh database stream"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-STEP SELECTION BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          
          {/* STEP 1: Department Selection */}
          <div className="space-y-1">
            <label htmlFor="dept-select" className="text-[11px] font-bold uppercase text-slate-600 font-mono flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
              Select Department:
            </label>
            <select
              id="dept-select"
              value={selectedDeptName}
              onChange={(e) => setSelectedDeptName(e.target.value)}
              className="w-full bg-slate-100 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept.name} value={dept.name}>
                  {dept.name} ({dept.code}) {dept.hasData ? "🟢" : "⚪"}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: Focus Area Selection */}
          <div className="space-y-1">
            <label htmlFor="focus-select" className="text-[11px] font-bold uppercase text-slate-600 font-mono flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
              Select Focus Area (KRA):
            </label>
            <select
              id="focus-select"
              value={selectedFocusArea}
              disabled={availableFocusAreas.length === 0}
              onChange={(e) => setSelectedFocusArea(e.target.value)}
              className="w-full bg-slate-100 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {availableFocusAreas.length === 0 ? (
                <option value="">No Focus Areas Logged</option>
              ) : (
                availableFocusAreas.map((fa) => (
                  <option key={fa} value={fa}>
                    {fa}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* STEP 3: Objective Selection */}
          <div className="space-y-1">
            <label htmlFor="obj-select" className="text-[11px] font-bold uppercase text-slate-600 font-mono flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
              Select Objective / KPI:
            </label>
            <select
              id="obj-select"
              value={selectedObjectiveId}
              disabled={focusAreaKpis.length === 0}
              onChange={(e) => setSelectedObjectiveId(e.target.value)}
              className="w-full bg-slate-100 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {focusAreaKpis.length === 0 ? (
                <option value="">No Objectives Logged</option>
              ) : (
                focusAreaKpis.map((kpi) => (
                  <option key={kpi.id} value={kpi.id}>
                    {kpi.kpi_title} ({kpi.quarter_period})
                  </option>
                ))
              )}
            </select>
          </div>

        </div>
      </div>

      {/* CONDITIONAL VIEW: POWER BI OR STREAMLIT OR DEFAULT KPI VIEW */}
      {analyticsView === "powerbi" ? (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm h-[650px]">
          {powerBiUrl ? (
            <iframe title="Departmental Power BI Report" src={powerBiUrl} className="w-full h-full rounded-2xl border-0" allowFullScreen />
          ) : (
            <div className="w-full h-full rounded-2xl bg-slate-900 text-indigo-400 p-8 flex flex-col justify-center items-center text-center space-y-4">
              <span className="text-4xl">📊</span>
              <h4 className="text-lg font-bold text-white">Power BI Departmental Canvas Ready</h4>
              <p className="text-xs text-slate-400 max-w-md">
                Set <code className="bg-slate-800 px-2 py-1 rounded text-indigo-300">NEXT_PUBLIC_POWERBI_EMBED_URL</code> in your <code className="bg-slate-800 px-2 py-1 rounded text-indigo-300">.env.local</code> file to load live department dashboards.
              </p>
            </div>
          )}
        </div>
      ) : analyticsView === "streamlit" ? (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm h-[650px]">
          <iframe title="Streamlit Department Prediction Engine" src={`${streamlitUrl}/?view=departments&dept=${encodeURIComponent(currentDept.name)}`} className="w-full h-full rounded-2xl border-0" />
        </div>
      ) : (
        <>
          {/* Target vs. Achievement Card for Selected Objective */}
          {activeObjectiveKpi ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                    {currentDept.name} • {activeObjectiveKpi.area_of_focus}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-2">
                    Objective: {activeObjectiveKpi.kpi_title}
                  </h2>
                  {activeObjectiveKpi.objective_deliverable && (
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Deliverable: {activeObjectiveKpi.objective_deliverable}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl">
                    Period: {activeObjectiveKpi.quarter_period}
                  </span>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${
                    activeObjectiveKpi.achievement_rate >= 80 
                      ? "bg-emerald-100 text-emerald-800" 
                      : activeObjectiveKpi.achievement_rate >= 65 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {activeObjectiveKpi.achievement_rate}% Executed
                  </span>
                </div>
              </div>

              {/* Metric Comparison Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold uppercase text-slate-500 font-mono">Target Benchmark</span>
                  <div className="text-3xl font-black text-slate-900">
                    {activeObjectiveKpi.target_value.toLocaleString()} <span className="text-xs text-slate-500">pts</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Planned target for {activeObjectiveKpi.quarter_period}</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold uppercase text-slate-500 font-mono">Achieved Output</span>
                  <div className="text-3xl font-black text-emerald-600">
                    {activeObjectiveKpi.achieved_value.toLocaleString()} <span className="text-xs text-emerald-600/70">pts</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Validated field output logged in tiiu.db</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold uppercase text-slate-500 font-mono">Variance Benchmark</span>
                  <div className="text-3xl font-black text-blue-600">
                    {(activeObjectiveKpi.achieved_value - activeObjectiveKpi.target_value).toLocaleString()} <span className="text-xs text-blue-600/70">pts</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Net target completion difference</p>
                </div>
              </div>

              {/* Visual Progress Comparison Bar */}
              <div className="space-y-3 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <div className="flex justify-between text-xs font-mono text-slate-300 font-bold">
                  <span>TARGET BENCHMARK vs. ACHIEVED OUTPUT VISUALIZER</span>
                  <span className="text-emerald-400">{activeObjectiveKpi.achievement_rate}% Rate</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400 w-20">TARGET:</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: "100%" }} />
                    </div>
                    <span className="text-slate-200 font-bold w-16 text-right">{activeObjectiveKpi.target_value.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400 w-20">ACHIEVED:</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.round((activeObjectiveKpi.achieved_value / Math.max(activeObjectiveKpi.target_value, 1)) * 100))}%` }} 
                      />
                    </div>
                    <span className="text-emerald-400 font-bold w-16 text-right">{activeObjectiveKpi.achieved_value.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 font-mono text-xs bg-white rounded-3xl border border-slate-200 shadow-sm">
              No KPI entries logged for {currentDept.name} in tiiu.db. Use the form at <code className="text-indigo-600 font-bold">/dashboard</code> to log records.
            </div>
          )}

          {/* Dynamic Performance Trendline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Overall Department Trendline: {currentDept.name} ({currentDept.code})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">X-axis represents periods/years; Y-axis represents target vs achieved points.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                <span className="flex items-center gap-1.5 text-indigo-600"><span className="w-3 h-3 bg-indigo-500 rounded-full inline-block"></span> Target</span>
                <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span> Achieved</span>
              </div>
            </div>

            <div className="w-full h-56 bg-slate-900 rounded-2xl p-6 flex flex-col justify-between border border-slate-800 relative">
              {sortedTrendKpis.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                  <span>No trend records available in tiiu.db for {currentDept.name}.</span>
                </div>
              ) : (
                <>
                  <div className="w-full h-36 relative flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                      <line x1="0" y1="30" x2="400" y2="30" stroke="#334155" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="60" x2="400" y2="60" stroke="#334155" strokeDasharray="4" strokeWidth="1" />
                      <line x1="0" y1="90" x2="400" y2="90" stroke="#334155" strokeDasharray="4" strokeWidth="1" />

                      {(() => {
                        const maxVal = Math.max(...sortedTrendKpis.map(k => Math.max(k.target_value, k.achieved_value)), 10);
                        const pointsTarget = sortedTrendKpis.map((k, idx) => {
                          const x = idx * (400 / Math.max(sortedTrendKpis.length - 1, 1));
                          const y = 120 - (k.target_value / maxVal) * 100 - 10;
                          return `${x},${y}`;
                        }).join(" ");

                        const pointsAchieved = sortedTrendKpis.map((k, idx) => {
                          const x = idx * (400 / Math.max(sortedTrendKpis.length - 1, 1));
                          const y = 120 - (k.achieved_value / maxVal) * 100 - 10;
                          return `${x},${y}`;
                        }).join(" ");

                        return (
                          <>
                            <polyline fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pointsTarget} />
                            <polyline fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pointsAchieved} />

                            {sortedTrendKpis.map((k, idx) => {
                              const x = idx * (400 / Math.max(sortedTrendKpis.length - 1, 1));
                              const y = 120 - (k.target_value / maxVal) * 100 - 10;
                              return <circle key={`t-${idx}`} cx={x} cy={y} r="4" className="fill-indigo-400 stroke-slate-900 stroke-2" />;
                            })}

                            {sortedTrendKpis.map((k, idx) => {
                              const x = idx * (400 / Math.max(sortedTrendKpis.length - 1, 1));
                              const y = 120 - (k.achieved_value / maxVal) * 100 - 10;
                              return <circle key={`a-${idx}`} cx={x} cy={y} r="4" className="fill-emerald-400 stroke-slate-900 stroke-2" />;
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                    {sortedTrendKpis.map((k, idx) => (
                      <span key={idx} className="truncate px-1">
                        {k.quarter_period}: <span className="text-indigo-400">T:{k.target_value}</span> / <span className="text-emerald-400">A:{k.achieved_value}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Editable Ministerial Policy Briefing Generator */}
          <div ref={pdfRef} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Ministerial Policy Briefing Generator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Editable executive directive template formatted for PDF export.</p>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={isExportingPdf}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExportingPdf ? "Generating PDF..." : "Export Briefing (PDF)"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 font-mono mb-1">Briefing Title</label>
                <input
                  type="text"
                  value={memoTitle}
                  onChange={(e) => setMemoTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 font-mono mb-1">Executive Summary</label>
                <textarea
                  rows={3}
                  value={memoBody}
                  onChange={(e) => setMemoBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 font-mono mb-1">Recommended Directives & Action Items</label>
                <textarea
                  rows={3}
                  value={memoActionItems}
                  onChange={(e) => setMemoActionItems(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Executive Institutional Footer */}
      <footer className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="font-bold text-slate-200">FEDERAL MINISTRY OF INDUSTRY, TRADE AND INVESTMENT</div>
            <div className="text-[11px] text-slate-400">Trade & Industry Intelligence Unit (TIIU) Data Platform • Dynamic Cascade Sync</div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-slate-400 text-[11px]">
          <span>Database: <strong className="text-emerald-400 font-bold">tiiu.db</strong></span>
          <span>Status: <strong className="text-emerald-400 font-bold">LIVE SYNC</strong></span>
        </div>
      </footer>

    </div>
  );
}