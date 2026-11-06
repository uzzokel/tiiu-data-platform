export interface StreamlitAppConfig {
  title: string;
  url: string;
}

export const STREAMLIT_APPS: Record<string, StreamlitAppConfig> = {
  odk: {
    title: "Boston House Price Prediction ML Model",
    url: "https://boston-house-price-prediction-6n58.onrender.com",
  },
  son: {
    title: "SON Product Quality Analytics Model",
    url: "https://son-quality-ml.onrender.com", // Replace with your Render/Streamlit URL
  },
  boi: {
    title: "BOI Credit Risk & Loan Scoring Engine",
    url: "https://boi-credit-scoring.onrender.com", // Replace with your Render/Streamlit URL
  },
  departments: {
    title: "Departmental Performance Forecast Model",
    url: "https://departmental-forecast.onrender.com",
  },
};

export function getStreamlitApp(key: string): StreamlitAppConfig | null {
  return STREAMLIT_APPS[key] || null;
}