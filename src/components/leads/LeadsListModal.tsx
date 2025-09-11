import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Users, Calendar, Phone, Mail, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Lead } from '@/hooks/useLeads';

interface LeadsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  pageTitle: string;
}

const LeadsListModal: React.FC<LeadsListModalProps> = ({
  isOpen,
  onClose,
  leads,
  pageTitle
}) => {
  const getStatusVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'novo':
        return 'default';
      case 'contatado':
        return 'secondary';
      case 'interessado':
        return 'outline';
      case 'convertido':
        return 'default';
      case 'descartado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Leads da página: {pageTitle}</span>
          </DialogTitle>
          <DialogDescription>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} encontrado{leads.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="space-y-4">
            {leads.map((lead, index) => (
              <div key={lead.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">
                        {lead.nome || 'Nome não informado'}
                      </h4>
                      {lead.status && (
                        <Badge variant={getStatusVariant(lead.status)}>
                          {lead.status}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {lead.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      
                      {lead.whatsapp && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{lead.whatsapp}</span>
                        </div>
                      )}
                      
                      {lead.created_at && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      
                      {lead.fonte_referencia && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Origem:</span>
                          <span>{lead.fonte_referencia}</span>
                        </div>
                      )}
                    </div>

                    {lead.regiao && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Localização:</span> {lead.regiao}
                      </div>
                    )}

                    {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lead.utm_source && (
                          <Badge variant="outline" className="text-xs">
                            Fonte: {lead.utm_source}
                          </Badge>
                        )}
                        {lead.utm_medium && (
                          <Badge variant="outline" className="text-xs">
                            Meio: {lead.utm_medium}
                          </Badge>
                        )}
                        {lead.utm_campaign && (
                          <Badge variant="outline" className="text-xs">
                            Campanha: {lead.utm_campaign}
                          </Badge>
                        )}
                      </div>
                    )}

                    {lead.vendedor_atribuido_profile?.name && (
                      <div className="text-sm">
                        <span className="font-medium text-primary">
                          Vendedor: {lead.vendedor_atribuido_profile.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Aqui pode implementar navegação para detalhes do lead
                        console.log('Ver detalhes do lead:', lead.id);
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </div>
                
                {index < leads.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadsListModal;