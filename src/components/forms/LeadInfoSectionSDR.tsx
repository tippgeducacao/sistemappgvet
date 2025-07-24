import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormStore } from '@/store/FormStore';
import { useAuthStore } from '@/stores/AuthStore';
import BasicInfoSection from './sections/BasicInfoSection';
import CourseInfoSectionSDR from './sections/CourseInfoSectionSDR';
import PaymentConditionsSection from './sections/PaymentConditionsSection';
import IndicationSection from './sections/IndicationSection';

const LeadInfoSectionSDR: React.FC = () => {
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
      <CardContent className="space-y-3">
        <BasicInfoSection formData={formData} updateField={updateField} />
        <CourseInfoSectionSDR formData={formData} updateField={updateField} />
        <PaymentConditionsSection formData={formData} updateField={updateField} />
        <IndicationSection formData={formData} updateField={updateField} />
      </CardContent>
    </Card>
  );
};

export default LeadInfoSectionSDR;