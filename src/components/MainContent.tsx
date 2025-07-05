
import React from 'react';
import RouteRenderer from '@/components/content/RouteRenderer';
import PendingVendasAlert from '@/components/alerts/PendingVendasAlert';

const MainContent: React.FC = () => {
  return (
    <main className="flex-1 p-4">
      <PendingVendasAlert />
      <RouteRenderer />
    </main>
  );
};

export default MainContent;
