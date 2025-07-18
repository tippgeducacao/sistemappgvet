
import React from 'react';
import { FormInputField, FormSelectField } from '@/components/ui/form-field';
import { FORMACAO_OPTIONS } from '@/constants/formOptions';

interface BasicInfoSectionProps {
  formData: any;
  updateField: (field: string, value: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ formData, updateField }) => {
  return (
    <div className="space-y-4">
      {/* Primeira linha - Data de chegada e Data de matrícula */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInputField
          id="dataChegada"
          label="Data de chegada do lead no CRM"
          type="date"
          value={formData.dataChegada || ''}
          onChange={(value) => updateField('dataChegada', value)}
        />
        
        <FormInputField
          id="dataMatricula"
          label="Data de matrícula"
          type="date"
          value={formData.dataMatricula || ''}
          onChange={(value) => updateField('dataMatricula', value)}
        />
      </div>

      {/* Nome do aluno - campo longo, linha inteira */}
      <FormInputField
        id="nomeAluno"
        label="Nome do Aluno"
        value={formData.nomeAluno || ''}
        onChange={(value) => updateField('nomeAluno', value)}
        placeholder="Digite o nome completo do aluno"
      />

      {/* Email e Formação lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInputField
          id="emailAluno"
          label="Email do Aluno"
          type="email"
          value={formData.emailAluno || ''}
          onChange={(value) => updateField('emailAluno', value)}
          placeholder="Digite o email do aluno"
        />

        <FormSelectField
          id="formacaoAluno"
          label="Formação do Aluno"
          value={formData.formacaoAluno || ''}
          onChange={(value) => updateField('formacaoAluno', value)}
          options={FORMACAO_OPTIONS}
          placeholder="Selecione a formação"
        />
      </div>
    </div>
  );
};

export default BasicInfoSection;
