import { useState, useEffect, useRef } from 'react';

interface CustomBotProtectionProps {
  onVerified: () => void;
  isVisible: boolean;
}

interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
}

interface BrowserFingerprint {
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  timezone: string;
  language: string;
  platform: string;
  userAgent: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  plugins: string[];
  touchSupport: boolean;
  deviceMemory?: number;
  hardwareConcurrency: number;
}

export function CustomBotProtection({ onVerified, isVisible }: CustomBotProtectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'fingerprint' | 'interaction' | 'complete'>('fingerprint');
  const [challengeText, setChallengeText] = useState('');
  const [interactionTarget, setInteractionTarget] = useState<{x: number, y: number} | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseMovements = useRef<MouseMovement[]>([]);
  const startTime = useRef<number>(Date.now());
  const fingerprint = useRef<BrowserFingerprint | null>(null);

  // Generate browser fingerprint
  const generateFingerprint = (): BrowserFingerprint => {
    const screen = window.screen;
    const nav = navigator;
    
    // Get installed plugins (safe way)
    const plugins: string[] = [];
    try {
      for (let i = 0; i < nav.plugins.length; i++) {
        plugins.push(nav.plugins[i].name);
      }
    } catch (e) {
      // Plugins access blocked
    }

    return {
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: nav.language || (nav as any).userLanguage,
      platform: nav.platform,
      userAgent: nav.userAgent,
      cookieEnabled: nav.cookieEnabled,
      doNotTrack: (nav as any).doNotTrack,
      plugins,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      deviceMemory: (nav as any).deviceMemory,
      hardwareConcurrency: nav.hardwareConcurrency || 1
    };
  };

  // Track mouse movements
  const handleMouseMove = (e: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    mouseMovements.current.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: Date.now()
    });

    // Keep only last 50 movements to avoid memory issues
    if (mouseMovements.current.length > 50) {
      mouseMovements.current = mouseMovements.current.slice(-50);
    }
  };

  // Generate random interaction challenge
  const generateInteractionChallenge = () => {
    const challenges = [
      "Click the blue circle",
      "Tap the green button", 
      "Touch the yellow square",
      "Click here to continue"
    ];
    
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    setChallengeText(randomChallenge);
    
    // Random position for interaction target
    setInteractionTarget({
      x: 150 + Math.random() * 200, // Random x between 150-350
      y: 100 + Math.random() * 100  // Random y between 100-200
    });
  };

  // Analyze mouse movements for human-like patterns
  const analyzeMouseMovements = () => {
    if (mouseMovements.current.length < 5) {
      return { score: 0, reason: 'insufficient_movement' };
    }

    let humanScore = 0;
    const movements = mouseMovements.current;

    // Check for smooth movement (humans don't move in perfect straight lines)
    let directionChanges = 0;
    let totalDistance = 0;
    let avgSpeed = 0;

    for (let i = 1; i < movements.length; i++) {
      const current = movements[i];
      const previous = movements[i - 1];
      
      // Calculate distance and speed
      const distance = Math.sqrt(
        Math.pow(current.x - previous.x, 2) + Math.pow(current.y - previous.y, 2)
      );
      const timeSpent = current.timestamp - previous.timestamp;
      const speed = timeSpent > 0 ? distance / timeSpent : 0;
      
      totalDistance += distance;
      avgSpeed += speed;

      // Check for direction changes (human-like)
      if (i > 1) {
        const prevDirection = Math.atan2(previous.y - movements[i-2].y, previous.x - movements[i-2].x);
        const currDirection = Math.atan2(current.y - previous.y, current.x - previous.x);
        const angleDiff = Math.abs(currDirection - prevDirection);
        
        if (angleDiff > 0.3) { // Significant direction change
          directionChanges++;
        }
      }
    }

    avgSpeed = avgSpeed / (movements.length - 1);

    // Human-like characteristics
    if (directionChanges > 2) humanScore += 25; // Natural movement curves
    if (totalDistance > 100) humanScore += 20; // Sufficient movement
    if (avgSpeed > 0.1 && avgSpeed < 5) humanScore += 25; // Natural speed
    if (movements.length > 10) humanScore += 15; // Extended interaction
    if (movements[0].timestamp - startTime.current > 1000) humanScore += 15; // Took time to move

    return { 
      score: humanScore, 
      movements: movements.length,
      avgSpeed: avgSpeed.toFixed(2),
      directionChanges,
      totalDistance: Math.round(totalDistance)
    };
  };

  // Handle interaction challenge completion
  const handleInteractionClick = async (e: React.MouseEvent) => {
    if (!interactionTarget) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Check if click is near the target (within 40px radius)
    const distance = Math.sqrt(
      Math.pow(clickX - interactionTarget.x, 2) + 
      Math.pow(clickY - interactionTarget.y, 2)
    );

    if (distance <= 40) {
      await verifyHuman();
    } else {
      setError('Please click exactly on the target. Try again.');
    }
  };

  // Main verification function
  const verifyHuman = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const mouseAnalysis = analyzeMouseMovements();
      const timeSpent = Date.now() - startTime.current;
      
      const verificationData = {
        fingerprint: fingerprint.current,
        mouseAnalysis,
        timeSpent,
        stage: stage
      };

      console.log('🤖 Bot Protection Analysis:', verificationData);

      const response = await fetch('/api/verify-human', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        setStage('complete');
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        setError(result.reason || 'Verification failed. Please try again.');
        // Reset for retry
        setTimeout(() => {
          setError(null);
          setStage('fingerprint');
          startTime.current = Date.now();
          mouseMovements.current = [];
        }, 3000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Initialize verification process
  useEffect(() => {
    if (!isVisible) return;

    const initVerification = async () => {
      // Generate browser fingerprint
      fingerprint.current = generateFingerprint();
      console.log('🔍 Browser fingerprint generated:', fingerprint.current);

      // Add mouse movement tracking
      const container = containerRef.current;
      if (container) {
        container.addEventListener('mousemove', handleMouseMove);
      }

      // Progress through stages
      setTimeout(() => {
        setStage('interaction');
        generateInteractionChallenge();
        setIsLoading(false);
      }, 1500);
    };

    initVerification();

    return () => {
      const container = containerRef.current;
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div 
        ref={containerRef}
        className="max-w-md w-full mx-4 text-center"
        onMouseMove={(e) => handleMouseMove(e.nativeEvent)}
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-excalibur-blue rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-excalibur-gray mb-2">Excalibur Cuba</h1>
          <p className="text-excalibur-gray/70">Security Verification</p>
        </div>

        {stage === 'fingerprint' || isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-excalibur-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="text-excalibur-gray">Analyzing browser environment...</p>
            <p className="text-sm text-excalibur-gray/70">This helps us distinguish between humans and bots</p>
          </div>
        ) : stage === 'interaction' ? (
          <div className="space-y-6">
            <div className="text-left">
              <h2 className="text-lg font-semibold text-excalibur-gray mb-2">
                Human Verification
              </h2>
              <p className="text-sm text-excalibur-gray/70 mb-4">
                {challengeText}
              </p>
            </div>

            {/* Interactive Challenge Area */}
            <div 
              className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 h-64 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={handleInteractionClick}
            >
              {interactionTarget && (
                <div 
                  className="absolute w-10 h-10 bg-excalibur-blue rounded-full flex items-center justify-center animate-pulse cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: interactionTarget.x - 20,
                    top: interactionTarget.y - 20
                  }}
                >
                  <span className="text-white font-bold">•</span>
                </div>
              )}
              
              <div className="text-center text-gray-500">
                <p className="text-sm">Move your mouse around, then click the target</p>
                <p className="text-xs mt-2">Mouse movements: {mouseMovements.current.length}</p>
              </div>
            </div>

            {isVerifying && (
              <div className="flex items-center justify-center gap-2 text-excalibur-blue">
                <div className="w-4 h-4 border-2 border-excalibur-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Verifying human behavior...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h2 className="text-lg font-semibold text-green-600 mb-2">Verification Complete!</h2>
            <p className="text-sm text-gray-600">Welcome to Excalibur Cuba</p>
          </div>
        )}

        <div className="text-xs text-excalibur-gray/50 border-t border-gray-200 pt-4 mt-6">
          <p>This security check protects against automated access.</p>
          <p>Your privacy is protected - no personal data is stored.</p>
        </div>
      </div>
    </div>
  );
}