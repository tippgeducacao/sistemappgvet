
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAppStateStore } from '@/stores/AppStateStore';

const NovaVendaButton: React.FC = () => {
  const { showNovaVendaForm } = useAppStateStore();

  const handleClick = () => {
    console.log('📝 Abrindo formulário de nova venda');
    showNovaVendaForm();
  };

  return (
    <Button 
      onClick={handleClick}
      className="bg-ppgvet-teal hover:bg-ppgvet-teal/90 text-white"
    >
      <Plus className="h-4 w-4 mr-2" />
      Nova Venda
    </Button>
  );
};

export default NovaVendaButton;
