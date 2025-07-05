
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormStore } from '@/store/FormStore';
import { useAuthStore } from '@/stores/AuthStore';
import BasicInfoSection from './sections/BasicInfoSection';
import CourseInfoSection from './sections/CourseInfoSection';
import PaymentConditionsSection from './sections/PaymentConditionsSection';
import IndicationSection from './sections/IndicationSection';

const LeadInfoSection: React.FC = () => {
  const { formData, updateField, setVendedor } = useFormStore();
  const { currentUser } = useAuthStore();

  // Autopreenche o campo vendedor quando o usuário está disponível
  useEffect(() => {
    if (currentUser?.name && !formData.vendedor) {
      console.log('Setting vendedor to:', currentUser.name);
      setVendedor(currentUser.name);
    }
  }, [currentUser, formData.vendedor, setVendedor]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Lead</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BasicInfoSection formData={formData} updateField={updateField} />
        <CourseInfoSection formData={formData} updateField={updateField} />
        <PaymentConditionsSection formData={formData} updateField={updateField} />
        <IndicationSection formData={formData} updateField={updateField} />
      </CardContent>
    </Card>
  );
};

export default LeadInfoSection;
