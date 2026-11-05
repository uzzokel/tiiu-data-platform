"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", 
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const FMITI_AGENCIES = [
  { code: "cac", name: "Corporate Affairs Commission (CAC)", category: "Business Regulation, Standards & Compliance", icon: "🏢" },
  { code: "boi", name: "Bank of Industry (BOI)", category: "Investment & Enterprise Promotion", icon: "💳" },
  { code: "smedan", name: "Small & Medium Enterprises Development Agency (SMEDAN)", category: "Investment & Enterprise Promotion", icon: "🌱" },
  { code: "nepc", name: "Nigerian Export Promotion Council (NEPC)", category: "Trade, Export & Free Zone Regulations", icon: "🌐" },
  { code: "son", name: "Standards Organisation of Nigeria (SON)", category: "Business Regulation, Standards & Compliance", icon: "📜" },
  { code: "nipc", name: "Nigerian Investment Promotion Commission (NIPC)", category: "Investment & Enterprise Promotion", icon: "📈" },
  { code: "nepza", name: "Nigeria Export Processing Zones Authority (NEPZA)", category: "Trade, Export & Free Zone Regulations", icon: "⚡" },
  { code: "ogfza", name: "Oil and Gas Free Zones Authority (OGFZA)", category: "Trade, Export & Free Zone Regulations", icon: "🛢️" },
  { code: "nce", name: "Nigeria Commodities Exchange (NCE)", category: "Trade, Export & Free Zone Regulations", icon: "🌾" },
  { code: "frcn", name: "Financial Reporting Council of Nigeria (FRCN)", category: "Business Regulation, Standards & Compliance", icon: "📑" },
  { code: "cld", name: "Commercial Law Department (IP Registry)", category: "Business Regulation, Standards & Compliance", icon: "💡" },
  { code: "itf", name: "Industrial Training Fund (ITF)", category: "Industrial Training & Capacity Building", icon: "🎓" },
  { code: "nsdc", name: "National Sugar Development Council (NSDC)", category: "Industrial Training & Capacity Building", icon: "🧪" },
  { code: "naddc", name: "National Automotive Design and Development Council (NADDC)", category: "Industrial Training & Capacity Building", icon: "🚗" },
  { code: "litfcmb", name: "Lagos International Trade Fair Complex Board (LITFCMB)", category: "Infrastructure Management", icon: "🏛️" },
  { code: "tbsmb", name: "Tafawa Balewa Square Management Board (TBSMB)", category: "Infrastructure Management", icon: "🏟️" }
];

