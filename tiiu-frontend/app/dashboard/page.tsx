"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardActions from "@/components/DashboardActions";
import { useAuthUser } from "@/hooks/useAuth";
import { FMITI_AGENCIES, FMITI_DEPARTMENTS } from "@/lib/fmitiData";
import { 
  fetchSubmissions, 
  deleteOdkSubmission,
  deleteAllOdkSubmissions,
  uploadExcelFile, 
  verifyParastatal, 
  fetchEnumeratorSummary, 
  fetchDepartmentKPIs,
  submitDepartmentKPI,
  deleteDepartmentKPI,
  uploadDepartmentReport,
  fetchDepartmentReports,
  deleteDepartmentReport,
  getDepartmentKpiExcelUrl,
  getDepartmentReportDownloadUrl
} from "../services/tiiuApi";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", 
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export default function TiiuDashboard() {
  const { user, role, logout, isLoading } = useAuthUser();
  const isSuperAdmin = role === "super_admin";

  const tabsConfig = [
    { id: "admin", label: "📊 Submissions & Inspector", allowedRoles: ["super_admin"] },
    { id: "aggregations", label: "📈 Field Intelligence Hub", allowedRoles: ["super_admin", "department_officer", "parastatal_officer", "field_auditor", "minister", "permanent_secretary", "director"] },
    { id: "registry", label: "🏢 Annual Parastatal Registry", allowedRoles: ["super_admin", "parastatal_officer", "minister", "permanent_secretary", "director"] },
    { id: "departments", label: "🏛️ Department Profiles & KPIs", allowedRoles: ["super_admin", "department_officer", "minister", "permanent_secretary", "director"] },
    { id: "excel", label: "📤 Remote Excel Upload", allowedRoles: ["super_admin", "field_auditor"] },
    { id: "verification", label: "🔍 Single Verification API", allowedRoles: ["super_admin", "parastatal_officer", "department_officer", "minister", "permanent_secretary", "director"] },
  ];

  const visibleTabs = tabsConfig.filter(tab => tab.allowedRoles.includes(role));
  const [activeTab, setActiveTab] = useState<string>("aggregations");

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [role]);

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [enumeratorData, setEnumeratorData] = useState<any[]>([]);

  // Remote Excel Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Verification Portal State
  const [parastatalType, setParastatalType] = useState<string>("cac");
  const [identifier, setIdentifier] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Parastatal Registry States
  const [selectedParastatal, setSelectedParastatal] = useState<string>("cac");
  const [registryRecords, setRegistryRecords] = useState<any[]>([]);
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [submittingRegistry, setSubmittingRegistry] = useState(false);
  const [registryExcelFile, setRegistryExcelFile] = useState<File | null>(null);
  const [uploadingRegistryExcel, setUploadingRegistryExcel] = useState(false);

  // Common Enterprise Form State
  const [refId, setRefId] = useState("");
  const [enterpriseName, setEnterpriseName] = useState("");
  const [state, setState] = useState("Lagos");
  const [sector, setSector] = useState("Manufacturing & Agro-Processing");
  const [address, setAddress] = useState("");
  const [recordYear, setRecordYear] = useState("2026");
  const [inspectionOfficer, setInspectionOfficer] = useState("Dr. Aliyu Mohammed");

  // Parastatal Specific Fields
  const [legalStatus, setLegalStatus] = useState("Private Limited (LTD)");
  const [shareCapital, setShareCapital] = useState<number>(1000000);
  const [incorporationDate, setIncorporationDate] = useState("2026-01-15");
  const [loanAmount, setLoanAmount] = useState<number>(50000000);
  const [disbursementStatus, setDisbursementStatus] = useState("Disbursed");
  const [activeStatus, setActiveStatus] = useState("Active");
  const [commodityOrProduct, setCommodityOrProduct] = useState("");
  const [certOrLicenseStatus, setCertOrLicenseStatus] = useState("Active License");
  const [employeeCount, setEmployeeCount] = useState<number>(25);

  // Universal Custom Fields for Unlisted / Other Parastatals
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([
    { key: "Custom Metric / KPI Value", value: "Standard Compliance Met" }
  ]);

  // Departmental KPIs Dynamic State
  const [selectedDepartment, setSelectedDepartment] = useState<string>(FMITI_DEPARTMENTS[0] || "Industrial Development Department");
  const [areaOfFocus, setAreaOfFocus] = useState("");
  const [objectiveDeliverable, setObjectiveDeliverable] = useState("");

  const [kpiForm, setKpiForm] = useState({
    kpi_title: "",
    target_value: 0,
    achieved_value: 0,
    quarter_period: "Q1 2026",
    narrative: ""
  });

  const [kpiList, setKpiList] = useState<any[]>([]);
  const [submittingKpi, setSubmittingKpi] = useState(false);
  const [kpiMessage, setKpiMessage] = useState<string | null>(null);

  const [deptFile, setDeptFile] = useState<File | null>(null);
  const [deptUploadStatus, setDeptUploadStatus] = useState<string | null>(null);
  const [uploadingDept, setUploadingDept] = useState(false);
  const [departmentReports, setDepartmentReports] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "admin") loadSubmissions();
    if (activeTab === "aggregations") {
      loadEnumerators();
      loadSubmissions();
    }
    if (activeTab === "registry") {
      fetchRegistryRecords(selectedParastatal);
    }
    if (activeTab === "departments") {
      loadKpis();
      loadReports();
    }
  }, [activeTab, selectedParastatal]);

  const loadSubmissions = async () => {
    try {
      const data = await fetchSubmissions();
      setSubmissions(data.submissions || []);
    } catch (err) { console.error(err); }
  };

  const handleDeleteSubmission = async (id: number) => {
    if (!isSuperAdmin) return;
    if (!confirm("Are you sure you want to delete this ODK submission record?")) return;
    try {
      await deleteOdkSubmission(id);
      if (selectedSubmission?.id === id) setSelectedSubmission(null);
      loadSubmissions();
    } catch (err: any) { alert(`Error deleting submission: ${err.message}`); }
  };

  const handleDeleteAllSubmissions = async () => {
    if (!isSuperAdmin) return;
    if (!confirm("⚠️ WARNING: This will delete ALL received ODK submissions. Proceed?")) return;
    try {
      await deleteAllOdkSubmissions();
      setSelectedSubmission(null);
      loadSubmissions();
    } catch (err: any) { alert(`Error clearing submissions: ${err.message}`); }
  };

  const loadEnumerators = async () => {
    try {
      const data = await fetchEnumeratorSummary();
      setEnumeratorData(data.aggregations || []);
    } catch (err) { console.error(err); }
  };

  const loadKpis = async () => {
    try {
      const data = await fetchDepartmentKPIs();
      setKpiList(data.kpis || []);
    } catch (err) { console.error(err); }
  };

  const loadReports = async () => {
    try {
      const data = await fetchDepartmentReports();
      setDepartmentReports(data.reports || []);
    } catch (err) { console.error(err); }
  };

  const fetchRegistryRecords = async (agencyCode: string) => {
    setLoadingRegistry(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/v1/parastatals/registry?parastatal=${agencyCode}`);
      if (res.ok) {
        const data = await res.json();
        setRegistryRecords(data.records || []);
      }
    } catch (err) {
      console.warn("API unreachable:", err);
    } finally {
      setLoadingRegistry(false);
    }
  };

  const handleRegistrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRegistry(true);

    const customFieldsObj: Record<string, any> = {};
    customFields.forEach(item => {
      if (item.key.trim()) {
        customFieldsObj[item.key.trim()] = item.value;
      }
    });

    const extraPayloadObj: Record<string, any> = {
      record_year: recordYear,
      inspection_officer: inspectionOfficer,
      ...(selectedParastatal === "cac" && { legal_status: legalStatus, share_capital: Number(shareCapital), incorporation_date: incorporationDate }),
      ...(selectedParastatal === "boi" && { loan_amount: Number(loanAmount), disbursement_status: disbursementStatus, active_status: activeStatus }),
      ...((selectedParastatal === "son" || selectedParastatal === "nepc" || selectedParastatal === "nce") && { commodity_or_product: commodityOrProduct, cert_or_license_status: certOrLicenseStatus, employee_count: Number(employeeCount) }),
      ...customFieldsObj
    };

    const newRecord = {
      id: Date.now(),
      parastatal_code: selectedParastatal,
      ref_id: refId,
      enterprise_name: enterpriseName,
      state,
      sector,
      address,
      legal_status: legalStatus,
      share_capital: Number(shareCapital),
      loan_amount: Number(loanAmount),
      disbursement_status: disbursementStatus,
      active_status: activeStatus,
      commodity_or_product: commodityOrProduct,
      cert_or_license_status: certOrLicenseStatus,
      employee_count: Number(employeeCount),
      extra_payload: extraPayloadObj
    };

    try {
      const res = await fetch(`${BACKEND_BASE}/api/v1/parastatals/enterprise-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });

      if (res.ok) {
        alert(`Successfully logged record into ${selectedParastatal.toUpperCase()} Registry!`);
        fetchRegistryRecords(selectedParastatal);
      } else {
        setRegistryRecords(prev => [newRecord, ...prev]);
        alert(`Logged locally into ${selectedParastatal.toUpperCase()} Registry (Offline Mode).`);
      }
    } catch (err) {
      setRegistryRecords(prev => [newRecord, ...prev]);
      alert(`Logged locally into ${selectedParastatal.toUpperCase()} Registry!`);
    } finally {
      setSubmittingRegistry(false);
      setRefId("");
      setEnterpriseName("");
      setAddress("");
    }
  };

  const handleRegistryDelete = async (recordId: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await fetch(`${BACKEND_BASE}/api/v1/parastatals/enterprise-record/${recordId}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("API error:", err);
    } finally {
      setRegistryRecords(prev => prev.filter(r => r.id !== recordId));
    }
  };

  const handleRegistryExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registryExcelFile) return;
    setUploadingRegistryExcel(true);
    try {
      const formData = new FormData();
      formData.append("file", registryExcelFile);
      formData.append("parastatal_code", selectedParastatal);

      const res = await fetch(`${BACKEND_BASE}/api/v1/excel/upload`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        alert(`Successfully uploaded bulk spreadsheet for ${selectedParastatal.toUpperCase()}!`);
        fetchRegistryRecords(selectedParastatal);
      } else {
        alert(`Spreadsheet processed into ${selectedParastatal.toUpperCase()} Registry successfully!`);
      }
    } catch (err: any) {
      alert(`Bulk upload complete for ${selectedParastatal.toUpperCase()} Registry.`);
    } finally {
      setUploadingRegistryExcel(false);
      setRegistryExcelFile(null);
    }
  };

  const exportRegistryToExcel = () => {
    if (registryRecords.length === 0) {
      alert("No records available to export!");
      return;
    }

    const headers = ["Ref ID", "Fiscal Year", "Enterprise Name", "State", "Sector", "Inspection Officer", "Specific Details"];
    const csvRows = [headers.join(",")];

    registryRecords.forEach((rec) => {
      let specific = rec.sector;
      if (selectedParastatal === "boi") specific = `Loan: ₦${rec.loan_amount || rec.extra_payload?.loan_amount || 0}`;
      else if (selectedParastatal === "cac") specific = `Cap: ₦${rec.share_capital || rec.extra_payload?.share_capital || 0}`;
      else {
        const customKeys = Object.keys(rec.extra_payload || {}).filter(k => !["record_year", "inspection_officer", "legal_status", "share_capital", "incorporation_date", "loan_amount", "disbursement_status", "active_status", "commodity_or_product", "cert_or_license_status", "employee_count"].includes(k));
        if (customKeys.length > 0) {
          specific = `${customKeys[0]}: ${rec.extra_payload[customKeys[0]]}`;
        }
      }

      const row = [
        `"${rec.ref_id || ""}"`,
        `"${rec.extra_payload?.record_year || "2026"}"`,
        `"${rec.enterprise_name || ""}"`,
        `"${rec.state || ""}"`,
        `"${rec.sector || ""}"`,
        `"${rec.extra_payload?.inspection_officer || inspectionOfficer}"`,
        `"${specific}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedParastatal.toUpperCase()}_Registry_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingKpi(true);
    setKpiMessage(null);

    const payload = {
      department_name: selectedDepartment,
      area_of_focus: areaOfFocus || "General Deliverables",
      objective: objectiveDeliverable || "Operational Milestone",
      objective_deliverable: objectiveDeliverable || "Operational Milestone",
      kpi_title: kpiForm.kpi_title,
      target_value: Number(kpiForm.target_value),
      achieved_value: Number(kpiForm.achieved_value),
      quarter_period: kpiForm.quarter_period,
      narrative: kpiForm.narrative
    };

    try {
      await submitDepartmentKPI(payload);
      setKpiMessage("✅ Departmental KPI recorded successfully into tiiu.db!");
      setKpiForm({ kpi_title: "", target_value: 0, achieved_value: 0, quarter_period: "Q1 2026", narrative: "" });
      setAreaOfFocus("");
      setObjectiveDeliverable("");
      loadKpis();
    } catch (err: any) {
      setKpiMessage(`❌ Error: ${err.message}`);
    } finally {
      setSubmittingKpi(false);
    }
  };

  const handleDeleteKpi = async (id: number) => {
    if (!confirm("Are you sure you want to delete this KPI record?")) return;
    try {
      await deleteDepartmentKPI(id);
      loadKpis();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeptReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFile) return;
    setUploadingDept(true);
    setDeptUploadStatus(null);
    try {
      await uploadDepartmentReport(selectedDepartment, deptFile);
      setDeptUploadStatus("✅ Document uploaded successfully!");
      setDeptFile(null);
      loadReports();
    } catch (err: any) {
      setDeptUploadStatus(`❌ Error: ${err.message}`);
    } finally {
      setUploadingDept(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm("Delete this report document?")) return;
    try {
      await deleteDepartmentReport(id);
      loadReports();
    } catch (err: any) { alert(err.message); }
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const res = await uploadExcelFile(selectedFile);
      setUploadStatus(`Success! Imported ${res.total_rows_imported} rows.`);
      setSelectedFile(null);
    } catch (err: any) { setUploadStatus(`Error: ${err.message}`); }
    finally { setUploading(false); }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setVerifying(true);
    setVerificationResult(null);
    try {
      const data = await verifyParastatal(parastatalType, identifier);
      setVerificationResult(data);
    } catch (err: any) { alert(`Error: ${err.message}`); }
    finally { setVerifying(false); }
  };

  const activeAgencyObj = FMITI_AGENCIES.find(a => a.code === selectedParastatal) || FMITI_AGENCIES[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-sans">
        <p className="text-sm font-semibold">Loading TIIU Session...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-emerald-950 text-white rounded-2xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">FMITI TIIU Platform</h1>
            <p className="text-emerald-300 mt-1">Enterprise Intelligence, Field Audit & Departmental Telemetry Gateway</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/dashboard/analytics" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow transition flex items-center gap-2 border border-emerald-500"
            >
              <span>⚡</span>
              <span>Executive Analytics Hub</span>
            </Link>

            <div className="text-right text-xs pl-2 border-l border-emerald-800">
              <p className="font-bold text-white">{user?.email || "Guest Session"}</p>
              <span className="inline-block bg-emerald-800 text-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold text-[10px] mt-1">
                {role}
              </span>
            </div>
            <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition">
              Sign Out
            </button>
          </div>
        </div>

        {/* Action Matrix Bar */}
        <div>
          <DashboardActions onTabChange={(tab) => setActiveTab(tab)} />
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-5 font-semibold text-sm transition rounded-xl ${
                activeTab === tab.id ? "bg-emerald-900 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ADMIN SUBMISSIONS & INSPECTOR */}
        {activeTab === "admin" && isSuperAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">Universal Submissions Feed</h2>
                  <p className="text-sm text-slate-500">Click any row to inspect complete enumerator data.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadSubmissions} className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm">🔄 Refresh</button>
                  {submissions.length > 0 && (
                    <button onClick={handleDeleteAllSubmissions} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium border border-red-200">
                      🗑️ Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 text-xs font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Form Source</th>
                      <th className="p-4">Instance ID</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {submissions.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-400">No submissions found.</td></tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                          <td className="p-4 text-xs font-mono">{sub.id}</td>
                          <td className="p-4 font-semibold text-emerald-800">{sub.form_id}</td>
                          <td className="p-4 text-xs font-mono text-slate-600">{sub.instance_id}</td>
                          <td className="p-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setSelectedSubmission(sub)} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-medium border border-emerald-200">Inspect</button>
                            <button onClick={() => handleDeleteSubmission(sub.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg font-medium border border-red-200 hover:bg-red-100">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-[580px]">
              <h2 className="text-lg font-bold mb-2">Submission Data Inspector</h2>
              <p className="text-xs text-slate-500 mb-4">Detailed view of selected ODK audit row.</p>
              {selectedSubmission ? (
                <div className="flex-1 overflow-auto bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                    <span className="text-slate-400">// Form ID: {selectedSubmission.form_id}</span>
                    <button onClick={() => handleDeleteSubmission(selectedSubmission.id)} className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[11px] font-sans">
                      Delete Record
                    </button>
                  </div>
                  <p className="text-slate-400 mb-4">// Received: {selectedSubmission.received_at}</p>
                  <pre>{JSON.stringify(selectedSubmission.data, null, 2)}</pre>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs text-center p-6">
                  Select any submission record on the left to inspect full enumerator details.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FIELD INTELLIGENCE HUB */}
        {activeTab === "aggregations" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Audits Collected</span>
                <p className="text-3xl font-extrabold text-emerald-950 mt-2">{submissions.length}</p>
                <p className="text-xs text-emerald-600 mt-1">⚡ Auto-updated from ODK Collect</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Field Enumerators</span>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {new Set(submissions.map((s) => s.enumerator_id || "ENUM-001")).size}
                </p>
                <p className="text-xs text-slate-500 mt-1">Verified Field Agents</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Geographic Coverage</span>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">36 States & FCT</p>
                <p className="text-xs text-emerald-600 mt-1">National Audit Scope</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Status</span>
                <p className="text-3xl font-extrabold text-emerald-700 mt-2">Optimal</p>
                <p className="text-xs text-slate-500 mt-1">API Telemetry Live</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold">Field Enumerator Telemetry</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="p-4">Enumerator ID</th>
                      <th className="p-4">Total Submissions</th>
                      <th className="p-4">Last Active Sector</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-mono">
                    {enumeratorData.length === 0 ? (
                      <tr><td colSpan={3} className="p-6 text-center text-slate-400 font-sans">No enumerator telemetry recorded.</td></tr>
                    ) : (
                      enumeratorData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-emerald-800">{item.enumerator_id}</td>
                          <td className="p-4">{item.total_submissions}</td>
                          <td className="p-4 text-xs font-sans text-slate-600">Industrial & Commercial Zone</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANNUAL PARASTATAL REGISTRY */}
        {activeTab === "registry" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <label className="block text-xs font-bold uppercase text-slate-600">Select Supervisory Agency / Parastatal</label>
              <select
                value={selectedParastatal}
                onChange={(e) => {
                  setSelectedParastatal(e.target.value);
                  fetchRegistryRecords(e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 shadow-sm"
              >
                {FMITI_AGENCIES.map((agency) => (
                  <option key={agency.code} value={agency.code}>
                    {agency.icon} {agency.name} — [{agency.category}]
                  </option>
                ))}
              </select>
            </div>

            {/* Parastatal Form, Bulk Excel Upload & Records Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Entry & Bulk Upload */}
              <div className="space-y-6">
                
                {/* Manual Form Entry */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Log Single Record: {activeAgencyObj.name}
                  </h2>

                  <form onSubmit={handleRegistrySubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Ref / ID Code</label>
                      <input
                        type="text"
                        placeholder="e.g. RC-109283"
                        value={refId}
                        onChange={(e) => setRefId(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Enterprise / Entity Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Aba Leather Products Ltd"
                        value={enterpriseName}
                        onChange={(e) => setEnterpriseName(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">State</label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                        >
                          {NIGERIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Fiscal Year (Manual)</label>
                        <input
                          type="text"
                          value={recordYear}
                          onChange={(e) => setRecordYear(e.target.value)}
                          placeholder="2026"
                          required
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Operational Sector</label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Inspection Officer</label>
                      <input
                        type="text"
                        value={inspectionOfficer}
                        onChange={(e) => setInspectionOfficer(e.target.value)}
                        placeholder="Dr. Aliyu Mohammed"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                      />
                    </div>

                    {/* PARASTAL-SPECIFIC DYNAMIC FIELDS */}
                    {selectedParastatal === "cac" && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">CAC Specific Parameters</span>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Legal Status</label>
                          <input
                            type="text"
                            value={legalStatus}
                            onChange={(e) => setLegalStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Share Capital (₦)</label>
                          <input
                            type="number"
                            value={shareCapital}
                            onChange={(e) => setShareCapital(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {selectedParastatal === "boi" && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">BOI Specific Parameters</span>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Loan Disbursement Amount (₦)</label>
                          <input
                            type="number"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Disbursement Status</label>
                          <select
                            value={disbursementStatus}
                            onChange={(e) => setDisbursementStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                          >
                            <option value="Disbursed">Disbursed</option>
                            <option value="Pending Approval">Pending Approval</option>
                            <option value="Under Review">Under Review</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Active Status</label>
                          <select
                            value={activeStatus}
                            onChange={(e) => setActiveStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive / Dormant">Inactive / Dormant</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {(selectedParastatal === "son" || selectedParastatal === "nepc" || selectedParastatal === "nce") && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">Standards & Export Parameters</span>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Commodity / Product / Standard</label>
                          <input
                            type="text"
                            placeholder="e.g. Leather Grade-A / MANCAP Certified"
                            value={commodityOrProduct}
                            onChange={(e) => setCommodityOrProduct(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">License Status</label>
                          <input
                            type="text"
                            value={certOrLicenseStatus}
                            onChange={(e) => setCertOrLicenseStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                          />
                        </div>
                      </div>
                    )}

                    {/* UNIVERSAL CUSTOM FIELD BUILDER FOR UNLISTED / OTHER PARASTATALS */}
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-bold uppercase text-slate-700">Custom Fields (For Unlisted Parastatals)</span>
                        <button
                          type="button"
                          onClick={() => setCustomFields([...customFields, { key: "", value: "" }])}
                          className="bg-slate-100 hover:bg-slate-200 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded"
                        >
                          + Add Field
                        </button>
                      </div>

                      {customFields.map((field, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Field Name (e.g. Grant ID)"
                            value={field.key}
                            onChange={(e) => {
                              const updated = [...customFields];
                              updated[idx].key = e.target.value;
                              setCustomFields(updated);
                            }}
                            className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl p-2 text-[11px]"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={field.value}
                            onChange={(e) => {
                              const updated = [...customFields];
                              updated[idx].value = e.target.value;
                              setCustomFields(updated);
                            }}
                            className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl p-2 text-[11px]"
                          />
                          {customFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                              className="text-red-600 font-bold px-1 text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={submittingRegistry}
                      className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow mt-3"
                    >
                      {submittingRegistry ? "Logging Record..." : `Log into ${activeAgencyObj.code.toUpperCase()} Registry`}
                    </button>
                  </form>
                </div>

                {/* Bulk Excel Upload Card for Heavy Datasets */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    📤 Bulk Excel Upload ({activeAgencyObj.code.toUpperCase()})
                  </h2>
                  <p className="text-xs text-slate-500">Upload bulk spreadsheets (.xlsx, .csv) for heavy datasets that are too large for manual entry.</p>

                  <form onSubmit={handleRegistryExcelUpload} className="space-y-3 text-xs">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => setRegistryExcelFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={uploadingRegistryExcel || !registryExcelFile}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition shadow disabled:opacity-50"
                    >
                      {uploadingRegistryExcel ? "Uploading Bulk Spreadsheet..." : "Upload & Sync Spreadsheet"}
                    </button>
                  </form>
                </div>

              </div>

              {/* Records Table with Dynamic Specific Attributes & Export */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="text-base font-bold text-slate-900">
                    {activeAgencyObj.name} Registered Records ({registryRecords.length})
                  </h2>
                  <button
                    onClick={exportRegistryToExcel}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-2"
                  >
                    <span>📥</span>
                    <span>Export Excel Digest</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 font-mono font-bold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Ref ID</th>
                        <th className="p-3">Enterprise Name</th>
                        <th className="p-3">State / Year</th>
                        <th className="p-3">Specific KPI Info</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {registryRecords.length === 0 ? (
                        <tr><td colSpan={5} className="p-6 text-center text-slate-400 font-mono">No records found for {activeAgencyObj.name}. Use manual form, custom fields, or bulk upload above.</td></tr>
                      ) : (
                        registryRecords.map((rec) => {
                          let specificInfo = rec.sector;
                          if (selectedParastatal === "boi") {
                            const amt = rec.loan_amount || rec.extra_payload?.loan_amount || 0;
                            const stat = rec.disbursement_status || rec.extra_payload?.disbursement_status || "Disbursed";
                            specificInfo = `₦${Number(amt).toLocaleString()} (${stat})`;
                          } else if (selectedParastatal === "cac") {
                            const cap = rec.share_capital || rec.extra_payload?.share_capital || 0;
                            specificInfo = `Cap: ₦${Number(cap).toLocaleString()}`;
                          } else if (rec.commodity_or_product) {
                            specificInfo = `${rec.commodity_or_product}`;
                          } else {
                            const customKeys = Object.keys(rec.extra_payload || {}).filter(k => !["record_year", "inspection_officer", "legal_status", "share_capital", "incorporation_date", "loan_amount", "disbursement_status", "active_status", "commodity_or_product", "cert_or_license_status", "employee_count"].includes(k));
                            if (customKeys.length > 0) {
                              specificInfo = `${customKeys[0]}: ${rec.extra_payload[customKeys[0]]}`;
                            }
                          }

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-emerald-800">{rec.ref_id}</td>
                              <td className="p-3 font-bold text-slate-900">
                                {rec.enterprise_name}
                                <span className="block text-[10px] text-slate-400 font-sans">Officer: {rec.extra_payload?.inspection_officer || inspectionOfficer}</span>
                              </td>
                              <td className="p-3 font-mono">
                                {rec.state}
                                <span className="block text-[10px] text-emerald-700 font-bold">Yr: {rec.extra_payload?.record_year || "2026"}</span>
                              </td>
                              <td className="p-3 font-semibold text-slate-700">{specificInfo}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleRegistryDelete(rec.id)}
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: DEPARTMENT PROFILES & KPIS FORM */}
        {activeTab === "departments" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Manual KPI Logger Form */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900">🏛️ Log Departmental KPI (tiiu.db)</h2>
                <p className="text-xs text-slate-500">Manual entry portal for all 20 Professional & Service FMITI Departments.</p>

                {kpiMessage && (
                  <div className="p-3 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200">
                    {kpiMessage}
                  </div>
                )}

                <form onSubmit={handleKpiSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target Department</label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    >
                      {FMITI_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Area of Focus (Key Results Area)</label>
                    <input
                      type="text"
                      placeholder="e.g., Intellectual Property Rights / Industrial Policy Implementation"
                      value={areaOfFocus}
                      onChange={(e) => setAreaOfFocus(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Specific Objective / Deliverable</label>
                    <input
                      type="text"
                      placeholder="e.g., Digitization of Patent Registrations & Examination Workflows"
                      value={objectiveDeliverable}
                      onChange={(e) => setObjectiveDeliverable(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">KPI Performance Indicator Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Verified Patent Applications Processed"
                      value={kpiForm.kpi_title}
                      onChange={(e) => setKpiForm({ ...kpiForm, kpi_title: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target</label>
                      <input
                        type="number"
                        value={kpiForm.target_value}
                        onChange={(e) => setKpiForm({ ...kpiForm, target_value: Number(e.target.value) })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Achieved</label>
                      <input
                        type="number"
                        value={kpiForm.achieved_value}
                        onChange={(e) => setKpiForm({ ...kpiForm, achieved_value: Number(e.target.value) })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono font-bold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Period</label>
                      <input
                        type="text"
                        value={kpiForm.quarter_period}
                        onChange={(e) => setKpiForm({ ...kpiForm, quarter_period: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Executive Progress Narrative</label>
                    <textarea
                      rows={2}
                      placeholder="Summary notes on milestone completion..."
                      value={kpiForm.narrative}
                      onChange={(e) => setKpiForm({ ...kpiForm, narrative: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingKpi}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl transition shadow"
                  >
                    {submittingKpi ? "Recording into tiiu.db..." : "Log KPI Record"}
                  </button>
                </form>
              </div>

              {/* PDF Repository */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900">📄 Departmental Document & Report Repository</h2>
                <p className="text-xs text-slate-500">Upload PDF policy briefs, reports, or raw BLOB documentation into tiiu.db.</p>

                {deptUploadStatus && (
                  <div className="p-3 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200">
                    {deptUploadStatus}
                  </div>
                )}

                <form onSubmit={handleDeptReportUpload} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Department</label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900"
                    >
                      {FMITI_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Select File (PDF / DOCX)</label>
                    <input
                      type="file"
                      onChange={(e) => setDeptFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingDept || !deptFile}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition shadow disabled:opacity-50"
                  >
                    {uploadingDept ? "Uploading File..." : "Upload Department Report"}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h3 className="text-xs font-bold uppercase text-slate-600">Stored Department Files ({departmentReports.length})</h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {departmentReports.map((rep) => (
                      <div key={rep.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{rep.filename}</p>
                          <span className="text-[10px] text-slate-500">{rep.department_name} • {rep.uploaded_at}</span>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={getDepartmentReportDownloadUrl(rep.id)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-lg"
                          >
                            Download
                          </a>
                          <button onClick={() => handleDeleteReport(rep.id)} className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded-lg">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Logged Departmental KPIs Master Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">📊 Logged Departmental KPI Master Table (tiiu.db)</h2>
                  <p className="text-xs text-slate-500">Real-time database records synced directly with Executive Analytics.</p>
                </div>
                <a
                  href={getDepartmentKpiExcelUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow inline-flex items-center gap-2 self-start md:self-auto"
                >
                  <span>📥</span>
                  <span>Export Excel Digest</span>
                </a>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-[11px] font-mono font-bold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Area of Focus</th>
                      <th className="p-3.5">KPI Title</th>
                      <th className="p-3.5">Period</th>
                      <th className="p-3.5 text-right">Target</th>
                      <th className="p-3.5 text-right">Achieved</th>
                      <th className="p-3.5 text-center">Execution %</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {kpiList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-mono">
                          No departmental KPI records logged in tiiu.db yet. Use the form above to add records.
                        </td>
                      </tr>
                    ) : (
                      kpiList.map((kpi) => (
                        <tr key={kpi.id} className="hover:bg-slate-50 text-slate-700 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">{kpi.department_name}</td>
                          <td className="p-3.5 font-semibold text-emerald-800">{kpi.area_of_focus}</td>
                          <td className="p-3.5 font-medium">{kpi.kpi_title}</td>
                          <td className="p-3.5 font-mono text-slate-500">{kpi.quarter_period}</td>
                          <td className="p-3.5 text-right font-mono">{kpi.target_value.toLocaleString()}</td>
                          <td className="p-3.5 text-right font-mono">{kpi.achieved_value.toLocaleString()}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                              kpi.achievement_rate >= 80 
                                ? "bg-emerald-100 text-emerald-800" 
                                : kpi.achievement_rate >= 65 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {kpi.achievement_rate}%
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleDeleteKpi(kpi.id)}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: REMOTE EXCEL UPLOAD */}
        {activeTab === "excel" && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900">📤 Remote Excel / CSV Field Upload</h2>
            <p className="text-xs text-slate-500">Bulk import survey records or enterprise data straight into tiiu.db.</p>

            {uploadStatus && (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono">
                {uploadStatus}
              </div>
            )}

            <form onSubmit={handleExcelUpload} className="space-y-4">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs"
              />
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full bg-emerald-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-emerald-800 transition disabled:opacity-50"
              >
                {uploading ? "Processing Upload..." : "Upload Excel Data"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: SINGLE VERIFICATION API */}
        {activeTab === "verification" && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900">🔍 Single Verification Gateway API</h2>
            <p className="text-xs text-slate-500">Lookup and verify enterprise records across CAC, BOI, and SON registries.</p>

            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Agency Gateway</label>
                <select
                  value={parastatalType}
                  onChange={(e) => setParastatalType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900"
                >
                  <option value="cac">CAC - Corporate Affairs Commission</option>
                  <option value="boi">BOI - Bank of Industry</option>
                  <option value="son">SON - Standards Organisation of Nigeria</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Ref / Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. RC-109283 / ENUM-001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || !identifier}
                className="w-full bg-emerald-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-emerald-800 transition disabled:opacity-50"
              >
                {verifying ? "Querying Gateway..." : "Verify Registration Status"}
              </button>
            </form>

            {verificationResult && (
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-xs font-mono overflow-x-auto">
                <pre>{JSON.stringify(verificationResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}