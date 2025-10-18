import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiService from '@/services/api'

export const OPTIMIZATION_SUMMARY_KEY = ['working-capital-optimization', 'summary']

export default function useWorkingCapitalOptimization() {
  const queryClient = useQueryClient()

  const summaryQuery = useQuery({
    queryKey: OPTIMIZATION_SUMMARY_KEY,
    queryFn: () => apiService.getWorkingCapitalOptimizationSummary(),
    staleTime: 60 * 1000,
  })

  const scenarioMutation = useMutation({
    mutationKey: ['working-capital-optimization', 'scenario'],
    mutationFn: (payload = {}) => apiService.runWorkingCapitalScenario(payload),
  })

  const approvalMutation = useMutation({
    mutationKey: ['working-capital-optimization', 'approval'],
    mutationFn: (payload = {}) => apiService.evaluateWorkingCapitalApproval(payload),
  })

  const mitigationMutation = useMutation({
    mutationKey: ['working-capital-optimization', 'mitigation'],
    mutationFn: (payload = {}) => apiService.getWorkingCapitalMitigationPlan(payload),
  })

  const scenarios = useMemo(() => summaryQuery.data?.scenarios ?? [], [summaryQuery.data])
  const baseline = summaryQuery.data?.baseline
  const plan = summaryQuery.data?.plan

  const refetchSummary = () => queryClient.invalidateQueries({ queryKey: OPTIMIZATION_SUMMARY_KEY })

  return {
    baseline,
    scenarios,
    plan,
    summaryQuery,
    scenarioMutation,
    approvalMutation,
    mitigationMutation,
    refetchSummary,
  }
}
