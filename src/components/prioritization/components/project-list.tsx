import React from 'react';
import Link from 'next/link';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { Criterion } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectListProps {
  projects: any[];
  criteria: Criterion[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  handleSortChange: (field: string) => void;
  highlightedProjectId?: string;
  formatCurrency: (amount?: number) => string;
  showMlScores?: boolean;
  mlPredictions?: Record<string, any>;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  criteria,
  sortBy,
  sortDirection,
  handleSortChange,
  highlightedProjectId,
  formatCurrency,
  showMlScores = false,
  mlPredictions = {},
}) => {
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4" />
    ) : (
      <ChevronDownIcon className="h-4 w-4" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
              Rank
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project
            </th>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSortChange('cost_estimate')}
            >
              <div className="flex items-center space-x-1">
                <span>Cost</span>
                {getSortIcon('cost_estimate')}
              </div>
            </th>
            {criteria.map((criterion) => (
              <th
                key={criterion.id}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        <span className="truncate max-w-[100px]">{criterion.name}</span>
                        <InformationCircleIcon className="h-4 w-4 ml-1 text-gray-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{criterion.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
            ))}
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSortChange('score_total')}
            >
              <div className="flex items-center space-x-1">
                <span>Score</span>
                {getSortIcon('score_total')}
              </div>
            </th>
            {showMlScores && (
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('ml_score')}
              >
                <div className="flex items-center space-x-1">
                  <span>ML Score</span>
                  {getSortIcon('ml_score')}
                </div>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.map((project, index) => (
            <tr 
              key={project.id} 
              className={`
                ${highlightedProjectId === project.id ? 'bg-blue-50' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
                hover:bg-gray-100
              `}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {index + 1}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                <Link href={`/projects/${project.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                  {project.title}
                </Link>
                <p className="text-xs text-gray-500">{project.primary_category}</p>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(project.cost_estimate)}
              </td>
              {criteria.map((criterion) => {
                const criterionScore = project.score_breakdown?.[criterion.id] || 0;
                return (
                  <td key={`${project.id}-${criterion.id}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(criterionScore / criterion.max_points) * 100}%` }}
                        ></div>
                      </div>
                      <span>{criterionScore.toFixed(1)}</span>
                    </div>
                  </td>
                );
              })}
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {project.score_total?.toFixed(1) || 'N/A'}
                </span>
              </td>
              {showMlScores && (
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                    {mlPredictions[project.id]?.ml_score.toFixed(1) || 'N/A'}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectList; 