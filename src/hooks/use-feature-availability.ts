import { useState, useEffect } from 'react';

type FeatureAvailability = {
  available: boolean;
  model: string;
  requiredCapabilities: string[];
  loading: boolean;
  error: string | null;
};

type AllFeaturesAvailability = {
  model: string;
  capabilities: string[];
  features: Record<string, boolean>;
  loading: boolean;
  error: string | null;
};

/**
 * Hook to check if a specific LLM feature is available with the current model
 */
export function useFeatureAvailability(feature: string): FeatureAvailability {
  const [availability, setAvailability] = useState<FeatureAvailability>({
    available: false,
    model: '',
    requiredCapabilities: [],
    loading: true,
    error: null
  });
  
  useEffect(() => {
    let isMounted = true;
    
    const checkAvailability = async () => {
      try {
        const response = await fetch(`/api/llm/capabilities?feature=${feature}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to check feature availability');
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setAvailability({
            available: data.available,
            model: data.model,
            requiredCapabilities: data.requiredCapabilities || [],
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (isMounted) {
          setAvailability(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      }
    };
    
    checkAvailability();
    
    return () => {
      isMounted = false;
    };
  }, [feature]);
  
  return availability;
}

/**
 * Hook to check availability for all LLM features
 */
export function useAllFeaturesAvailability(): AllFeaturesAvailability {
  const [availability, setAvailability] = useState<AllFeaturesAvailability>({
    model: '',
    capabilities: [],
    features: {},
    loading: true,
    error: null
  });
  
  useEffect(() => {
    let isMounted = true;
    
    const checkAllFeatures = async () => {
      try {
        const response = await fetch('/api/llm/capabilities');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to check features availability');
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setAvailability({
            model: data.model,
            capabilities: data.capabilities || [],
            features: data.features || {},
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (isMounted) {
          setAvailability(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      }
    };
    
    checkAllFeatures();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  return availability;
} 