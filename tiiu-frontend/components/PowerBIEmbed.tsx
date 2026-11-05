"use client";

import React, { useState } from "react";
import { getPowerBIEmbedUrl } from "@/app/lib/powerbiConfig";

interface PowerBIEmbedProps {
  title?: string;
  reportKey?: string; // Dynamic key from powerbiConfig.ts
  reportUrl?: string; // Direct URL override
  height?: string;
}

export default function PowerBIEmbed({
  title = "FMITI Executive Analytics Dashboard",
  reportKey,
  reportUrl,
  height = "650px",
}: PowerBIEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Resolve URL: direct reportUrl > reportKey lookup > fallback env var
  const url = reportUrl || (reportKey ? getPowerBIEmbedUrl(reportKey) : process.env.NEXT_PUBLIC_POWERBI_EMBED_URL);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-lg">📊</span>
          <h3 className="text-sm font-bold tracking-wide">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md transition font-mono"
            >
              Open in Power BI ↗
            </a>
          )}
          <span className="text-[11px] bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded-full uppercase font-semibold">
            Power BI Live
          </span>
        </div>
      </div>

      {/* Frame Container */}
      <div className="w-full relative bg-slate-50" style={{ height }}>
        {url ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-sm z-10">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs font-bold text-slate-700">Connecting to Power BI Gateway...</p>
              </div>
            )}
            <iframe
              title={title}
              src={url}
              className="w-full h-full border-0"
              allowFullScreen={true}
              onLoad={() => setIsLoading(false)}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
            <span className="text-4xl mb-3">📈</span>
            <p className="text-sm font-semibold text-slate-600">Power BI Dashboard Gateway</p>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Provide a valid <code className="text-emerald-700 bg-emerald-50 px-1 rounded">reportUrl</code> or <code className="text-emerald-700 bg-emerald-50 px-1 rounded">reportKey</code> to display live data visualizations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}