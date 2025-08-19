import TVRankingDisplay from '@/components/dashboard/TVRankingDisplay';

const PublicTVRanking = () => {
  return (
    <div className="min-h-screen bg-background">
      <TVRankingDisplay 
        isOpen={true}
        onClose={() => {}} 
      />
    </div>
  );
};

export default PublicTVRanking;