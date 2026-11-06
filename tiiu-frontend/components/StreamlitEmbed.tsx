"use client";

import React, { useState } from "react";
import { getStreamlitApp } from "@/app/lib/streamlitConfig";

interface StreamlitEmbedProps {
  appKey: string;
  height?: string;
}

export default function StreamlitEmbed({ appKey, height = "650px" }: StreamlitEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const appConfig = getStreamlitApp(appKey);

  if (!appConfig) {
    return (
      <div className="w-full p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500">
        Streamlit application configuration for key "<code className="text-emerald-600 font-bold">{appKey}</code>" was not found.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-emerald-900 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-lg">🤖</span>
          <h3 className="text-sm font-bold tracking-wide">{appConfig.title}</h3>
        </div>
        <a
          href={appConfig.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-2.5 py-1 rounded-md transition font-mono"
        >
          Open App ↗
        </a>
      </div>

      {/* Frame Container */}
      <div className="w-full relative bg-slate-50" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-sm z-10">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-bold text-slate-700">Connecting to Streamlit Engine on Cloud...</p>
          </div>
        )}
        <iframe
          title={appConfig.title}
          src={appConfig.url}
          className="w-full h-full border-0"
          allowFullScreen={true}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}