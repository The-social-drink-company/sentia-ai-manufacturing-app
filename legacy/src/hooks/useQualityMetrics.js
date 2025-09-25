export const useQualityMetrics = () => {
  return {
    rate: 98.7,
    metrics: [
      { metric: 'First Pass Yield', value: 98.5, benchmark: 95 },
      { metric: 'Defect Rate', value: 99.2, benchmark: 98 },
      { metric: 'Customer Returns', value: 99.8, benchmark: 99 },
      { metric: 'Process Capability', value: 96.3, benchmark: 94 },
      { metric: 'Inspection Pass', value: 97.8, benchmark: 96 },
      { metric: 'Supplier Quality', value: 95.4, benchmark: 93 },
    ],
    history: Array.from({ length: 20 }, (_, i) => ({ value: Math.round(90 + 5 * Math.sin((i / 20) * Math.PI * 2)) })),
  };
};
