import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useProductionMetrics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['production-metrics'],
    queryFn: async () => {
      // In production, this would fetch from your API
      // For now, returning sample data
      return {
        oee: 85.2 + 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return data || {
    oee: 85.2,
    hourlyProduction: [],
    history: [],
  };
};