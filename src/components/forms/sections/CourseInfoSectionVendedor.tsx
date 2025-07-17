import React, { useState, useEffect } from 'react';
import { FormSelectField, FormInputField } from '@/components/ui/form-field';
import { IES_OPTIONS } from '@/constants/formOptions';
import { useCourses } from '@/hooks/useCourses';
import { useAuthStore } from '@/stores/AuthStore';

interface CourseInfoSectionVendedorProps {
  formData: any;
  updateField: (field: string, value: string) => void;
}

const CourseInfoSectionVendedor: React.FC<CourseInfoSectionVendedorProps> = ({ formData, updateField }) => {
  const { fetchCoursesByModalidade } = useCourses();
  const { profile } = useAuthStore();
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);

  // Auto-definir modalidade como "Pós-Graduação" para vendedores
  useEffect(() => {
    updateField('modalidadeCurso', 'Pós-Graduação');
  }, [updateField]);

  useEffect(() => {
    const loadPosGraduacoes = async () => {
      setCoursesLoading(true);
      try {
        const courses = await fetchCoursesByModalidade('Pós-Graduação');
        
        // Filtrar apenas as pós-graduações que o vendedor é especialista
        const vendedorPosGraduacoes = (profile as any)?.pos_graduacoes || [];
        const filteredCourses = courses.filter(curso => 
          vendedorPosGraduacoes.includes(curso.id)
        );
        
        setAvailableCourses(filteredCourses);
      } catch (error) {
        console.error('Erro ao carregar pós-graduações:', error);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadPosGraduacoes();
  }, [fetchCoursesByModalidade, (profile as any)?.pos_graduacoes]);

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

      <div className="bg-gray-50 p-4 rounded-lg border">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Modalidade *
        </label>
        <div className="text-gray-600">
          <span className="font-medium">Pós-Graduação</span>
          <p className="text-xs text-gray-500 mt-1">
            Vendedores podem vender apenas pós-graduações em que são especialistas
          </p>
        </div>
      </div>

      <FormSelectField
        id="cursoId"
        label="Pós-Graduação *"
        value={formData.cursoId || ''}
        onChange={(value) => updateField('cursoId', value)}
        options={courseOptions}
        loading={coursesLoading}
        placeholder={availableCourses.length === 0 ? "Nenhuma pós-graduação disponível" : "Selecione a pós-graduação"}
        disabled={availableCourses.length === 0}
      />

      {availableCourses.length === 0 && !coursesLoading && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-orange-700 text-sm">
            Você não possui especialização em nenhuma pós-graduação. Entre em contato com a administração para definir suas especializações.
          </p>
        </div>
      )}

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

export default CourseInfoSectionVendedor;