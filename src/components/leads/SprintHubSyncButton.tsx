
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';
import { useSprintHubSync } from '@/hooks/useSprintHubSync';

const SprintHubSyncButton: React.FC = () => {
  const { mutate: syncSprintHub, isPending } = useSprintHubSync();

  const handleSync = () => {
    syncSprintHub();
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleSync}
        disabled={isPending}
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        {isPending ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {isPending ? 'Sincronizando...' : 'Sincronizar SprintHub'}
      </Button>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>
          Importa leads do SprintHub sem duplicatas
        </span>
      </div>
    </div>
  );
};

export default SprintHubSyncButton;
