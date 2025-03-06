import { ReactNode } from 'react';
import { useFeatureAvailability } from '@/hooks/use-feature-availability';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertCircle, Brain, Lock, Settings } from 'lucide-react';

interface LlmFeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showAdminLink?: boolean;
}

/**
 * A component that conditionally renders its children based on whether
 * the current LLM model supports the specified feature.
 */
export function LlmFeatureGuard({
  feature,
  children,
  fallback,
  showAdminLink = false
}: LlmFeatureGuardProps) {
  const router = useRouter();
  const { available, loading, error, model, requiredCapabilities } = useFeatureAvailability(feature);
  
  if (loading) {
    return (
      <div className="p-6 border rounded-lg bg-gray-50 animate-pulse">
        <div className="flex items-center space-x-2 mb-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200 text-red-800">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 font-medium">Error Checking Feature</AlertTitle>
        <AlertDescription className="text-red-700">
          There was an error checking feature availability: {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!available) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-medium">Feature Not Available</AlertTitle>
          </div>
          
          <AlertDescription>
            <div className="space-y-3">
              <div className="text-amber-700">
                The current AI model <Badge variant="outline" className="font-mono ml-1 border-amber-300 bg-amber-50/50">
                  {model}
                </Badge> doesn't support the {' '}
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">{feature}</Badge> feature.
              </div>
              
              {requiredCapabilities.length > 0 && (
                <div className="text-sm text-amber-700 bg-amber-100/50 p-2 rounded border border-amber-200">
                  <span className="font-medium">Required capabilities:</span>{' '}
                  {requiredCapabilities.map((cap, i) => (
                    <Badge key={cap} variant="outline" className="mr-1 mt-1 text-xs border-amber-300 bg-white">
                      {cap}
                    </Badge>
                  ))}
                </div>
              )}
              
              {showAdminLink && (
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/admin/settings/llm')}
                    className="text-amber-700 border-amber-300 bg-white hover:bg-amber-50"
                  >
                    <Settings className="mr-2 h-3 w-3" />
                    Change AI Model
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </div>
      </Alert>
    );
  }
  
  return (
    <div className="relative">
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1 shadow-sm">
            <Brain className="h-3 w-3" />
            <span className="text-xs">{feature}</span>
          </Badge>
        </div>
      )}
      {children}
    </div>
  );
} 