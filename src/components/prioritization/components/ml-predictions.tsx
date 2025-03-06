import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MlPredictionsProps {
  showMlScores: boolean;
  toggleMlScores: () => void;
  isLoading: boolean;
  mlModelInfo?: {
    name: string;
    version: string;
    accuracy?: number;
    lastUpdated?: string;
    description?: string;
  } | null;
}

const MlPredictions: React.FC<MlPredictionsProps> = ({
  showMlScores,
  toggleMlScores,
  isLoading,
  mlModelInfo,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <Switch
          checked={showMlScores}
          onCheckedChange={toggleMlScores}
          disabled={isLoading}
          id="ml-toggle"
        />
        <label
          htmlFor="ml-toggle"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
        >
          <SparklesIcon className="h-4 w-4 mr-1 text-purple-500" />
          ML Predictions
        </label>
      </div>
      
      {mlModelInfo && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="text-xs text-gray-500 hover:text-gray-700 underline"
              aria-label="More info about ML model"
            >
              Model Info
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{mlModelInfo.name}</h3>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Version: {mlModelInfo.version}</p>
                {mlModelInfo.accuracy && (
                  <p>Accuracy: {(mlModelInfo.accuracy * 100).toFixed(1)}%</p>
                )}
                {mlModelInfo.lastUpdated && (
                  <p>Last Updated: {new Date(mlModelInfo.lastUpdated).toLocaleDateString()}</p>
                )}
              </div>
              {mlModelInfo.description && (
                <p className="text-xs mt-2">{mlModelInfo.description}</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
      
      {isLoading && <span className="text-xs text-gray-500">Loading predictions...</span>}
    </div>
  );
};

export default MlPredictions; 