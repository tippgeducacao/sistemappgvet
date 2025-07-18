
import React from 'react';
import { FormSelectField, FormInputField } from '@/components/ui/form-field';
import { INDICACAO_OPTIONS } from '@/constants/formOptions';
import { FormDataService } from '@/services/form/FormDataService';

interface IndicationSectionProps {
  formData: any;
  updateField: (field: string, value: string) => void;
}

const IndicationSection: React.FC<IndicationSectionProps> = ({ formData, updateField }) => {
  const handleIndicacaoChange = (value: string) => {
    updateField('indicacao', value);
    FormDataService.handleIndicacaoChange(value, () => updateField('nomeIndicador', ''));
  };

  return (
    <div className="space-y-3">
      {/* Indicação e Vendedor lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelectField
          id="indicacao"
          label="Indicação *"
          value={formData.indicacao || ''}
          onChange={handleIndicacaoChange}
          options={INDICACAO_OPTIONS}
          placeholder="Selecione uma opção"
        />

        <FormInputField
          id="vendedor"
          label="Vendedor"
          value={formData.vendedor || ''}
          onChange={(value) => updateField('vendedor', value)}
          disabled={true}
          placeholder="Será preenchido automaticamente"
          className="bg-gray-50"
        />
      </div>

      {/* Nome do indicador - linha inteira quando visível */}
      {FormDataService.shouldShowIndicadorField(formData.indicacao) && (
        <FormInputField
          id="nomeIndicador"
          label="Nome de quem indicou"
          value={formData.nomeIndicador || ''}
          onChange={(value) => updateField('nomeIndicador', value)}
          placeholder="Nome completo de quem indicou"
        />
      )}
    </div>
  );
};

export default IndicationSection;
