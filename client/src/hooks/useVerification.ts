import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface VerificationState {
  needsVerification: boolean;
  isLoading: boolean;
  isVerified: boolean;
  country?: string;
  reason?: string;
}

interface VerificationResponse {
  needsVerification: boolean;
  reason: string;
  country?: string;
  ip?: string;
}

export function useVerification() {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    needsVerification: false,
    isLoading: true,
    isVerified: false,
  });

  // Check verification status from server
  const { data: verificationData, isLoading: isCheckingVerification } = useQuery<VerificationResponse>({
    queryKey: ['/api/check-verification'],
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Also check client-side cookie as backup
  const hasClientVerificationCookie = () => {
    if (typeof document === 'undefined') return false;
    return document.cookie
      .split(';')
      .some(cookie => cookie.trim().startsWith('turnstile_verified=true'));
  };

  // Update verification state when data changes
  useEffect(() => {
    if (verificationData) {
      const clientHasCookie = hasClientVerificationCookie();
      
      console.log('🔐 VERIFICATION CHECK:', {
        serverNeedsVerification: verificationData.needsVerification,
        clientHasCookie,
        reason: verificationData.reason,
        country: verificationData.country
      });

      setVerificationState({
        needsVerification: verificationData.needsVerification && !clientHasCookie,
        isLoading: false,
        isVerified: !verificationData.needsVerification || clientHasCookie,
        country: verificationData.country,
        reason: verificationData.reason,
      });
    } else if (!isCheckingVerification) {
      // Fallback: if server check fails, check client cookie
      const clientHasCookie = hasClientVerificationCookie();
      setVerificationState({
        needsVerification: !clientHasCookie,
        isLoading: false,
        isVerified: clientHasCookie,
        reason: 'fallback',
      });
    }
  }, [verificationData, isCheckingVerification]);

  // Mark as verified after successful challenge completion
  const markAsVerified = () => {
    console.log('✅ MARKING AS VERIFIED');
    setVerificationState(prev => ({
      ...prev,
      needsVerification: false,
      isVerified: true,
      reason: 'completed',
    }));
  };

  // Skip verification (for development/testing)
  const skipVerification = () => {
    console.log('⏭️ SKIPPING VERIFICATION');
    setVerificationState(prev => ({
      ...prev,
      needsVerification: false,
      isVerified: true,
      reason: 'skipped',
    }));
  };

  return {
    needsVerification: verificationState.needsVerification,
    isLoading: verificationState.isLoading || isCheckingVerification,
    isVerified: verificationState.isVerified,
    country: verificationState.country,
    reason: verificationState.reason,
    markAsVerified,
    skipVerification,
  };
}