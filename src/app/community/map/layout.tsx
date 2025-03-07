import React from 'react';

export default function CommunityMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto">
      {children}
    </div>
  );
} 