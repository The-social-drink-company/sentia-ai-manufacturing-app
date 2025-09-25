import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useProductionMetrics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['production-metrics'],
    queryFn: async () => {
      // In production, this would fetch from your API
      // For now, returning sample data
      return {
        oee: 85.2,
        hourlyProduction: Array.from({ length: 24 }, (_, i) => ({
          time: `${String(i).padStart(2, '0')}:00`,
          units: Math.floor(80 + 40 * Math.sin((i / 24) * Math.PI * 2)),
          target: 100,
          efficiency: Math.round(80 + 20 * Math.cos((i / 24) * Math.PI * 2))
        })),
        history: Array.from({ length: 20 }, (_, i) => ({ value: Math.round(60 + 20 * Math.sin((i / 20) * Math.PI * 2)) }))
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return data || {
    oee: 85.2,
    hourlyProduction: [],
    history: [],
  };
};
