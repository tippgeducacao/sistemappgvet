
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFormStore } from '@/store/FormStore';
import { useAuthStore } from '@/stores/AuthStore';
import { FormPersistenceService } from '@/services/form/FormPersistenceService';
import { VendasDataService } from '@/services/vendas/VendasDataService';
import { useFormDetails } from '@/hooks/useFormDetails';
import LeadInfoSection from './forms/LeadInfoSection';
import ScoringRulesSection from './forms/ScoringRulesSection';
import ObservationsSection from './forms/ObservationsSection';
import FormProgressBar from './forms/FormProgressBar';

interface NovaVendaFormProps {
  onCancel: () => void;
  editId?: string | null;
}

const NovaVendaForm: React.FC<NovaVendaFormProps> = ({ onCancel, editId }) => {
  const { toast } = useToast();
  const { 
    formData, 
    isSubmitting, 
    setIsSubmitting, 
    clearForm,
    updateField,
    setVendedor
  } = useFormStore();
  const { currentUser } = useAuthStore();
  
  // Buscar detalhes do formulário para edição
  const { data: formDetails } = useFormDetails(editId);

  // Estado para armazenar o motivo da pendência
  const [motivoPendencia, setMotivoPendencia] = React.useState<string>('');
  const [dadosCarregados, setDadosCarregados] = React.useState<boolean>(false);

  // Definir vendedor no formulário quando o usuário estiver logado
  useEffect(() => {
    if (currentUser?.id && !formData.vendedor) {
      console.log('🔧 Definindo vendedor no formulário:', currentUser.name || currentUser.email);
      setVendedor(currentUser.name || currentUser.email);
    }
  }, [currentUser, formData.vendedor, setVendedor]);

  // Carregar dados da venda para edição
  useEffect(() => {
    const loadVendaForEdit = async () => {
      if (!editId || !currentUser?.id || dadosCarregados) return;

      try {
        console.log('🔄 Carregando venda para edição:', editId);
        
        // Buscar a venda completa
        const vendas = await VendasDataService.getVendasByVendedor(currentUser.id);
        const venda = vendas.find(v => v.id === editId);
        
        if (!venda) {
          toast({
            variant: "destructive",
            title: "Venda não encontrada",
            description: "A venda que você está tentando editar não foi encontrada."
          });
          onCancel();
          return;
        }

        if (venda.status !== 'desistiu') {
          toast({
            variant: "destructive",
            title: "Edição não permitida",
            description: "Apenas vendas rejeitadas podem ser editadas."
          });
          onCancel();
          return;
        }

        // Armazenar motivo da pendência para destacar
        if (venda.motivo_pendencia) {
          setMotivoPendencia(venda.motivo_pendencia);
        }

        // Carregar dados básicos da venda
        if (venda.aluno) {
          updateField('nomeAluno', venda.aluno.nome);
          updateField('emailAluno', venda.aluno.email);
          if (venda.aluno.telefone) updateField('telefone', venda.aluno.telefone);
          if (venda.aluno.crmv) updateField('crmv', venda.aluno.crmv);
        }
        
        if (venda.curso_id) {
          updateField('cursoId', venda.curso_id);
        }
        
        if (venda.observacoes) {
          updateField('observacoes', venda.observacoes);
        }

        // Carregar dados do formulário se disponíveis
        if (formDetails && formDetails.length > 0) {
          formDetails.forEach(resposta => {
            const campo = resposta.campo_nome;
            const valor = resposta.valor_informado;

            // Mapear campos do formulário para os campos do store
            switch (campo) {
              case 'Data de Chegada':
                updateField('dataChegada', valor);
                break;
              case 'Formação do Aluno':
                updateField('formacaoAluno', valor);
                break;
              case 'IES':
                updateField('ies', valor);
                break;
              case 'Telefone do Aluno':
                updateField('telefone', valor);
                break;
              case 'CRMV':
                updateField('crmv', valor);
                break;
              case 'Valor do Contrato':
                updateField('valorContrato', valor);
                break;
              case 'Percentual de Desconto':
                updateField('percentualDesconto', valor);
                break;
              case 'Data do Primeiro Pagamento':
                updateField('dataPrimeiroPagamento', valor);
                break;
              case 'Carência da Primeira Cobrança':
                updateField('carenciaPrimeiraCobranca', valor);
                break;
              case 'Detalhes da Carência':
                updateField('detalhesCarencia', valor);
                break;
              case 'Reembolso da Matrícula':
                updateField('reembolsoMatricula', valor);
                break;
              case 'Indicação':
                updateField('indicacao', valor);
                break;
              case 'Nome do Indicador':
                updateField('nomeIndicador', valor);
                break;
              case 'Lote da Pós-Graduação':
                updateField('lotePos', valor);
                break;
              case 'Matrícula':
                updateField('matricula', valor);
                break;
              case 'Modalidade do Curso':
                updateField('modalidade', valor);
                break;
              case 'Condições de Parcelamento':
                updateField('parcelamento', valor);
                break;
              case 'Forma de Pagamento':
                updateField('pagamento', valor);
                break;
              case 'Forma de Captação do Lead':
                updateField('formaCaptacao', valor);
                break;
              case 'Tipo de Venda':
                updateField('tipoVenda', valor);
                break;
              case 'Venda Casada':
                updateField('vendaCasada', valor);
                break;
              case 'Detalhes da Venda Casada':
                updateField('detalhesVendaCasada', valor);
                break;
            }
          });
        }

        setDadosCarregados(true);

        toast({
          title: "Venda carregada para edição",
          description: "Os dados da venda foram carregados. Faça as correções necessárias e reenvie."
        });

      } catch (error) {
        console.error('Erro ao carregar venda para edição:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar venda",
          description: "Não foi possível carregar os dados da venda para edição."
        });
        onCancel();
      }
    };

    loadVendaForEdit();
  }, [editId, currentUser?.id, formDetails, updateField, toast, onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Usuário não autenticado. Faça login novamente."
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Iniciando submissão do formulário:', formData);
      console.log('👤 Vendedor ID:', currentUser.id);

      // Salvar dados no banco usando o serviço de persistência
      const formEntryId = await FormPersistenceService.saveFormData({
        formData,
        vendedorId: currentUser.id
      });

      console.log('✅ Formulário salvo com sucesso:', formEntryId);

      const isEdit = !!editId;
      toast({
        title: isEdit ? "Venda reenviada com sucesso!" : "Venda cadastrada com sucesso!",
        description: isEdit 
          ? "A venda foi reenviada para validação. A secretaria irá reavaliá-la em breve."
          : "Os dados foram salvos e a pontuação foi calculada automaticamente."
      });
      
      clearForm();
      onCancel();
      
    } catch (error) {
      console.error('❌ Erro ao salvar venda:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro desconhecido ao salvar a venda';

      toast({
        variant: "destructive",
        title: "Erro ao salvar venda",
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = !!editId;

  return (
    <>
      <FormProgressBar />
      <div className="max-w-4xl mx-auto pt-24">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle>{isEdit ? 'Editar Venda' : 'Nova Venda'}</CardTitle>
                <CardDescription>
                  {isEdit 
                    ? 'Corrija os dados conforme necessário e reenvie para nova validação'
                    : 'Preencha os dados para cadastrar uma nova venda no sistema'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mostrar motivo da rejeição em destaque */}
            {isEdit && motivoPendencia && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Motivo da rejeição:</strong> {motivoPendencia}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <LeadInfoSection />
              <ScoringRulesSection />
              <ObservationsSection />

              <div className="flex gap-4 pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-ppgvet-teal hover:bg-ppgvet-teal/90"
                >
                  {isSubmitting 
                    ? 'Salvando...' 
                    : isEdit 
                      ? 'Reenviar Venda' 
                      : 'Salvar Venda'
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default NovaVendaForm;
