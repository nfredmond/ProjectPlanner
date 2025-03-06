'use client';

import React, { useState } from 'react';
import ProjectDetailOverview from './project-detail-overview';
import ProjectScoringTab from './project-scoring-tab';
import ProjectLlmAnalysisTab from './project-llm-analysis-tab';
import ProjectFeedbackTab from './project-feedback-tab';
import ProjectLocationTab from './project-location-tab';

interface ProjectDetailTabsProps {
  project: any;
  criteria: any[];
  projectScores: any[];
  feedback: any[];
  profile: any;
}

export default function ProjectDetailTabs({
  project,
  criteria,
  projectScores,
  feedback,
  profile,
}: ProjectDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'scoring', label: 'Scoring & Prioritization' },
    { id: 'analysis', label: 'AI Analysis' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'location', label: 'Location' },
  ];
  
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-rtpa-blue-500 text-rtpa-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <ProjectDetailOverview project={project} />
        )}
        
        {activeTab === 'scoring' && (
          <ProjectScoringTab 
            project={project} 
            criteria={criteria} 
            projectScores={projectScores}
            profile={profile}
          />
        )}
        
        {activeTab === 'analysis' && (
          <ProjectLlmAnalysisTab 
            project={project}
            scores={projectScores}
            profile={profile}
          />
        )}
        
        {activeTab === 'feedback' && (
          <ProjectFeedbackTab 
            project={project}
            feedback={feedback}
            profile={profile}
          />
        )}
        
        {activeTab === 'location' && (
          <ProjectLocationTab 
            project={project}
            profile={profile}
          />
        )}
      </div>
    </div>
  );
}