export default function ParastatalRegistryPage() {
  const [selectedParastatal, setSelectedParastatal] = useState<string>("cac");
  const [registryRecords, setRegistryRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("ALL");
  const [filterSector, setFilterSector] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");

  // Common Enterprise Form State
  const [refId, setRefId] = useState("");
  const [enterpriseName, setEnterpriseName] = useState("");
  const [state, setState] = useState("Lagos");
  const [sector, setSector] = useState("Manufacturing & Agro-Processing");
  const [address, setAddress] = useState("");
  const [recordYear, setRecordYear] = useState("2026");

  // CAC Specific Fields
  const [legalStatus, setLegalStatus] = useState("Private Limited (LTD)");
  const [shareCapital, setShareCapital] = useState<number>(1000000);
  const [incorporationDate, setIncorporationDate] = useState("2026-01-15");

  // BOI Specific Fields
  const [loanAmount, setLoanAmount] = useState<number>(50000000);
  const [disbursementStatus, setDisbursementStatus] = useState("Disbursed");
  const [activeStatus, setActiveStatus] = useState("Active");

  // General Specific Fields
  const [commodityOrProduct, setCommodityOrProduct] = useState("");
  const [certOrLicenseStatus, setCertOrLicenseStatus] = useState("Active License");
  const [employeeCount, setEmployeeCount] = useState<number>(25);

  // Dynamic Manual Extra Attributes ("Not Rigid")
  const [extraFields, setExtraFields] = useState<{ key: string; value: string }[]>([
    { key: "Inspection Officer", value: "Dr. Aliyu Mohammed" }
  ]);

  useEffect(() => {
    fetchRegistryRecords(selectedParastatal);
  }, [selectedParastatal, filterState, filterSector, filterStatus, filterYear]);

  const fetchRegistryRecords = async (agencyCode: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        parastatal: agencyCode,
        ...(filterState !== "ALL" && { state: filterState }),
        ...(filterSector !== "ALL" && { sector: filterSector }),
        ...(filterStatus !== "ALL" && { status: filterStatus }),
        ...(filterYear !== "ALL" && { year: filterYear }),
        ...(searchQuery.trim() && { search: searchQuery.trim() })
      });

      const res = await fetch(`${BACKEND_BASE}/api/v1/parastatals/registry?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRegistryRecords(data.records || []);
      }
    } catch (err) {
      console.error("Error fetching registry:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegistryRecords(selectedParastatal);
  };

  const handleAddExtraField = () => {
    setExtraFields([...extraFields, { key: "", value: "" }]);
  };

  const handleExtraFieldChange = (index: number, field: "key" | "value", val: string) => {
    const updated = [...extraFields];
    updated[index][field] = val;
    setExtraFields(updated);
  };

  const handleRemoveExtraField = (index: number) => {
    setExtraFields(extraFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const extraPayloadObj: Record<string, any> = {
      record_year: recordYear
    };
    extraFields.forEach((item) => {
      if (item.key.trim()) {
        extraPayloadObj[item.key.trim()] = item.value;
      }
    });

    const payload = {
      parastatal_code: selectedParastatal,
      ref_id: refId,
      enterprise_name: enterpriseName,
      state,
      sector,
      address,
      legal_status: legalStatus,
      share_capital: Number(shareCapital),
      incorporation_date: incorporationDate,
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
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`Successfully logged record into ${selectedParastatal.toUpperCase()} Registry!`);
        setRefId("");
        setEnterpriseName("");
        setAddress("");
        fetchRegistryRecords(selectedParastatal);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/v1/parastatals/enterprise-record/${recordId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchRegistryRecords(selectedParastatal);
      }
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  const activeAgencyObj = FMITI_AGENCIES.find(a => a.code === selectedParastatal) || FMITI_AGENCIES[0];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-emerald-950 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/analytics" className="text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-200 px-3 py-1.5 rounded-xl font-medium transition">
                ← Back to Executive Command Center
              </Link>
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                All 16 Parastatals Registry
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">FMITI Parastatals Enterprise Registry</h1>
            <p className="text-emerald-300 mt-1">Supervising all 16 parastatals with flexible manual attribute capture, inputted year, and complete 36 states & FCT coverage.</p>
          </div>

          <a
            href={`${BACKEND_BASE}/api/v1/parastatals/export-registry-excel?parastatal=${selectedParastatal}`}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl transition shadow-md flex items-center gap-2 shrink-0"
          >
            <span>📊</span>
            <span>Export {selectedParastatal.toUpperCase()} Excel Sheet</span>
          </a>
        </div>

        {/* Agency Selector Dropdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <label className="block text-xs font-bold uppercase text-slate-600">Select Supervisory Agency / Parastatal</label>
          <select
            value={selectedParastatal}
            onChange={(e) => {
              setSelectedParastatal(e.target.value);
              setSearchQuery("");
              setFilterState("ALL");
              setFilterSector("ALL");
              setFilterStatus("ALL");
              setFilterYear("ALL");
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

        {/* Dynamic Form and Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Dynamic Input Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-1">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 uppercase">
              Capture: {activeAgencyObj.name}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">ID / Reference Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RC-987654"
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                    className="w-full border rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">Fiscal / Record Year</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026"
                    value={recordYear}
                    onChange={(e) => setRecordYear(e.target.value)}
                    className="w-full border rounded-xl p-2.5 font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Enterprise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nigerian Agro Allied Ventures Ltd"
                  value={enterpriseName}
                  onChange={(e) => setEnterpriseName(e.target.value)}
                  className="w-full border rounded-xl p-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-slate-50 font-bold"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">Sector</label>
                  <input
                    type="text"
                    required
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* CAC SPECIFIC FIELDS */}
              {selectedParastatal === "cac" && (
                <>
                  <div>
                    <label className="block font-bold uppercase text-slate-600 mb-1">Legal Status</label>
                    <select
                      value={legalStatus}
                      onChange={(e) => setLegalStatus(e.target.value)}
                      className="w-full border rounded-xl p-2.5 bg-slate-50"
                    >
                      <option value="Private Limited (LTD)">Private Limited (LTD)</option>
                      <option value="Public Limited (PLC)">Public Limited (PLC)</option>
                      <option value="Business Name">Business Name</option>
                      <option value="Incorporated Trustee">Incorporated Trustee</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-slate-600 mb-1">Share Capital (₦)</label>
                      <input
                        type="number"
                        value={shareCapital}
                        onChange={(e) => setShareCapital(Number(e.target.value))}
                        className="w-full border rounded-xl p-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase text-slate-600 mb-1">Incorporation Date</label>
                      <input
                        type="date"
                        value={incorporationDate}
                        onChange={(e) => setIncorporationDate(e.target.value)}
                        className="w-full border rounded-xl p-2.5"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* BOI SPECIFIC FIELDS */}
              {selectedParastatal === "boi" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-slate-600 mb-1">Loan Approved (₦)</label>
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-full border rounded-xl p-2.5 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase text-slate-600 mb-1">Disbursement Status</label>
                      <select
                        value={disbursementStatus}
                        onChange={(e) => setDisbursementStatus(e.target.value)}
                        className="w-full border rounded-xl p-2.5 bg-slate-50"
                      >
                        <option value="Disbursed">Disbursed</option>
                        <option value="Approved - Pending Disbursement">Approved - Pending</option>
                        <option value="Under Review">Under Review</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-600 mb-1">Active Status</label>
                    <select
                      value={activeStatus}
                      onChange={(e) => setActiveStatus(e.target.value)}
                      className="w-full border rounded-xl p-2.5 bg-slate-50"
                    >
                      <option value="Active">Active (Performing)</option>
                      <option value="Non-Active">Non-Active (Default/Restructured)</option>
                    </select>
                  </div>
                </>
              )}

              {/* GENERAL MANDATE FIELDS FOR OTHER AGENCIES */}
              {selectedParastatal !== "cac" && selectedParastatal !== "boi" && (
                <>
                  <div>
                    <label className="block font-bold uppercase text-slate-600 mb-1">Commodity / Certified Product</label>
                    <input
                      type="text"
                      placeholder="e.g. Processed Sesame Seeds / MANCAP Certified"
                      value={commodityOrProduct}
                      onChange={(e) => setCommodityOrProduct(e.target.value)}
                      className="w-full border rounded-xl p-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-slate-600 mb-1">License / Cert Status</label>
                      <input
                        type="text"
                        value={certOrLicenseStatus}
                        onChange={(e) => setCertOrLicenseStatus(e.target.value)}
                        className="w-full border rounded-xl p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase text-slate-600 mb-1">Employee Count</label>
                      <input
                        type="number"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(Number(e.target.value))}
                        className="w-full border rounded-xl p-2.5 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Central Business District, Abuja"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border rounded-xl p-2.5"
                />
              </div>

              {/* FLEXIBLE MANUAL ATTRIBUTES BUILDER */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold uppercase text-emerald-800">Additional Custom Attributes</label>
                  <button
                    type="button"
                    onClick={handleAddExtraField}
                    className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-200 transition"
                  >
                    + Add Field
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Include uncaptured info like inspection officer, batch number, or grant type.</p>
                
                {extraFields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Attribute Name"
                      value={field.key}
                      onChange={(e) => handleExtraFieldChange(index, "key", e.target.value)}
                      className="w-1/2 border rounded-lg p-2 text-[11px]"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => handleExtraFieldChange(index, "value", e.target.value)}
                      className="w-1/2 border rounded-lg p-2 text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraField(index)}
                      className="text-red-500 hover:text-red-700 font-bold px-2 py-1 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow transition mt-2"
              >
                {submitting ? "Saving..." : `Log Record into ${selectedParastatal.toUpperCase()} Registry`}
              </button>
            </form>
          </div>

          {/* Dynamic Table with Complete States Filter */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">
                {activeAgencyObj.name} Enterprise Registry
              </h2>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-mono">
                {registryRecords.length} Records Found
              </span>
            </div>

            {/* Advanced Search & Filter Toolbar with Year and Complete States */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
                
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="🔍 Search Name or Ref ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Year Filter Input */}
                <input
                  type="text"
                  placeholder="Filter Year (e.g. 2026)"
                  value={filterYear === "ALL" ? "" : filterYear}
                  onChange={(e) => setFilterYear(e.target.value.trim() || "ALL")}
                  className="w-36 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 font-mono"
                />

                {/* State Filter with Complete 36 States & FCT */}
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                >
                  <option value="ALL">All 36 States & FCT</option>
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                {/* Sector Filter */}
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                >
                  <option value="ALL">All Sectors</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="ICT">ICT & Tech</option>
                  <option value="Export">Export</option>
                </select>

                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-sm"
                >
                  Filter
                </button>
              </form>
            </div>

            {/* Registry Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="p-3">Ref ID</th>
                    <th className="p-3">Year</th>
                    <th className="p-3">Enterprise Name</th>
                    <th className="p-3">State</th>
                    <th className="p-3">Sector</th>
                    {selectedParastatal === "cac" && <th className="p-3">Legal Status</th>}
                    {selectedParastatal === "cac" && <th className="p-3">Share Capital</th>}
                    {selectedParastatal === "boi" && <th className="p-3">Loan Amount</th>}
                    {selectedParastatal === "boi" && <th className="p-3">Disbursement</th>}
                    {selectedParastatal !== "cac" && selectedParastatal !== "boi" && <th className="p-3">Product / Status</th>}
                    <th className="p-3">Custom / Extra Attributes</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                        Filtering records...
                      </td>
                    </tr>
                  ) : registryRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                        No records match the selected filter criteria for {selectedParastatal.toUpperCase()}.
                      </td>
                    </tr>
                  ) : (
                    registryRecords.map((rec) => {
                      const extraObj = rec.extra_payload || {};
                      const recordYearVal = extraObj.record_year || "2026";
                      const customEntries = Object.entries(extraObj).filter(([k]) => k !== "record_year");

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-emerald-800">{rec.ref_id}</td>
                          <td className="p-3 font-bold">{recordYearVal}</td>
                          <td className="p-3 font-sans font-bold text-slate-900">{rec.enterprise_name}</td>
                          <td className="p-3 font-sans">{rec.state}</td>
                          <td className="p-3 font-sans text-slate-600">{rec.sector}</td>
                          {selectedParastatal === "cac" && <td className="p-3 font-sans">{rec.legal_status}</td>}
                          {selectedParastatal === "cac" && <td className="p-3">₦{rec.share_capital?.toLocaleString()}</td>}
                          {selectedParastatal === "boi" && <td className="p-3 font-bold text-emerald-700">₦{rec.loan_amount?.toLocaleString()}</td>}
                          {selectedParastatal === "boi" && <td className="p-3 font-sans">{rec.disbursement_status}</td>}
                          {selectedParastatal !== "cac" && selectedParastatal !== "boi" && (
                            <td className="p-3 font-sans">
                              <span className="font-bold text-slate-700">{rec.commodity_or_product || "N/A"}</span>
                              <span className="block text-[10px] text-emerald-700 font-semibold">{rec.cert_or_license_status}</span>
                            </td>
                          )}
                          <td className="p-3 font-sans text-[11px] text-slate-600">
                            {customEntries.length > 0 ? (
                              customEntries.map(([k, v], i) => (
                                <span key={i} className="block">
                                  <strong>{k}:</strong> {String(v)}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-sans">
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-[10px]"
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
    </main>
  );
}