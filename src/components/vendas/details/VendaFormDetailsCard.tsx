
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCursos } from '@/hooks/useCursos';

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
  const { cursos } = useCursos();

  const formatFieldValue = (fieldName: string, value: string) => {
    // Se o campo é relacionado a curso e o valor parece ser um UUID
    if ((fieldName.includes('Curso') || fieldName.includes('cursoId')) && 
        value && value.length === 36 && value.includes('-')) {
      const curso = cursos.find(c => c.id === value);
      return curso ? curso.nome : value;
    }
    return value;
  };
  const formatFieldName = (fieldName: string) => {
    // Mapear os nomes dos campos baseado no que realmente vem do banco
    const fieldLabels: Record<string, string> = {
      // Informações Básicas
      'Data de Chegada': 'Data de Chegada do Lead',
      'Nome do Aluno': 'Nome Completo', 
      'Email do Aluno': 'Email',
      'Telefone do Aluno': 'Telefone',
      'Formação do Aluno': 'Formação Acadêmica',
      'IES': 'Instituição de Ensino Superior',
      'Vendedor': 'Vendedor Responsável',
      
      // Informações do Curso
      'Curso ID': 'Curso Selecionado',
      'Modalidade do Curso': 'Modalidade do Curso',
      'Modalidade Selecionada': 'Modalidade do Curso',
      'Turma': 'Turma',
      'Abertura': 'Abertura',
      'Lote da Pós-Graduação': 'Lote da Pós',
      'Matrícula': 'Tipo de Matrícula',
      'Data de Matrícula': 'Data de Matrícula',
      'Reembolso da Matrícula': 'Reembolso de Matrícula',
      
      // Condições Comerciais
      'Valor do Contrato': 'Valor Total do Contrato',
      'Percentual de Desconto': 'Desconto Aplicado (%)',
      'Condições de Parcelamento': 'Parcelamento',
      'Forma de Pagamento': 'Forma de Pagamento',
      'Data do Primeiro Pagamento': 'Data do 1º Pagamento',
      'Carência da Primeira Cobrança': 'Carência para 1ª Cobrança',
      'Detalhes da Carência': 'Detalhes da Carência',
      
      // Origem e Captação
      'Forma de Captação do Lead': 'Como Chegou o Lead',
      'Venda Casada': 'É Venda Casada?',
      'Indicação': 'Foi Indicado?',
      
      // Observações
      'Observações Gerais': 'Observações'
    };
    
    return fieldLabels[fieldName] || fieldName;
  };

  const groupRespostasByCategory = (respostas: RespostaFormulario[]) => {
    const categories = {
      'Informações Básicas': [
        'Formação do Aluno',
        'IES', 
        'Nome do Aluno',
        'Vendedor'
      ],
      'Informações do Curso': [
        'Abertura',
        'Curso ID',
        'Data de Matrícula',
        'Lote da Pós-Graduação',
        'Matrícula',
        'Modalidade do Curso',
        'Modalidade Selecionada',
        'Reembolso da Matrícula',
        'Turma'
      ],
      'Condições Comerciais': [
        'Carência da Primeira Cobrança',
        'Condições de Parcelamento',
        'Data do Primeiro Pagamento'
      ],
      'Origem e Captação': [
        'Forma de Captação do Lead',
        'Venda Casada',
        'Indicação'
      ],
      'Observações': [
        'Observações Gerais'
      ]
    };

    const grouped: Record<string, RespostaFormulario[]> = {};
    
    // Inicializar todas as categorias
    Object.keys(categories).forEach(category => {
      grouped[category] = [];
    });
    
    // Mapear cada resposta para a categoria correta usando o nome original do campo
    respostas.forEach(resposta => {
      let categorized = false;
      
      Object.entries(categories).forEach(([category, expectedFields]) => {
        if (expectedFields.includes(resposta.campo_nome)) {
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
    
    // Ordenar os campos dentro de cada categoria conforme a ordem definida
    Object.entries(categories).forEach(([category, expectedFields]) => {
      if (grouped[category]) {
        grouped[category].sort((a, b) => {
          const indexA = expectedFields.indexOf(a.campo_nome);
          const indexB = expectedFields.indexOf(b.campo_nome);
          return indexA - indexB;
        });
      }
    });
    
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
          {/* Forçar ordem específica das categorias */}
          {[
            'Informações Básicas',
            'Informações do Curso', 
            'Condições Comerciais',
            'Origem e Captação',
            'Observações',
            'Outras Informações'
          ].map(categoryName => {
            const categoryRespostas = groupRespostasByCategory(respostas)[categoryName] || [];
            return categoryRespostas.length > 0 && (
              <div key={categoryName}>
                <h4 className="font-medium text-gray-800 mb-2 text-sm">
                  {categoryName} ({categoryRespostas.length} campos)
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
                            {formatFieldValue(resposta.campo_nome, resposta.valor_informado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
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
