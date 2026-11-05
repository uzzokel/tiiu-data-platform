"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

interface SupersetEmbedProps {
  dashboardId: string;
  height?: string;
}

export default function SupersetEmbed({ dashboardId, height = "650px" }: SupersetEmbedProps) {
  const searchParams = useSearchParams();
  const department = searchParams.get("department") || "industrial-development";

  // Superset public or guest-token embedded URL with native filter pre-selection
  // Superset supports native filter parameters via JSON query encoding or URL params
  const supersetBaseUrl = process.env.NEXT_PUBLIC_SUPERSET_URL || "http://localhost:8088";
  const embedUrl = `${supersetBaseUrl}/superset/dashboard/${dashboardId}/?standalone=1&native_filters_key=department_filter&native_filters=(id:('${department}'))`;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
        <span>Apache Superset Executive Analytics View</span>
        <span className="bg-indigo-100 text-indigo-800 font-mono px-2.5 py-0.5 rounded-md font-bold">
          Active Department Scope: {department.toUpperCase()}
        </span>
      </div>

      <div className="w-full bg-slate-950 rounded-2xl border border-slate-200 overflow-hidden shadow-sm" style={{ height }}>
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          title="FMITI Superset Dashboard"
          allowFullScreen={true}
        ></iframe>
      </div>
    </div>
  );
}