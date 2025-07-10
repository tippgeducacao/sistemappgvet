
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RespostaFormulario {
  id: string;
  campo_nome: string;
  valor_informado: string;
  form_entry_id: string;
}

interface VendaFormDetailsCardProps {
  respostas: RespostaFormulario[] | undefined;
  isLoading: boolean;
  error: any;
  vendaId: string;
  onRefetch: () => void;
}

const VendaFormDetailsCard: React.FC<VendaFormDetailsCardProps> = ({
  respostas,
  isLoading,
  error,
  vendaId,
  onRefetch
}) => {
  const formatFieldName = (fieldName: string) => {
    const fieldLabels: Record<string, string> = {
      'Data de Chegada': 'Data de Chegada do Lead',
      'Nome do Aluno': 'Nome Completo',
      'Email do Aluno': 'Email',
      'Telefone do Aluno': 'Telefone',
      'CRMV': 'Número do CRMV',
      'Formação do Aluno': 'Formação Acadêmica',
      'Data de Matrícula': 'Data de Matrícula',
      'IES': 'Instituição de Ensino Superior',
      'Vendedor': 'Vendedor Responsável',
      'Curso ID': 'Curso Selecionado',
      'Modalidade Selecionada': 'Modalidade do Curso',
      'Valor do Contrato': 'Valor Total do Contrato',
      'Percentual de Desconto': 'Desconto Aplicado (%)',
      'Data do Primeiro Pagamento': 'Data do 1º Pagamento',
      'Carência da Primeira Cobrança': 'Carência para 1ª Cobrança',
      'Detalhes da Carência': 'Detalhes da Carência',
      'Reembolso da Matrícula': 'Reembolso de Matrícula',
      'Indicação': 'Foi Indicado?',
      'Nome do Indicador': 'Nome de Quem Indicou',
      'Lote da Pós-Graduação': 'Lote da Pós',
      'Matrícula': 'Número da Matrícula',
      'Modalidade do Curso': 'Modalidade',
      'Condições de Parcelamento': 'Parcelamento',
      'Forma de Pagamento': 'Forma de Pagamento',
      'Forma de Captação do Lead': 'Como Chegou o Lead',
      'Tipo de Venda': 'Tipo da Venda',
      'Venda Casada': 'É Venda Casada?',
      'Detalhes da Venda Casada': 'Detalhes da Venda Casada',
      'Observações Gerais': 'Observações',
    };
    
    return fieldLabels[fieldName] || fieldName;
  };

  const groupRespostasByCategory = (respostas: RespostaFormulario[]) => {
    console.log('📊 Agrupando respostas por categoria:', respostas.length, 'respostas');
    
    const categories = {
      'Informações Básicas': [
        'Data de Chegada', 'Nome do Aluno', 'Email do Aluno', 'Telefone do Aluno',
        'Formação do Aluno', 'Data de Matrícula', 'IES', 'Vendedor', 'CRMV'
      ],
      'Informações do Curso': [
        'Curso ID', 'Modalidade do Curso', 'Modalidade Selecionada', 'Lote da Pós-Graduação', 'Matrícula'
      ],
      'Condições Comerciais': [
        'Valor do Contrato', 'Percentual de Desconto', 'Data do Primeiro Pagamento',
        'Carência da Primeira Cobrança', 'Detalhes da Carência', 'Reembolso da Matrícula', 
        'Condições de Parcelamento', 'Forma de Pagamento'
      ],
      'Origem e Captação': [
        'Forma de Captação do Lead', 'Tipo de Venda', 'Venda Casada',
        'Indicação', 'Nome do Indicador', 'Detalhes da Venda Casada'
      ],
      'Observações': [
        'Observações Gerais'
      ]
    };

    const grouped: Record<string, RespostaFormulario[]> = {};
    
    Object.keys(categories).forEach(category => {
      grouped[category] = [];
    });
    
    respostas.forEach(resposta => {
      let categorized = false;
      
      Object.entries(categories).forEach(([category, fields]) => {
        if (fields.some(field => 
          resposta.campo_nome.includes(field) || 
          field.includes(resposta.campo_nome) ||
          resposta.campo_nome === field
        )) {
          grouped[category].push(resposta);
          categorized = true;
        }
      });
      
      if (!categorized) {
        if (!grouped['Outras Informações']) {
          grouped['Outras Informações'] = [];
        }
        grouped['Outras Informações'].push(resposta);
      }
    });

    console.log('📊 Respostas agrupadas:', Object.entries(grouped).map(([cat, items]) => `${cat}: ${items.length}`));
    return grouped;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Detalhes do Formulário
          <span className="text-sm font-normal text-gray-500">
            {isLoading ? 'Carregando...' : `${respostas?.length || 0} respostas`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Carregando detalhes do formulário...</div>
          </div>
        ) : error ? (
          <div className="text-red-500 py-4">
            <p>Erro ao carregar detalhes: {error.message}</p>
            <button 
              onClick={onRefetch} 
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Tentar novamente
            </button>
          </div>
        ) : respostas && respostas.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupRespostasByCategory(respostas)).map(([category, categoryRespostas]) => 
              categoryRespostas.length > 0 && (
                <div key={category} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2 bg-white px-2 py-1 rounded">
                    {category} ({categoryRespostas.length} campos)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryRespostas.map((resposta) => (
                      <div key={resposta.id} className="space-y-1 bg-white p-3 rounded border">
                        <span className="font-medium text-gray-700 text-sm block">
                          {formatFieldName(resposta.campo_nome)}:
                        </span>
                        <p className="text-gray-900 bg-blue-50 p-2 rounded border text-sm">
                          {resposta.valor_informado}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-yellow-50 rounded border">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ Nenhum detalhe do formulário encontrado
            </h3>
            <p className="text-yellow-700 mb-2">
              Os dados do formulário não foram salvos ou não estão sendo encontrados.
            </p>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p><strong>Form Entry ID:</strong> {vendaId}</p>
            </div>
            <button 
              onClick={onRefetch} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🔄 Recarregar dados
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendaFormDetailsCard;
