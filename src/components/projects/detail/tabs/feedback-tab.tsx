'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { 
  ArrowPathIcon, 
  CheckIcon, 
  XMarkIcon, 
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from '@heroicons/react/24/outline';

interface ProjectFeedbackTabProps {
  project: any;
  feedback: any[];
  profile: any;
}

export default function ProjectFeedbackTab({
  project,
  feedback,
  profile,
}: ProjectFeedbackTabProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [responding, setResponding] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Check if user has edit rights
  const canEdit = profile.role === 'admin' || profile.role === 'editor';
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Handle feedback status change
  const handleStatusChange = async (feedbackId: string, status: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', feedbackId);
      
      if (error) throw error;
      
      router.refresh();
    } catch (error) {
      console.error('Error updating feedback status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Save response to feedback
  const handleSaveResponse = async (feedbackId: string) => {
    try {
      setLoading(true);
      
      // In a real application, you would:
      // 1. Save the response to the database
      // 2. Send a notification to the feedback provider
      // 3. Update the feedback status
      
      // For this demo, we'll just update the feedback status
      const { error } = await supabase
        .from('feedback')
        .update({
          status: 'approved',
          // In a real app, you'd store responses in a separate table
          // and link them to the feedback
        })
        .eq('id', feedbackId);
      
      if (error) throw error;
      
      // Clear the response state and responding ID
      setResponse('');
      setResponding(null);
      
      router.refresh();
    } catch (error) {
      console.error('Error saving response:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate AI response
  const handleGenerateAiResponse = async (feedbackId: string, feedbackContent: string) => {
    try {
      setAiGenerating(true);
      
      // Call the API to generate a response
      const response = await fetch('/api/llm/generate-feedback-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          feedbackId,
          feedbackContent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate response');
      }
      
      const data = await response.json();
      
      // Set the generated response
      setResponse(data.response);
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setAiGenerating(false);
    }
  };
  
  // Filter feedback by status
  const filteredFeedback = feedback.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });
  
  // Get sentiment color
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
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-gray-500" />
            Community Feedback
          </h3>
          <p className="text-sm text-gray-500">
            View and respond to feedback from the community
          </p>
        </div>
        
        {/* Status filter */}
        <div>
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
          >
            <option value="all">All feedback</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      {/* Feedback list */}
      {filteredFeedback.length > 0 ? (
        <div className="space-y-6">
          {filteredFeedback.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Feedback header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-shrink-0 items-center justify-center h-10 w-10 rounded-full bg-gray-200">
                    {item.user?.first_name ? (
                      <span className="text-gray-700 font-medium">
                        {item.user.first_name.charAt(0)}
                        {item.user.last_name ? item.user.last_name.charAt(0) : ''}
                      </span>
                    ) : (
                      <svg
                        className="h-6 w-6 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.user?.first_name
                        ? `${item.user.first_name} ${item.user.last_name || ''}`
                        : 'Anonymous User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Sentiment badge */}
                  {item.sentiment && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(
                        item.sentiment
                      )}`}
                    >
                      {item.sentiment}
                    </span>
                  )}
                  
                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {/* Feedback content */}
              <div className="px-6 py-4">
                <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                
                {/* Votes */}
                <div className="mt-4 flex items-center space-x-4 text-gray-500 text-sm">
                  <div className="flex items-center">
                    <HandThumbUpIcon className="h-4 w-4 mr-1" />
                    <span>{item.upvotes || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <HandThumbDownIcon className="h-4 w-4 mr-1" />
                    <span>{item.downvotes || 0}</span>
                  </div>
                </div>
              </div>
              
              {/* Admin actions */}
              {canEdit && (
                <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
                  {responding === item.id ? (
                    <div className="w-full space-y-3">
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
                        placeholder="Type your response here..."
                      />
                      <div className="flex justify-between">
                        <button
                          onClick={() => handleGenerateAiResponse(item.id, item.content)}
                          disabled={aiGenerating}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
                        >
                          {aiGenerating ? (
                            <ArrowPathIcon className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                          ) : (
                            <SparklesIcon className="-ml-0.5 mr-2 h-4 w-4" />
                          )}
                          {aiGenerating ? 'Generating...' : 'Generate AI Response'}
                        </button>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setResponding(null);
                              setResponse('');
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveResponse(item.id)}
                            disabled={loading || !response.trim()}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500 disabled:opacity-50"
                          >
                            {loading ? (
                              <ArrowPathIcon className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                            ) : (
                              <CheckIcon className="-ml-0.5 mr-2 h-4 w-4" />
                            )}
                            {loading ? 'Saving...' : 'Send Response'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setResponding(item.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
                        >
                          Respond
                        </button>
                      </div>
                      <div className="flex space-x-3">
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item.id, 'approved')}
                              disabled={loading}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckIcon className="-ml-0.5 mr-2 h-4 w-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'rejected')}
                              disabled={loading}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XMarkIcon className="-ml-0.5 mr-2 h-4 w-4" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No feedback yet</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            {filterStatus === 'all'
              ? 'This project has not received any feedback from the community yet.'
              : `No ${filterStatus} feedback found.`}
          </p>
        </div>
      )}
    </div>
  );
}
