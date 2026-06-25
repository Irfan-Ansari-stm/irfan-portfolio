"use client";
import { useState, useEffect } from "react";
import { publicApi } from "@/lib/api";
import type { SiteSettings } from "@/types";

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.getSettings()
      .then((res) => setSettings(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
