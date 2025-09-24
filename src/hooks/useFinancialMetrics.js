export const useFinancialMetrics = () => {
  return {
    workingCapital: 2450000,
    monthly: Array.from({ length: 12 }, (_, i) => {
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];
      return {
        month,
        receivables: Math.floor(800 + 200 * Math.sin((i / 12) * Math.PI * 2)),
        payables: Math.floor(600 + 150 * Math.cos((i / 12) * Math.PI * 2)),
        inventory: Math.floor(900 + 180 * Math.sin(((i + 3) / 12) * Math.PI * 2))
      };
    }),
    history: Array.from({ length: 20 }, (_, i) => ({ value: Math.round(2000 + 200 * Math.sin((i / 20) * Math.PI * 2)) })),
  };
};