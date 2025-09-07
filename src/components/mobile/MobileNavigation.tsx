import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  TruckIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CubeIcon as CubeIconSolid,
  TruckIcon as TruckIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  activeIcon: React.ComponentType<any>;
}

export const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: HomeIcon,
      activeIcon: HomeIconSolid
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: ChartBarIcon,
      activeIcon: ChartBarIconSolid
    },
    {
      path: '/inventory',
      label: 'Inventory',
      icon: CubeIcon,
      activeIcon: CubeIconSolid
    },
    {
      path: '/supply-chain',
      label: 'Supply',
      icon: TruckIcon,
      activeIcon: TruckIconSolid
    },
    {
      path: '/financial',
      label: 'Finance',
      icon: CurrencyDollarIcon,
      activeIcon: CurrencyDollarIconSolid
    }
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="mobile-nav safe-area-inset bg-white border-t border-gray-200">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.activeIcon : item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`mobile-nav-item ripple ${active ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-500'}`} />
              <span className={`mt-1 text-xs ${active ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};