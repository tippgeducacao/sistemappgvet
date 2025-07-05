
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Upload, FileText } from 'lucide-react';
import { useFormStore } from '@/store/FormStore';
import { useScoringPoints, getPointsForFieldValue } from '@/hooks/useScoringPoints';

const TipoVendaField: React.FC = () => {
  const { formData, updateField } = useFormStore();
  const { data: scoringRules = [], isLoading } = useScoringPoints();
  
  const tiposQueRequeremComprovacao = ['LIGAÇÃO', 'LIGAÇÃO E FECHAMENTO NO WHATSAPP'];
  const requerComprovacao = tiposQueRequeremComprovacao.includes(formData.tipoVenda);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    updateField('documentoComprobatorio', file);
  };

  const getAlertMessage = (tipo: string) => {
    const messages = {
      'LIGAÇÃO': 'Para ligação é obrigatório anexar print do histórico de chamadas ou registro da ligação.',
      'LIGAÇÃO E FECHAMENTO NO WHATSAPP': 'Para ligação e fechamento no WhatsApp é obrigatório anexar print do histórico de chamadas ou registro da ligação.'
    };
    return messages[tipo as keyof typeof messages] || '';
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

  const getSelectItemPoints = (value: string) => {
    if (isLoading) return null;
    
    console.log(`🔍 TipoVendaField: Buscando pontos para valor "${value}"`);
    console.log(`📊 TipoVendaField: Regras disponíveis:`, scoringRules.length);
    
    // Usar o nome correto do campo como está na base de dados
    const fieldName = 'Canal/Local da Venda';
    console.log(`🎯 TipoVendaField: Usando campo "${fieldName}"`);
    
    const points = getPointsForFieldValue(scoringRules, fieldName, value);
    console.log(`🎯 TipoVendaField: Pontos encontrados para "${value}": ${points}`);
    
    return renderPointsBadge(points);
  };

  const getCurrentFieldPoints = () => {
    if (!formData.tipoVenda || isLoading) return null;
    
    console.log(`🔍 TipoVendaField: Campo atual selecionado: "${formData.tipoVenda}"`);
    
    // Usar o nome correto do campo como está na base de dados
    const fieldName = 'Canal/Local da Venda';
    const points = getPointsForFieldValue(scoringRules, fieldName, formData.tipoVenda);
    console.log(`🎯 TipoVendaField: Pontos do campo atual: ${points}`);
    
    return renderPointsBadge(points);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="tipoVenda">
          Tipo de Venda *
          {getCurrentFieldPoints()}
        </Label>
        <Select 
          value={formData.tipoVenda} 
          onValueChange={(value) => {
            console.log(`🔄 TipoVendaField: Mudando valor para "${value}"`);
            updateField('tipoVenda', value);
            // Limpar documento quando mudar para tipo que não requer comprovação
            if (!tiposQueRequeremComprovacao.includes(value)) {
              updateField('documentoComprobatorio', null);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de venda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REUNIÃO MEET" className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <span>REUNIÃO MEET</span>
                {getSelectItemPoints('REUNIÃO MEET')}
              </div>
            </SelectItem>
            <SelectItem value="LIGAÇÃO" className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <span>LIGAÇÃO</span>
                <span className="text-red-600 ml-1">(Comprovação obrigatória)</span>
                {getSelectItemPoints('LIGAÇÃO')}
              </div>
            </SelectItem>
            <SelectItem value="LIGAÇÃO E FECHAMENTO NO WHATSAPP" className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <span>LIGAÇÃO E FECHAMENTO NO WHATSAPP</span>
                <span className="text-red-600 ml-1">(Comprovação obrigatória)</span>
                {getSelectItemPoints('LIGAÇÃO E FECHAMENTO NO WHATSAPP')}
              </div>
            </SelectItem>
            <SelectItem value="WHATSAPP" className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <span>WHATSAPP</span>
                {getSelectItemPoints('WHATSAPP')}
              </div>
            </SelectItem>
            <SelectItem value="LANÇAMENTO ( CAMPANHA )" className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <span>LANÇAMENTO ( CAMPANHA )</span>
                {getSelectItemPoints('LANÇAMENTO ( CAMPANHA )')}
              </div>
            </SelectItem>
            <SelectItem value="VENDA DIRETA" className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <span>VENDA DIRETA</span>
                {getSelectItemPoints('VENDA DIRETA')}
              </div>
            </SelectItem>
            <SelectItem value="PRESENCIAL" className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <span>PRESENCIAL</span>
                {getSelectItemPoints('PRESENCIAL')}
              </div>
            </SelectItem>
            <SelectItem value="EMAIL" className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <span>EMAIL</span>
                {getSelectItemPoints('EMAIL')}
              </div>
            </SelectItem>
            <SelectItem value="OUTRO" className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <span>OUTRO</span>
                {getSelectItemPoints('OUTRO')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {requerComprovacao && (
        <div className="space-y-3">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>COMPROVAÇÃO OBRIGATÓRIA:</strong> {getAlertMessage(formData.tipoVenda)}
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="documentoComprobatorio" className="text-red-700 font-medium">
              Documento Comprobatório * 
              <span className="text-sm text-gray-600 ml-2">
                (Aceitos: PDF, JPG, PNG, até 10MB)
              </span>
            </Label>
            <div className="mt-2">
              <Input
                id="documentoComprobatorio"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="border-red-200 focus:border-red-500"
                required={requerComprovacao}
              />
            </div>
            
            {formData.documentoComprobatorio && (
              <div className="mt-2 flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                <FileText className="h-4 w-4" />
                <span className="text-sm">
                  Arquivo selecionado: {formData.documentoComprobatorio.name} 
                  ({(formData.documentoComprobatorio.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            {requerComprovacao && !formData.documentoComprobatorio && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <Upload className="h-4 w-4" />
                <span>Selecione um arquivo para comprovar este tipo de venda</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TipoVendaField;
