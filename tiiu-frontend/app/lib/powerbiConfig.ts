// tiiu-frontend/app/lib/powerbiConfig.ts

export interface PowerBIReportConfig {
  reportId: string;
  groupId?: string;
  pageName?: string;
  sectionId?: string;      // Specific report section/tab identifier
  isDashboard?: boolean;
}

export const POWERBI_REPORTS: Record<string, PowerBIReportConfig> = {
  odk: {
    reportId: "32ab744b-dec3-4598-8eba-1fc26f298fb6",
    sectionId: "8aff4dc4bee36e9c7e6b", // Maps the exact report section from your URL
    isDashboard: false,                // It's an interactive Report, not a Dashboard
  },
};

export function getPowerBIEmbedUrl(key: string): string {
  const config = POWERBI_REPORTS[key];
  if (!config) return "";

  // Dynamic route selection: dashboardEmbed vs reportEmbed
  const embedType = config.isDashboard ? "dashboardEmbed" : "reportEmbed";
  const idParam = config.isDashboard ? "dashboardId" : "reportId";

  let url = `https://app.powerbi.com/${embedType}?${idParam}=${config.reportId}&autoAuth=true`;

  if (config.groupId) {
    url += `&groupId=${config.groupId}`;
  }

  if (config.sectionId) {
    url += `&sectionId=${config.sectionId}`;
  }

  if (config.pageName && !config.isDashboard) {
    url += `&pageName=${config.pageName}`;
  }

  return url;
}