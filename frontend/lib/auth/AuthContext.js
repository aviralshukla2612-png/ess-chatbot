"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeOrganizationId, setActiveOrganizationId] = useState(null);
  const [activeOrgRole, setActiveOrgRole] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setActiveOrganizationId(data.activeOrganizationId);
          setActiveOrgRole(data.activeOrgRole);
          setMemberships(Array.isArray(data.memberships) ? data.memberships : []);
          setError(null);
          return data;
        }
      }
      // If unauthenticated, clear user
      setUser(null);
      setMemberships([]);
    } catch (err) {
      console.warn("[AUTH_CONTEXT_FETCH_WARN]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const switchOrganization = useCallback(async (newOrgId) => {
    if (!newOrgId || newOrgId === activeOrganizationId) return;
    try {
      const res = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: newOrgId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveOrganizationId(data.activeOrganizationId);
        setActiveOrgRole(data.activeOrgRole);
        // Reload page data to reflect new active organization
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } else {
        throw new Error(data.error || "Failed to switch organization");
      }
    } catch (err) {
      console.error("[AUTH_SWITCH_ORG_ERR]", err);
      throw err;
    }
  }, [activeOrganizationId]);

  const currentOrg = useMemo(() => {
    if (!memberships || memberships.length === 0) return null;
    return (
      memberships.find((m) => m.organizationId === activeOrganizationId) ||
      memberships[0] ||
      null
    );
  }, [memberships, activeOrganizationId]);

  const userInitials = useMemo(() => {
    if (!user) return "?";
    const nameStr = user.name?.trim() || user.email?.split("@")[0] || "";
    const parts = nameStr.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase() || "U";
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("[AUTH_LOGOUT_WARN]", e);
    } finally {
      setUser(null);
      setMemberships([]);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      activeOrganizationId,
      activeOrgRole,
      memberships,
      currentOrg,
      userInitials,
      loading,
      error,
      refreshAuth: fetchCurrentUser,
      switchOrganization,
      logout,
    }),
    [user, activeOrganizationId, activeOrgRole, memberships, currentOrg, userInitials, loading, error, fetchCurrentUser, switchOrganization, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      activeOrganizationId: null,
      activeOrgRole: null,
      memberships: [],
      currentOrg: null,
      userInitials: "U",
      loading: false,
      error: null,
      refreshAuth: async () => {},
      switchOrganization: async () => {},
      logout: async () => {
        if (typeof window !== "undefined") window.location.href = "/login";
      },
    };
  }
  return context;
}
