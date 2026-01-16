'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface ConfigContextType {
  config: Record<string, string | number | boolean>;
  isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Record<string, string | number | boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/app/config');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('[Config] Failed to load:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();

    // Refresh config every 5 minutes
    const interval = setInterval(fetchConfig, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
