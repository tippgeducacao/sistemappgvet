
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
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">
        Detalhes do Formulário 
        <span className="text-sm font-normal text-gray-500 ml-2">
          ({respostas?.length || 0} respostas)
        </span>
      </h3>
      
      {isLoading ? (
        <div className="text-gray-500 py-4">Carregando detalhes do formulário...</div>
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
        <div className="space-y-4">
          {Object.entries(groupRespostasByCategory(respostas)).map(([category, categoryRespostas]) => 
            categoryRespostas.length > 0 && (
              <div key={category}>
                <h4 className="font-medium text-gray-800 mb-2 text-sm">
                  {category} ({categoryRespostas.length} campos)
                </h4>
                <div className="bg-gray-50 rounded border">
                  <table className="w-full text-sm">
                    <tbody>
                      {categoryRespostas.map((resposta, index) => (
                        <tr key={resposta.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-2 font-medium text-gray-700 border-r w-1/3">
                            {formatFieldName(resposta.campo_nome)}
                          </td>
                          <td className="p-2 text-gray-900">
                            {resposta.valor_informado}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="text-center py-6 bg-yellow-50 rounded border">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⚠️ Nenhum detalhe encontrado
          </h3>
          <p className="text-yellow-700 mb-2">
            Os dados do formulário não foram encontrados.
          </p>
          <button 
            onClick={onRefetch} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            🔄 Recarregar dados
          </button>
        </div>
      )}
    </div>
  );
};

export default VendaFormDetailsCard;
