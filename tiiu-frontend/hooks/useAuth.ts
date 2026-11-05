"use client";
import { useState, useEffect } from 'react';

const TIER_1_ADMINS = [
  "admin@fmiti.gov.ng",
  "tiiu.admin@fmiti.gov.ng",
  "uzzokel@gmail.com"
];

export function useAuthUser() {
  const [user, setUser] = useState<{ email: string; role: string; token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("tiiu_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("tiiu_user");
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("tiiu_token");
    localStorage.removeItem("tiiu_user");
    setUser(null);
    window.location.href = "/login";
  };

  const userEmail = user?.email || "";
  const baseRole = user?.role || "guest";

  const isTier1Admin = TIER_1_ADMINS.map(e => e.toLowerCase()).includes(userEmail.toLowerCase());
  const effectiveRole = isTier1Admin ? "super_admin" : baseRole;

  return {
    user,
    role: effectiveRole,
    isAuthenticated: !!user,
    isLoading: loading,
    isSuperAdmin: effectiveRole === "super_admin",
    isDepartmentOfficer: effectiveRole === "department_officer",
    isParastatalOfficer: effectiveRole === "parastatal_officer",
    isFieldAuditor: effectiveRole === "field_auditor",
    logout
  };
}