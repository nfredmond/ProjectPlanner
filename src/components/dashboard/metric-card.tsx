'use client';

import React from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

type MetricIconType = 'projects' | 'active' | 'budget' | 'completed';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: MetricIconType;
  trend?: string;
  trendUp?: boolean;
}

export default function MetricCard({ title, value, icon, trend, trendUp }: MetricCardProps) {
  const iconComponents = {
    projects: DocumentTextIcon,
    active: BoltIcon,
    budget: CurrencyDollarIcon,
    completed: CheckCircleIcon,
  };

  const IconComponent = iconComponents[icon];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-rtpa-blue-100 text-rtpa-blue-600">
          <IconComponent className="h-6 w-6" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
            {trend && (
              <div className={`ml-2 flex items-baseline text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trendUp ? (
                  <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                )}
                <span className="ml-1">{trend}</span>
              </div>
            )}
          </dd>
        </div>
      </div>
    </div>
  );
}
