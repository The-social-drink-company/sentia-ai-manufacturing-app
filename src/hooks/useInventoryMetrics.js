export const useInventoryMetrics = () => {
  return {
    turns: 12.4,
    inventory: [
      { category: 'Raw Materials', current: 450, optimal: 500, min: 200 },
      { category: 'WIP', current: 280, optimal: 250, min: 150 },
      { category: 'Finished Goods', current: 620, optimal: 600, min: 400 },
      { category: 'Spare Parts', current: 150, optimal: 180, min: 100 },
      { category: 'Packaging', current: 320, optimal: 350, min: 200 },
    ],
    history: [] => 0;
};