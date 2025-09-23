import React from 'react';
import TVRankingDisplay from '@/components/dashboard/TVRankingDisplay';

const PublicTVRanking: React.FC = () => {
  return (
    <TVRankingDisplay 
      isOpen={true} 
      onClose={() => {}} // TV pública não precisa fechar
    />
  );
};

export default PublicTVRanking;