import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useProductionMetrics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['production-metrics'],
    queryFn: async () => {
      // In production, this would fetch from your API
      // For now, returning sample data
      return {
        oee: 85.2 + Math.random() * 5,
        hourlyProduction: Array.from({ length: 24 }, (_, i) => ({
          time: `${String(i).padStart(2, '0')}:00`,
          units: Math.floor(Math.random() * 50) + 100 + Math.sin(i / 3) * 20,
          target: 130,
          efficiency: Math.floor(Math.random() * 10) + 85,
        })),
        history: Array.from({ length: 30 }, () => Math.random() * 100 + 50),
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