import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';
import VendaFieldValidator from './VendaFieldValidator';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import { useToast } from '@/hooks/use-toast';
interface FormDetailsResponse {
  id: string;
  campo_nome: string;
  valor_informado: string;
  form_entry_id: string;
  tick_status?: 'pendente' | 'aprovado' | 'rejeitado';
  observacao_validacao?: string;
}
interface VendaFieldValidationCardProps {
  respostas: FormDetailsResponse[] | undefined;
  isLoading: boolean;
  error: any;
  vendaId: string;
  onSaveValidations: (validations: any[]) => void;
  isSaving?: boolean;
}

// Campos que têm pontuação definida
const CAMPOS_COM_PONTUACAO = ['Modalidade', 'Parcelamento', 'Forma de Pagamento', 'Forma de Captação', 'Tipo de Venda', 'Venda Casada'];

// Pontuações hardcoded para alguns campos
const getPontuacaoHardcoded = (campo: string, valor: string): number => {
  switch (campo) {
    case 'Tipo de Venda':
      if (valor === 'LIGAÇÃO') return 0.3;
      if (valor === 'WHATSAPP') return -0.3;
      return 0;
    case 'Venda Casada':
      if (valor === 'SIM') return 0.3;
      return 0;
    default:
      return 0;
  }
};
const VendaFieldValidationCard: React.FC<VendaFieldValidationCardProps> = ({
  respostas,
  isLoading,
  error,
  vendaId,
  onSaveValidations,
  isSaving = false
}) => {
  const {
    toast
  } = useToast();
  const [validations, setValidations] = useState<Record<string, {
    status: 'aprovado' | 'rejeitado';
    observacao?: string;
  }>>({});
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle className="text-lg">Validação de Campos com Pontuação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando campos...</span>
          </div>
        </CardContent>
      </Card>;
  }
  if (error || !respostas) {
    return <Card>
        <CardHeader>
          <CardTitle className="text-lg">Validação de Campos com Pontuação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            Erro ao carregar campos para validação
          </p>
        </CardContent>
      </Card>;
  }

  // Filtrar apenas campos que têm pontuação
  const camposComPontuacao = respostas.filter(r => CAMPOS_COM_PONTUACAO.includes(r.campo_nome));
  const handleStatusChange = (campo: string, status: 'aprovado' | 'rejeitado', observacao?: string) => {
    setValidations(prev => ({
      ...prev,
      [campo]: {
        status,
        observacao
      }
    }));
  };
  const handleSaveAll = () => {
    const validationsList = Object.entries(validations).map(([campo, validation]) => ({
      campo,
      ...validation
    }));
    onSaveValidations(validationsList);
  };
  const totalPontosAprovados = camposComPontuacao.filter(campo => validations[campo.campo_nome]?.status === 'aprovado').reduce((total, campo) => {
    const pontosHardcoded = getPontuacaoHardcoded(campo.campo_nome, campo.valor_informado);
    // Aqui você poderia buscar pontos das regras de pontuação também
    return total + pontosHardcoded;
  }, 0);
  if (camposComPontuacao.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle className="text-lg">Validação de Campos com Pontuação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            Nenhum campo com pontuação encontrado para esta venda
          </p>
        </CardContent>
      </Card>;
  }
  return <Card>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {camposComPontuacao.map(campo => <VendaFieldValidator key={campo.id} campo={campo.campo_nome} valor={campo.valor_informado} pontos={getPontuacaoHardcoded(campo.campo_nome, campo.valor_informado)} status={campo.tick_status || validations[campo.campo_nome]?.status} observacao={campo.observacao_validacao || validations[campo.campo_nome]?.observacao} onStatusChange={handleStatusChange} />)}
        </div>

        {Object.keys(validations).length > 0 && <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Resumo das Validações Pendentes:</h4>
            <div className="space-y-1">
              {Object.entries(validations).map(([campo, validation]) => <div key={campo} className="text-sm text-blue-700">
                  <span className="font-medium">{campo}:</span>{' '}
                  <span className={validation.status === 'aprovado' ? 'text-green-600' : 'text-red-600'}>
                    {validation.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                  </span>
                  {validation.observacao && <span className="text-gray-600"> - {validation.observacao}</span>}
                </div>)}
            </div>
          </div>}
      </CardContent>
    </Card>;
};
export default VendaFieldValidationCard;