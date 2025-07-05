
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormStore } from '@/store/FormStore';
import { useScoringPoints, getPointsForFieldValue } from '@/hooks/useScoringPoints';

const TipoVendaField: React.FC = () => {
  const { formData, updateField } = useFormStore();
  const { data: scoringRules = [], isLoading } = useScoringPoints();

  const getSelectItemPoints = (value: string) => {
    if (isLoading) return null;
    const points = getPointsForFieldValue(scoringRules, 'Tipo de Venda', value);
    if (points === 0) return null;
    return (
      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
        points > 0 ? 'bg-green-100 text-green-800' : 
        points < 0 ? 'bg-red-100 text-red-800' : 
        'bg-gray-100 text-gray-800'
      }`}>
        {points > 0 ? '+' : ''}{points} pts
      </span>
    );
  };

  const getCurrentPoints = () => {
    if (!formData.tipoVenda || isLoading) return null;
    const points = getPointsForFieldValue(scoringRules, 'Tipo de Venda', formData.tipoVenda);
    if (points === 0) return null;
    return (
      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
        points > 0 ? 'bg-green-100 text-green-800' : 
        points < 0 ? 'bg-red-100 text-red-800' : 
        'bg-gray-100 text-gray-800'
      }`}>
        {points > 0 ? '+' : ''}{points} pts
      </span>
    );
  };

  return (
    <div>
      <Label htmlFor="tipoVenda">
        Canal/Local da Venda
        {getCurrentPoints()}
      </Label>
      <Select 
        value={formData.tipoVenda} 
        onValueChange={(value) => updateField('tipoVenda', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione o canal da venda" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="LIGAÇÃO">
            <div className="flex items-center justify-between w-full">
              <span>LIGAÇÃO ⚠️</span>
              <small className="text-xs text-orange-600 ml-2">(Comprovação obrigatória)</small>
              {getSelectItemPoints('LIGAÇÃO')}
            </div>
          </SelectItem>
          <SelectItem value="LIGAÇÃO E FECHAMENTO NO WHATSAPP">
            <div className="flex items-center justify-between w-full">
              <span>LIGAÇÃO E FECHAMENTO NO WHATSAPP ⚠️</span>
              <small className="text-xs text-orange-600 ml-2">(Comprovação obrigatória)</small>
              {getSelectItemPoints('LIGAÇÃO E FECHAMENTO NO WHATSAPP')}
            </div>
          </SelectItem>
          <SelectItem value="REUNIÃO MEET">
            REUNIÃO MEET
            {getSelectItemPoints('REUNIÃO MEET')}
          </SelectItem>
          <SelectItem value="VENDA DIRETA">
            VENDA DIRETA
            {getSelectItemPoints('VENDA DIRETA')}
          </SelectItem>
          <SelectItem value="PRESENCIAL">
            PRESENCIAL
            {getSelectItemPoints('PRESENCIAL')}
          </SelectItem>
          <SelectItem value="LANÇAMENTO ( CAMPANHA )">
            LANÇAMENTO ( CAMPANHA )
            {getSelectItemPoints('LANÇAMENTO ( CAMPANHA )')}
          </SelectItem>
          <SelectItem value="EMAIL">
            EMAIL
            {getSelectItemPoints('EMAIL')}
          </SelectItem>
          <SelectItem value="OUTRO">
            OUTRO
            {getSelectItemPoints('OUTRO')}
          </SelectItem>
          <SelectItem value="WHATSAPP">
            WHATSAPP
            {getSelectItemPoints('WHATSAPP')}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TipoVendaField;
