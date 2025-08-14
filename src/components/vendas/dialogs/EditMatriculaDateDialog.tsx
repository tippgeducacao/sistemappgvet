import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EditMatriculaDateDialogProps {
  vendaId: string;
  currentDate: string | null;
  onUpdate: () => void;
  userType: string;
}

const EditMatriculaDateDialog: React.FC<EditMatriculaDateDialogProps> = ({
  vendaId,
  currentDate,
  onUpdate,
  userType
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentDate ? new Date(currentDate) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Só diretores podem editar
  if (userType !== 'diretor') {
    return null;
  }

  const handleSave = async () => {
    if (!selectedDate) {
      toast({
        title: "Erro",
        description: "Selecione uma data válida",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Atualizar o campo data_assinatura_contrato na tabela form_entries
      const { error: updateError } = await supabase
        .from('form_entries')
        .update({
          data_assinatura_contrato: format(selectedDate, 'yyyy-MM-dd')
        })
        .eq('id', vendaId);

      if (updateError) throw updateError;

      // Também inserir/atualizar nas respostas do formulário para compatibilidade
      const { error: responseError } = await supabase
        .from('respostas_formulario')
        .upsert({
          form_entry_id: vendaId,
          campo_nome: 'Data de Assinatura do Contrato',
          valor_informado: format(selectedDate, 'dd/MM/yyyy')
        }, {
          onConflict: 'form_entry_id,campo_nome'
        });

      if (responseError) throw responseError;

      toast({
        title: "Sucesso",
        description: "Data de assinatura de contrato atualizada com sucesso"
      });

      setIsOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar data:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar a data de assinatura de contrato",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 px-2"
          title="Editar Data de Assinatura de Contrato (Somente Diretores)"
        >
          <Edit className="h-3 w-3 mr-1" />
          Editar Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Data de Assinatura de Contrato</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Data de Assinatura de Contrato
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading || !selectedDate}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMatriculaDateDialog;