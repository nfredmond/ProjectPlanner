import React from 'react';
import { Criterion } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface CriteriaWeightsProps {
  criteria: Criterion[];
  weights: Record<string, number>;
  onWeightChange: (criterionId: string, weight: number) => void;
  onSaveWeights: () => void;
}

const CriteriaWeights: React.FC<CriteriaWeightsProps> = ({
  criteria,
  weights,
  onWeightChange,
  onSaveWeights,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
          aria-label="Adjust criteria weights"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
          Weights
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Adjust Criteria Weights</h3>
            <button
              onClick={onSaveWeights}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply Weights
            </button>
          </div>
          
          <div className="space-y-3">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium">{criterion.name}</label>
                  <Badge variant="outline">{weights[criterion.id] || criterion.weight}</Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={weights[criterion.id] || criterion.weight}
                  onChange={(e) => onWeightChange(criterion.id, parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">{criterion.description}</p>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CriteriaWeights; 