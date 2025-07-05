
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFormStore } from '@/store/FormStore';
import { useScoringPoints, getPointsForFieldValue } from '@/hooks/useScoringPoints';
import TipoVendaField from './fields/TipoVendaField';

const ScoringRulesSection: React.FC = () => {
  const { formData, updateField } = useFormStore();
  const { data: scoringRules = [], isLoading } = useScoringPoints();

  console.log('🔧 ScoringRulesSection renderizando...');
  console.log('📊 Regras carregadas:', scoringRules.length);
  console.log('⏳ Carregando:', isLoading);

  const getFieldPoints = (fieldName: string, value: string) => {
    if (!value || isLoading) return null;
    const points = getPointsForFieldValue(scoringRules, fieldName, value);
    return points !== 0 ? points : 0; // Retorna 0 mesmo para campos sem pontuação
  };

  const renderPointsBadge = (points: number | null) => {
    if (points === null || isLoading) return null;
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

  const getSelectItemPoints = (fieldName: string, value: string) => {
    if (isLoading) return null;
    const points = getPointsForFieldValue(scoringRules, fieldName, value);
    return renderPointsBadge(points !== 0 ? points : 0);
  };

  // Função específica para venda casada que busca nas regras do banco
  const getVendaCasadaPoints = (value: string) => {
    if (isLoading) return null;
    
    console.log(`🔍 Buscando pontos para Venda Casada = "${value}"`);
    const points = getPointsForFieldValue(scoringRules, 'Venda Casada', value);
    console.log(`🎯 Pontos encontrados para Venda Casada "${value}": ${points}`);
    
    return renderPointsBadge(points);
  };

  const getCurrentVendaCasadaPoints = () => {
    if (!formData.vendaCasada || isLoading) return null;
    return getVendaCasadaPoints(formData.vendaCasada);
  };

  // Valores das matrículas
  const getMatriculaValue = (tipo: string) => {
    const valores = {
      'Matrícula integral': 'R$ 492,50',
      'Matrícula com cupom 60%': 'R$ 197,00',
      'Matrícula com cupom 80%': 'R$ 98,00',
      'Matrícula com cupom 100%': 'R$ 0,00'
    };
    return valores[tipo as keyof typeof valores] || '';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regras de Pontuação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando regras de pontuação...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de Pontuação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lotePos">
              Lote da Pós-Graduação
              {renderPointsBadge(getFieldPoints('Lote da Pós-Graduação', formData.lotePos))}
            </Label>
            <Select value={formData.lotePos} onValueChange={(value) => updateField('lotePos', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o lote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lote Integral">
                  Lote Integral
                  {getSelectItemPoints('Lote da Pós-Graduação', 'Lote Integral')}
                </SelectItem>
                <SelectItem value="Lote 3">
                  Lote 3
                  {getSelectItemPoints('Lote da Pós-Graduação', 'Lote 3')}
                </SelectItem>
                <SelectItem value="Lote 2">
                  Lote 2
                  {getSelectItemPoints('Lote da Pós-Graduação', 'Lote 2')}
                </SelectItem>
                <SelectItem value="Lote 1">
                  Lote 1
                  {getSelectItemPoints('Lote da Pós-Graduação', 'Lote 1')}
                </SelectItem>
                <SelectItem value="Condições especiais">
                  Condições especiais
                  {getSelectItemPoints('Lote da Pós-Graduação', 'Condições especiais')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="matricula">
              Matrícula
              {renderPointsBadge(getFieldPoints('Matrícula', formData.matricula))}
            </Label>
            <Select value={formData.matricula} onValueChange={(value) => updateField('matricula', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de matrícula" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Matrícula integral">
                  <div className="flex items-center justify-between w-full">
                    <span>Matrícula integral</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-medium">{getMatriculaValue('Matrícula integral')}</span>
                      {getSelectItemPoints('Matrícula', 'Matrícula integral')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="Matrícula com cupom 60%">
                  <div className="flex items-center justify-between w-full">
                    <span>Matrícula com cupom 60%</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-medium">{getMatriculaValue('Matrícula com cupom 60%')}</span>
                      {getSelectItemPoints('Matrícula', 'Matrícula com cupom 60%')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="Matrícula com cupom 80%">
                  <div className="flex items-center justify-between w-full">
                    <span>Matrícula com cupom 80%</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-medium">{getMatriculaValue('Matrícula com cupom 80%')}</span>
                      {getSelectItemPoints('Matrícula', 'Matrícula com cupom 80%')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="Matrícula com cupom 100%">
                  <div className="flex items-center justify-between w-full">
                    <span>Matrícula com cupom 100%</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-medium">{getMatriculaValue('Matrícula com cupom 100%')}</span>
                      {getSelectItemPoints('Matrícula', 'Matrícula com cupom 100%')}
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="modalidade">
              Modalidade do Curso
              {renderPointsBadge(getFieldPoints('Modalidade do Curso', formData.modalidade))}
            </Label>
            <Select value={formData.modalidade} onValueChange={(value) => updateField('modalidade', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Híbrido (ITH)">
                  Híbrido (ITH)
                  {getSelectItemPoints('Modalidade do Curso', 'Híbrido (ITH)')}
                </SelectItem>
                <SelectItem value="Online (ITH)">
                  Online (ITH)
                  {getSelectItemPoints('Modalidade do Curso', 'Online (ITH)')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="parcelamento">
              Condições de Parcelamento
              {renderPointsBadge(getFieldPoints('Condições de Parcelamento', formData.parcelamento))}
            </Label>
            <Select value={formData.parcelamento} onValueChange={(value) => updateField('parcelamento', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o parcelamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="À vista">
                  À vista
                  {getSelectItemPoints('Condições de Parcelamento', 'À vista')}
                </SelectItem>
                <SelectItem value="12x">
                  12x
                  {getSelectItemPoints('Condições de Parcelamento', '12x')}
                </SelectItem>
                <SelectItem value="18x">
                  18x
                  {getSelectItemPoints('Condições de Parcelamento', '18x')}
                </SelectItem>
                <SelectItem value="24x">
                  24x
                  {getSelectItemPoints('Condições de Parcelamento', '24x')}
                </SelectItem>
                <SelectItem value="30x">
                  30x
                  {getSelectItemPoints('Condições de Parcelamento', '30x')}
                </SelectItem>
                <SelectItem value="36x">
                  36x
                  {getSelectItemPoints('Condições de Parcelamento', '36x')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pagamento">
              Forma de Pagamento
              {renderPointsBadge(getFieldPoints('Forma de Pagamento', formData.pagamento))}
            </Label>
            <Select value={formData.pagamento} onValueChange={(value) => updateField('pagamento', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cartão de crédito - limite total ou PIX">
                  Cartão de crédito - limite total ou PIX
                  {getSelectItemPoints('Forma de Pagamento', 'Cartão de crédito - limite total ou PIX')}
                </SelectItem>
                <SelectItem value="Boleto bancário">
                  Boleto bancário
                  {getSelectItemPoints('Forma de Pagamento', 'Boleto bancário')}
                </SelectItem>
                <SelectItem value="Recorrência">
                  Recorrência
                  {getSelectItemPoints('Forma de Pagamento', 'Recorrência')}
                </SelectItem>
                <SelectItem value="Boleto 1x até 30 dias">
                  Boleto 1x até 30 dias
                  {getSelectItemPoints('Forma de Pagamento', 'Boleto 1x até 30 dias')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="formaCaptacao">
              Forma de Captação do Lead
              {renderPointsBadge(getFieldPoints('Forma de Captação do Lead', formData.formaCaptacao))}
            </Label>
            <Select value={formData.formaCaptacao} onValueChange={(value) => updateField('formaCaptacao', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Como chegou o lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDICAÇÃO">
                  INDICAÇÃO
                  {getSelectItemPoints('Forma de Captação do Lead', 'INDICAÇÃO')}
                </SelectItem>
                <SelectItem value="ORGÂNICO">
                  ORGÂNICO
                  {getSelectItemPoints('Forma de Captação do Lead', 'ORGÂNICO')}
                </SelectItem>
                <SelectItem value="GOOGLE">
                  GOOGLE
                  {getSelectItemPoints('Forma de Captação do Lead', 'GOOGLE')}
                </SelectItem>
                <SelectItem value="META ADS">
                  META ADS
                  {getSelectItemPoints('Forma de Captação do Lead', 'META ADS')}
                </SelectItem>
                <SelectItem value="LINKEDIN">
                  LINKEDIN
                  {getSelectItemPoints('Forma de Captação do Lead', 'LINKEDIN')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TipoVendaField />

          <div className="space-y-3">
            <div>
              <Label htmlFor="vendaCasada">
                Venda Casada *
                {getCurrentVendaCasadaPoints()}
              </Label>
              <Select 
                value={formData.vendaCasada} 
                onValueChange={(value) => {
                  console.log(`🔄 Alterando Venda Casada para: "${value}"`);
                  updateField('vendaCasada', value);
                  // Limpar detalhes quando mudar para NÃO
                  if (value === 'NAO') {
                    updateField('detalhesVendaCasada', '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="É venda casada?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">
                    SIM
                    {getVendaCasadaPoints('SIM')}
                  </SelectItem>
                  <SelectItem value="NAO">
                    NÃO
                    {getVendaCasadaPoints('NAO')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.vendaCasada === 'SIM' && (
              <div>
                <Label htmlFor="detalhesVendaCasada">
                  Detalhes da Venda Casada *
                </Label>
                <Textarea
                  id="detalhesVendaCasada"
                  value={formData.detalhesVendaCasada}
                  onChange={(e) => updateField('detalhesVendaCasada', e.target.value)}
                  placeholder="Descreva os detalhes da venda casada..."
                  className="min-h-[80px]"
                  required={formData.vendaCasada === 'SIM'}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoringRulesSection;
