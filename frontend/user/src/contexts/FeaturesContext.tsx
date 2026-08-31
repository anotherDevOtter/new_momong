'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';

export interface FeatureSettings {
  fitEnabled: boolean;
  threeWayEnabled: boolean;
  courses: {
    '1way': boolean;
    '2way-personal': boolean;
    '2way-skeleton': boolean;
    '3way': boolean;
  };
}

const DEFAULT_FEATURES: FeatureSettings = {
  fitEnabled: true,
  threeWayEnabled: true,
  courses: {
    '1way': true,
    '2way-personal': true,
    '2way-skeleton': true,
    '3way': true,
  },
};

interface FeaturesContextValue {
  features: FeatureSettings;
  loading: boolean;
}

const FeaturesContext = createContext<FeaturesContextValue | null>(null);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<FeatureSettings>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/feature-settings`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setFeatures(json.data))
      .catch(() => setFeatures(DEFAULT_FEATURES))
      .finally(() => setLoading(false));
  }, []);

  return (
    <FeaturesContext.Provider value={{ features, loading }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  const ctx = useContext(FeaturesContext);
  if (!ctx) throw new Error('useFeatures must be used within FeaturesProvider');
  return ctx;
}
