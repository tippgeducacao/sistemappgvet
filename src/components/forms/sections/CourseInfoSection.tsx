
import React, { useState, useEffect } from 'react';
import { FormSelectField, FormInputField } from '@/components/ui/form-field';
import { IES_OPTIONS, MODALIDADE_OPTIONS } from '@/constants/formOptions';
import { useCourses } from '@/hooks/useCourses';

interface CourseInfoSectionProps {
  formData: any;
  updateField: (field: string, value: string) => void;
}

const CourseInfoSection: React.FC<CourseInfoSectionProps> = ({ formData, updateField }) => {
  const { fetchCoursesByModalidade } = useCourses();
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedModalidade, setSelectedModalidade] = useState(formData.modalidadeCurso || '');

  useEffect(() => {
    const loadCoursesByModalidade = async () => {
      if (!selectedModalidade) {
        setAvailableCourses([]);
        return;
      }
      
      setCoursesLoading(true);
      try {
        const courses = await fetchCoursesByModalidade(selectedModalidade as 'Curso' | 'Pós-Graduação');
        setAvailableCourses(courses);
      } catch (error) {
        console.error('Erro ao carregar cursos:', error);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCoursesByModalidade();
  }, [selectedModalidade]);

  const handleModalidadeChange = (value: string) => {
    setSelectedModalidade(value);
    updateField('modalidadeCurso', value);
    // Limpar curso selecionado quando modalidade mudar
    updateField('cursoId', '');
  };

  const courseOptions = availableCourses.map(curso => ({ 
    value: curso.id, 
    label: curso.nome 
  }));

  const formatCurrency = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    if (numbers === '') return '';
    
    // Converte para número e divide por 100 para obter os centavos
    const amount = parseFloat(numbers) / 100;
    
    // Formata como moeda brasileira
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  const handleValorContratoChange = (value: string) => {
    const formattedValue = formatCurrency(value);
    updateField('valorContrato', formattedValue);
  };

  return (
    <div className="space-y-4">
      {/* IES e Modalidade lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelectField
          id="ies"
          label="IES *"
          value={formData.ies || ''}
          onChange={(value) => updateField('ies', value)}
          options={IES_OPTIONS}
          placeholder="Selecione a instituição"
        />

        <FormSelectField
          id="modalidadeCurso"
          label="Modalidade *"
          value={formData.modalidadeCurso || ''}
          onChange={handleModalidadeChange}
          options={MODALIDADE_OPTIONS}
          placeholder="Selecione a modalidade"
        />
      </div>

      {/* Curso - campo longo, linha inteira */}
      <FormSelectField
        id="cursoId"
        label={selectedModalidade ? `${selectedModalidade} *` : "Selecione primeiro a modalidade"}
        value={formData.cursoId || ''}
        onChange={(value) => updateField('cursoId', value)}
        options={courseOptions}
        loading={coursesLoading}
        placeholder={selectedModalidade ? `Selecione o ${selectedModalidade.toLowerCase()}` : "Primeiro selecione a modalidade"}
        disabled={!selectedModalidade}
      />

      {/* Valor do contrato - campo menor à direita */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div></div>
        <div></div>
        <FormInputField
          id="valorContrato"
          label="Valor do Contrato"
          value={formData.valorContrato || ''}
          onChange={handleValorContratoChange}
          placeholder="R$ 0,00"
          className="text-right"
        />
      </div>
    </div>
  );
};

export default CourseInfoSection;
