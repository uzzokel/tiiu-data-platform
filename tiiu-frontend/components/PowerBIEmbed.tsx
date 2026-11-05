"use client";

interface PowerBIEmbedProps {
  title?: string;
  reportUrl?: string; // Standard Power BI Publish to Web or Shared Report URL
  height?: string;
}

export default function PowerBIEmbed({
  title = "FMITI Executive Analytics Dashboard",
  reportUrl,
  height = "650px",
}: PowerBIEmbedProps) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-lg">📊</span>
          <h3 className="text-sm font-bold tracking-wide">{title}</h3>
        </div>
        <span className="text-[11px] bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded-full uppercase font-semibold">
          Power BI Live
        </span>
      </div>

      {/* Frame Container */}
      <div className="w-full relative" style={{ height }}>
        {reportUrl ? (
          <iframe
            title={title}
            src={reportUrl}
            className="w-full h-full border-0"
            allowFullScreen={true}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
            <span className="text-4xl mb-3">📈</span>
            <p className="text-sm font-semibold text-slate-600">Power BI Dashboard Gateway</p>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Provide a valid Power BI report embed URL in <code className="text-emerald-700 bg-emerald-50 px-1 rounded">reportUrl</code> to display live data visualizations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}