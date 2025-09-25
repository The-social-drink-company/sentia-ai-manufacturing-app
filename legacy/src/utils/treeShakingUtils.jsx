
// Tree shaking optimized imports
export const optimizedImports = {
  // Import only what we need from Heroicons
  icons: {
    // Outline icons (lighter weight)
    ChartBarIcon: () => import('@heroicons/react/24/outline').then(m => ({ default: m.ChartBarIcon })),
    UserIcon: () => import('@heroicons/react/24/outline').then(m => ({ default: m.UserIcon })),
    CogIcon: () => import('@heroicons/react/24/outline').then(m => ({ default: m.CogIcon }))
  },
  
  // Import specific chart components only
  charts: {
    LineChart: () => import('recharts').then(m => ({ default: m.LineChart })),
    BarChart: () => import('recharts').then(m => ({ default: m.BarChart })),
    PieChart: () => import('recharts').then(m => ({ default: m.PieChart }))
  }
};

// Dynamic icon loader to reduce bundle size
export const DynamicIcon = ({ iconName, className, ...props }) => {
  const [Icon, setIcon] = React.useState(null);
  
  React.useEffect(() => {
    if (optimizedImports.icons[iconName]) {
      optimizedImports.icons[iconName]().then(module => {
        setIcon(() => module.default);
      });
    }
  }, [iconName]);

  if (!Icon) return <div className={className} style={{ width: '1.5rem', height: '1.5rem' }} />;
  
  return <Icon className={className} {...props} />;
};

