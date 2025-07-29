
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
      'dataChegada': 'Data de Chegada do Lead',
      'Nome do Aluno': 'Nome Completo',
      'nomeAluno': 'Nome Completo',
      'Email do Aluno': 'Email',
      'emailAluno': 'Email',
      'Telefone do Aluno': 'Telefone',
      'telefone': 'Telefone',
      'CRMV': 'Número do CRMV',
      'crmv': 'Número do CRMV',
      'Formação do Aluno': 'Formação Acadêmica',
      'formacaoAluno': 'Formação Acadêmica',
      'Data de Matrícula': 'Data de Matrícula',
      'dataMatricula': 'Data de Matrícula',
      'IES': 'Instituição de Ensino Superior',
      'ies': 'Instituição de Ensino Superior',
      'Vendedor': 'Vendedor Responsável',
      'vendedor': 'Vendedor Responsável',
      'Curso ID': 'Curso Selecionado',
      'cursoId': 'Curso Selecionado',
      'Modalidade Selecionada': 'Modalidade do Curso',
      'modalidadeCurso': 'Modalidade do Curso',
      'modalidade': 'Modalidade do Curso',
      'Turma': 'Turma',
      'turma': 'Turma',
      'Abertura': 'Abertura',
      'abertura': 'Abertura',
      'Valor do Contrato': 'Valor Total do Contrato',
      'valorContrato': 'Valor Total do Contrato',
      'Percentual de Desconto': 'Desconto Aplicado (%)',
      'percentualDesconto': 'Desconto Aplicado (%)',
      'Data do Primeiro Pagamento': 'Data do 1º Pagamento',
      'dataPrimeiroPagamento': 'Data do 1º Pagamento',
      'Carência da Primeira Cobrança': 'Carência para 1ª Cobrança',
      'carenciaPrimeiraCobranca': 'Carência para 1ª Cobrança',
      'Detalhes da Carência': 'Detalhes da Carência',
      'detalhesCarencia': 'Detalhes da Carência',
      'Reembolso da Matrícula': 'Reembolso de Matrícula',
      'reembolsoMatricula': 'Reembolso de Matrícula',
      'Indicação': 'Foi Indicado?',
      'indicacao': 'Foi Indicado?',
      'Nome do Indicador': 'Nome de Quem Indicou',
      'nomeIndicador': 'Nome de Quem Indicou',
      'Lote da Pós-Graduação': 'Lote da Pós',
      'lotePos': 'Lote da Pós',
      'Matrícula': 'Tipo de Matrícula',
      'matricula': 'Tipo de Matrícula',
      'Condições de Parcelamento': 'Parcelamento',
      'parcelamento': 'Parcelamento',
      'Forma de Pagamento': 'Forma de Pagamento',
      'pagamento': 'Forma de Pagamento',
      'Forma de Captação do Lead': 'Como Chegou o Lead',
      'formaCaptacao': 'Como Chegou o Lead',
      'Tipo de Venda': 'Tipo da Venda',
      'tipoVenda': 'Tipo da Venda',
      'Venda Casada': 'É Venda Casada?',
      'vendaCasada': 'É Venda Casada?',
      'Detalhes da Venda Casada': 'Detalhes da Venda Casada',
      'detalhesVendaCasada': 'Detalhes da Venda Casada',
      'Observações Gerais': 'Observações',
      'observacoes': 'Observações',
    };
    
    return fieldLabels[fieldName] || fieldName;
  };

  const groupRespostasByCategory = (respostas: RespostaFormulario[]) => {
    console.log('📊 Agrupando respostas por categoria:', respostas.length, 'respostas');
    
    const categories = {
      'Informações Básicas': [
        'Data de Chegada', 'dataChegada', 'Nome do Aluno', 'nomeAluno', 'Email do Aluno', 'emailAluno', 
        'Telefone do Aluno', 'telefone', 'Formação do Aluno', 'formacaoAluno', 'Data de Matrícula', 
        'dataMatricula', 'IES', 'ies', 'Vendedor', 'vendedor', 'CRMV', 'crmv'
      ],
      'Informações do Curso': [
        'Curso ID', 'cursoId', 'Modalidade do Curso', 'modalidadeCurso', 'modalidade', 'Modalidade Selecionada', 
        'Lote da Pós-Graduação', 'lotePos', 'Matrícula', 'matricula', 'Turma', 'turma', 'Abertura', 'abertura'
      ],
      'Condições Comerciais': [
        'Valor do Contrato', 'valorContrato', 'Percentual de Desconto', 'percentualDesconto', 
        'Data do Primeiro Pagamento', 'dataPrimeiroPagamento', 'Carência da Primeira Cobrança', 
        'carenciaPrimeiraCobranca', 'Detalhes da Carência', 'detalhesCarencia', 'Reembolso da Matrícula', 
        'reembolsoMatricula', 'Condições de Parcelamento', 'parcelamento', 'Forma de Pagamento', 'pagamento'
      ],
      'Origem e Captação': [
        'Forma de Captação do Lead', 'formaCaptacao', 'Tipo de Venda', 'tipoVenda', 'Venda Casada', 
        'vendaCasada', 'Indicação', 'indicacao', 'Nome do Indicador', 'nomeIndicador', 
        'Detalhes da Venda Casada', 'detalhesVendaCasada'
      ],
      'Observações': [
        'Observações Gerais', 'observacoes'
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
