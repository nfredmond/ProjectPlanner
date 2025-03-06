'use client';

import React from 'react';
import { ResponseApproval } from '@/components/community/response-approval';

interface ResponseApprovalWrapperProps {
  agencyId: string;
}

export function ResponseApprovalWrapper({ agencyId }: ResponseApprovalWrapperProps) {
  return (
    <ResponseApproval agencyId={agencyId} />
  );
} 