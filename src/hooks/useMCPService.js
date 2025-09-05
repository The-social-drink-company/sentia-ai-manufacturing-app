import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mcpService } from '../services/mcpService';

/**
 * Custom hook for MCP Server integration
 */
export const useMCPService = () => {
  const queryClient = useQueryClient();

  // Health check query
  const useHealthCheck = () => {
    return useQuery({
      queryKey: ['mcp', 'health'],
      queryFn: () => mcpService.checkHealth(),
      refetchInterval: 30000, // Check every 30 seconds
      retry: 1,
    });
  };

  // Providers status query
  const useProviders = () => {
    return useQuery({
      queryKey: ['mcp', 'providers'],
      queryFn: () => mcpService.getProviders(),
      staleTime: 60000, // Consider data stale after 1 minute
    });
  };

  // Xero queries and mutations
  const useXeroContacts = (params = {}) => {
    return useQuery({
      queryKey: ['mcp', 'xero', 'contacts', params],
      queryFn: () => mcpService.xeroGetContacts(params),
      enabled: !!params,
    });
  };

  const useXeroInvoices = (params = {}) => {
    return useQuery({
      queryKey: ['mcp', 'xero', 'invoices', params],
      queryFn: () => mcpService.xeroGetInvoices(params),
      enabled: !!params,
    });
  };

  const useXeroItems = () => {
    return useQuery({
      queryKey: ['mcp', 'xero', 'items'],
      queryFn: () => mcpService.xeroGetItems(),
    });
  };

  const useCreateXeroInvoice = () => {
    return useMutation({
      mutationFn: (invoiceData) => mcpService.xeroCreateInvoice(invoiceData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['mcp', 'xero', 'invoices'] });
      },
    });
  };

  // OpenAI mutations
  const useOpenAIGenerate = () => {
    return useMutation({
      mutationFn: ({ prompt, options }) => mcpService.openaiGenerateText(prompt, options),
    });
  };

  const useOpenAIAnalyze = () => {
    return useMutation({
      mutationFn: ({ data, analysisType }) => mcpService.openaiAnalyzeData(data, analysisType),
    });
  };

  const useOpenAIEmbedding = () => {
    return useMutation({
      mutationFn: (text) => mcpService.openaiCreateEmbedding(text),
    });
  };

  // Anthropic mutations
  const useAnthropicManufacturing = () => {
    return useMutation({
      mutationFn: ({ data, analysisType }) => 
        mcpService.anthropicAnalyzeManufacturing(data, analysisType),
    });
  };

  const useAnthropicOptimize = () => {
    return useMutation({
      mutationFn: (processData) => mcpService.anthropicOptimizeProcess(processData),
    });
  };

  const useAnthropicInsights = () => {
    return useMutation({
      mutationFn: (context) => mcpService.anthropicGenerateInsights(context),
    });
  };

  return {
    // Health and status
    useHealthCheck,
    useProviders,
    
    // Xero
    useXeroContacts,
    useXeroInvoices,
    useXeroItems,
    useCreateXeroInvoice,
    
    // OpenAI
    useOpenAIGenerate,
    useOpenAIAnalyze,
    useOpenAIEmbedding,
    
    // Anthropic
    useAnthropicManufacturing,
    useAnthropicOptimize,
    useAnthropicInsights,
  };
};

export default useMCPService;