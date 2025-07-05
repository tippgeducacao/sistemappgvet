
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormSelectField } from '@/components/ui/form-field';
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
  return (
    <>
      <FormSelectField
        id="percentualDesconto"
        label="Percentual de Descontos *"
        value={formData.percentualDesconto || ''}
        onChange={(value) => updateField('percentualDesconto', value)}
        options={PERCENTUAL_DESCONTO_OPTIONS}
        placeholder="Selecione o percentual"
      />

      <FormSelectField
        id="dataPrimeiroPagamento"
        label="Data de 1º pagamento *"
        value={formData.dataPrimeiroPagamento || ''}
        onChange={(value) => updateField('dataPrimeiroPagamento', value)}
        options={DATA_PRIMEIRO_PAGAMENTO_OPTIONS}
        placeholder="Selecione a data"
      />

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
    </>
  );
};

export default PaymentConditionsSection;
