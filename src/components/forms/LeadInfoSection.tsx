
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormStore } from '@/store/FormStore';
import { useAuthStore } from '@/stores/AuthStore';
import { useUserRoles } from '@/hooks/useUserRoles';
import BasicInfoSection from './sections/BasicInfoSection';
import CourseInfoSection from './sections/CourseInfoSection';
import CourseInfoSectionVendedor from './sections/CourseInfoSectionVendedor';
import CourseInfoSectionSDR from './sections/CourseInfoSectionSDR';
import PaymentConditionsSection from './sections/PaymentConditionsSection';
import IndicationSection from './sections/IndicationSection';

const LeadInfoSection: React.FC = () => {
  const { formData, updateField, setVendedor } = useFormStore();
  const { currentUser } = useAuthStore();
  const { isSDR, isVendedor, isAdmin } = useUserRoles();

  // Autopreenche o campo vendedor quando o usuário está disponível
  useEffect(() => {
    if (currentUser?.name && !formData.vendedor) {
      console.log('Setting vendedor to:', currentUser.name);
      setVendedor(currentUser.name);
    }
  }, [currentUser, formData.vendedor, setVendedor]);

  // Renderizar seção de curso baseada no tipo de usuário
  const renderCourseSection = () => {
    if (isSDR) {
      return <CourseInfoSectionSDR formData={formData} updateField={updateField} />;
    } else if (isVendedor) {
      return <CourseInfoSectionVendedor formData={formData} updateField={updateField} />;
    } else if (isAdmin) {
      return <CourseInfoSection formData={formData} updateField={updateField} />;
    }
    return <CourseInfoSection formData={formData} updateField={updateField} />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Lead</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <BasicInfoSection formData={formData} updateField={updateField} />
        {renderCourseSection()}
        <PaymentConditionsSection formData={formData} updateField={updateField} />
        <IndicationSection formData={formData} updateField={updateField} />
      </CardContent>
    </Card>
  );
};

export default LeadInfoSection;
