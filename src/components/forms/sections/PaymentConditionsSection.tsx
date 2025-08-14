
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormSelectField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  PERCENTUAL_DESCONTO_OPTIONS,
  DATA_PRIMEIRO_PAGAMENTO_OPTIONS,
  CARENCIA_PRIMEIRA_COBRANCA_OPTIONS,
  REEMBOLSO_MATRICULA_OPTIONS
} from '@/constants/formOptions';

interface PaymentConditionsSectionProps {
  formData: any;
  updateField: (field: string, value: string) => void;
}

const PaymentConditionsSection: React.FC<PaymentConditionsSectionProps> = ({ formData, updateField }) => {
  const dataAssinaturaContrato = formData.dataAssinaturaContrato ? new Date(formData.dataAssinaturaContrato) : undefined;

  return (
    <div className="space-y-3">
      {/* Percentual de desconto e Data de primeiro pagamento lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="percentualDesconto">Percentual de Descontos *</Label>
          <Input
            id="percentualDesconto"
            value={formData.percentualDesconto || ''}
            onChange={(e) => updateField('percentualDesconto', e.target.value)}
            placeholder="Ex: 10, 15, 20"
          />
        </div>

        <FormSelectField
          id="dataPrimeiroPagamento"
          label="Data de 1º pagamento *"
          value={formData.dataPrimeiroPagamento || ''}
          onChange={(value) => updateField('dataPrimeiroPagamento', value)}
          options={DATA_PRIMEIRO_PAGAMENTO_OPTIONS}
          placeholder="Selecione a data"
        />
      </div>

      {/* Carência e Reembolso lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <FormSelectField
            id="carenciaPrimeiraCobranca"
            label="Terá Carência para a primeira Cobrança? *"
            value={formData.carenciaPrimeiraCobranca || ''}
            onChange={(value) => {
              updateField('carenciaPrimeiraCobranca', value);
              // Limpar o campo de detalhes da carência se a resposta não for SIM
              if (value !== 'SIM') {
                updateField('detalhesCarencia', '');
              }
            }}
            options={CARENCIA_PRIMEIRA_COBRANCA_OPTIONS}
            placeholder="Selecione uma opção"
          />

          {formData.carenciaPrimeiraCobranca === 'SIM' && (
            <div>
              <Label htmlFor="detalhesCarencia">
                Especifique a carência *
              </Label>
              <Input
                id="detalhesCarencia"
                type="text"
                value={formData.detalhesCarencia || ''}
                onChange={(e) => updateField('detalhesCarencia', e.target.value)}
                placeholder="Ex: 30 dias, 60 dias, etc."
                className="mt-1"
              />
            </div>
          )}
        </div>

        <FormSelectField
          id="reembolsoMatricula"
          label="Reembolso da matrícula *"
          value={formData.reembolsoMatricula || ''}
          onChange={(value) => updateField('reembolsoMatricula', value)}
          options={REEMBOLSO_MATRICULA_OPTIONS}
          placeholder="Selecione uma opção"
        />
      </div>

      {/* Data de Assinatura do Contrato */}
      <div>
        <Label htmlFor="dataAssinaturaContrato">Data de Assinatura do Contrato *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dataAssinaturaContrato && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataAssinaturaContrato ? format(dataAssinaturaContrato, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dataAssinaturaContrato}
              onSelect={(date) => {
                if (date) {
                  updateField('dataAssinaturaContrato', format(date, 'yyyy-MM-dd'));
                }
              }}
              initialFocus
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default PaymentConditionsSection;
