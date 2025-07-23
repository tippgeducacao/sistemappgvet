import React, { useState, useEffect } from 'react';
import { FormSelectField, FormInputField } from '@/components/ui/form-field';
import { IES_OPTIONS } from '@/constants/formOptions';
import { useCourses } from '@/hooks/useCourses';

interface CourseInfoSectionSDRProps {
  formData: any;
  updateField: (field: string, value: string) => void;
}

const CourseInfoSectionSDR: React.FC<CourseInfoSectionSDRProps> = ({ formData, updateField }) => {
  const { fetchCoursesByModalidade } = useCourses();
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);

  // Auto-definir modalidade como "Curso" para SDRs (não permite mudança)
  useEffect(() => {
    updateField('modalidadeCurso', 'Curso');
    updateField('modalidade', 'Híbrido (ITH)'); // Definir modalidade padrão para scoring
  }, [updateField]);

  useEffect(() => {
    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const courses = await fetchCoursesByModalidade('Curso');
        setAvailableCourses(courses);
      } catch (error) {
        console.error('Erro ao carregar cursos:', error);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, [fetchCoursesByModalidade]);

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
    <>
      <FormSelectField
        id="ies"
        label="IES *"
        value={formData.ies || ''}
        onChange={(value) => updateField('ies', value)}
        options={IES_OPTIONS}
        placeholder="Selecione a instituição"
      />


      <FormSelectField
        id="cursoId"
        label="Curso *"
        value={formData.cursoId || ''}
        onChange={(value) => updateField('cursoId', value)}
        options={courseOptions}
        loading={coursesLoading}
        placeholder="Selecione o curso"
      />

      <FormInputField
        id="valorContrato"
        label="Valor do Contrato"
        value={formData.valorContrato || ''}
        onChange={handleValorContratoChange}
        placeholder="R$ 0,00"
        className="text-right"
      />
    </>
  );
};

export default CourseInfoSectionSDR;