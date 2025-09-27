import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

import { useAuthRole } from '../../../hooks/useAuthRole.jsx';
import type { AssistantContextSnapshot } from '../types';

export function useAssistantContextSnapshot(): AssistantContextSnapshot {
  const location = useLocation();
  const { role } = useAuthRole();

  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const filters: Record<string, string> = {};
    params.forEach((value, key) => {
      filters[key] = value;
    });

    return {
      route: location.pathname,
      filters: Object.keys(filters).length ? filters : undefined,
      userRole: role,
    };
  }, [location.pathname, location.search, role]);
}
