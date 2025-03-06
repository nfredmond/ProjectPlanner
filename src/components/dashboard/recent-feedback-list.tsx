'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { FeedbackItem } from './types';
import { CardTitle } from '@/components/ui/card';

interface RecentFeedbackListProps {
  feedback: FeedbackItem[];
}

// Helper function to get project title from projects
const getProjectTitle = (projects: FeedbackItem['projects']): string => {
  if (!projects) return 'Unknown Project';
  
  if (Array.isArray(projects)) {
    return projects.length > 0 ? projects[0].title : 'Unknown Project';
  }
  
  return projects.title || 'Unknown Project';
};

export default function RecentFeedbackList({ feedback }: RecentFeedbackListProps) {
  // Function to get sentiment badge color
  const getSentimentColor = (sentiment: string | undefined) => {
    if (!sentiment) return 'bg-gray-100 text-gray-800';
    
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      case 'neutral':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format created_at date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Function to truncate content
  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      {feedback.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {feedback.map((item) => (
            <li key={item.id} className="py-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-full bg-rtpa-blue-100 flex items-center justify-center text-rtpa-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-medium text-gray-900">
                      {item.projects ? (
                        <Link href={`/community/feedback/${item.id}`} className="hover:underline">
                          Re: {getProjectTitle(item.projects)}
                        </Link>
                      ) : (
                        <Link href={`/community/feedback/${item.id}`} className="hover:underline">
                          General Feedback
                        </Link>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(
                        item.sentiment
                      )}`}
                    >
                      {item.sentiment || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{truncateContent(item.content)}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {formatDate(item.created_at)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-8 text-gray-500">No recent feedback found</div>
      )}
    </div>
  );
}

