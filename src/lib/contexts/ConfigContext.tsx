'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ConfigContextType {
  config: Record<string, string | number | boolean>;
  isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { data: config = {}, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: async () => {
      const res = await fetch('/api/app/config');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchInterval: 1000 * 30, // Refresh every 30 seconds
  });

  return (
    <ConfigContext.Provider value={{ config, isLoading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }

  // Helper to get with default fallback
  const get = <T extends string | number | boolean>(key: string, defaultValue: T): T => {
    const value = context.config[key];
    return (value !== undefined ? value : defaultValue) as T;
  };

  return { config: context.config, isLoading: context.isLoading, get };
}
