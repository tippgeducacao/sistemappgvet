
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormTextareaField } from '@/components/ui/form-field';
import { useFormStore } from '@/store/FormStore';

const ObservationsSection: React.FC = () => {
  const { formData, updateField } = useFormStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Observações Gerais</CardTitle>
      </CardHeader>
      <CardContent>
        <FormTextareaField
          id="observacoes"
          label="Observações"
          value={formData.observacoes || ''}
          onChange={(value) => updateField('observacoes', value)}
          placeholder="Digite suas observações sobre esta venda..."
          rows={4}
        />
      </CardContent>
    </Card>
  );
};

export default ObservationsSection;
