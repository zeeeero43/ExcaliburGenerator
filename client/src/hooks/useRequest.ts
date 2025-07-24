import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { usePerformance } from './usePerformance';

// 🇨🇺 CUBAN OPTIMIZATION: Enhanced request handling for slow connections
export function useOptimizedRequest<T>(
  queryKey: string | string[], 
  options?: Partial<UseQueryOptions<T>>
) {
  const { isCubanOptimized } = usePerformance();
  
  return useQuery<T>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    staleTime: isCubanOptimized ? 300000 : 60000, // 5 min for Cuban users vs 1 min
    retry: isCubanOptimized ? 5 : 3, // More retries for poor connections
    retryDelay: (attemptIndex) => isCubanOptimized 
      ? Math.min(1000 * 2 ** attemptIndex, 10000) // Exponential backoff up to 10s
      : Math.min(1000 * 2 ** attemptIndex, 5000),  // Standard backoff up to 5s
    refetchOnWindowFocus: !isCubanOptimized, // Avoid unnecessary requests
    ...options
  });
}

// For backwards compatibility, re-export useQuery
export { useQuery } from '@tanstack/react-query';