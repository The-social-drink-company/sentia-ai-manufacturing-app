export const useFinancialMetrics = () => {
  return {
    workingCapital: 2450000,
    monthly: Array.from({ length: 12 }, (_, i) => {
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];
      return {
        month,
        receivables: Math.floor(Math.random() * 200) + 800,
        payables: Math.floor(Math.random() * 150) + 600,
        inventory: Math.floor(Math.random() * 100) + 400,
        workingCapital: Math.floor(Math.random() * 300) + 2000,
      };
    }),
    history: Array.from({ length: 30 }, () => Math.random() * 500000 + 2000000),
  };
};