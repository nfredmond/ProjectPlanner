import { Metadata } from 'next';
import LlmSettings from '@/components/settings/llm-settings';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Brain, Home, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Model Settings',
  description: 'Configure AI language models for your organization',
};

export default function LlmSettingsPage() {
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/dashboard" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/settings" className="flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="flex items-center gap-1 text-gray-500">
              <Brain className="h-3.5 w-3.5" />
              <span>AI Model Settings</span>
            </span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI Language Model Settings
        </h1>
        <p className="text-gray-500 text-lg max-w-3xl">
          Configure the AI language models used for project recommendations, feedback analysis, and automated reporting.
        </p>
      </div>
      
      <LlmSettings />
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-800 font-medium mb-2">Understanding AI Model Selection</h3>
        <p className="text-blue-700 text-sm">
          Different AI models have different capabilities. Choose a model that best suits your organization's needs:
        </p>
        <ul className="mt-2 text-sm text-blue-700 space-y-1 ml-6 list-disc">
          <li>For best overall performance, use OpenAI's GPT-4o or Anthropic's Claude 3 Opus (online version only)</li>
          <li>For a balance of performance and cost, use Claude 3 Sonnet or GPT-3.5-Turbo</li>
          <li>For portable/offline use, Llama3 provides the best performance among local models</li>
          <li>For computers with limited resources, Phi3 is a smaller but still capable model</li>
        </ul>
      </div>
    </div>
  );
} 