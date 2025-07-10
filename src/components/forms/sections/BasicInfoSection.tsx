
import React from 'react';
import { FormInputField, FormSelectField } from '@/components/ui/form-field';
import { FORMACAO_OPTIONS } from '@/constants/formOptions';

interface BasicInfoSectionProps {
  formData: any;
  updateField: (field: string, value: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ formData, updateField }) => {
  return (
    <>
      <FormInputField
        id="dataChegada"
        label="Data de chegada do lead no CRM"
        type="date"
        value={formData.dataChegada || ''}
        onChange={(value) => updateField('dataChegada', value)}
      />

      <FormInputField
        id="nomeAluno"
        label="Nome do Aluno"
        value={formData.nomeAluno || ''}
        onChange={(value) => updateField('nomeAluno', value)}
        placeholder="Digite o nome completo do aluno"
      />

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

      <FormInputField
        id="dataMatricula"
        label="Data de matrícula"
        type="date"
        value={formData.dataMatricula || ''}
        onChange={(value) => updateField('dataMatricula', value)}
      />
    </>
  );
};

export default BasicInfoSection;
