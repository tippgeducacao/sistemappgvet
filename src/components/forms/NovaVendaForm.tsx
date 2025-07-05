
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppStateStore } from '@/stores/AppStateStore';
import { useToast } from '@/hooks/use-toast';

const NovaVendaForm: React.FC = () => {
  const { hideNovaVendaForm } = useAppStateStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    nomeAluno: '',
    emailAluno: '',
    telefoneAluno: '',
    crmvAluno: '',
    cursoId: '',
    formaPagamento: '',
    valorContrato: '',
    percentualDesconto: '',
    dataPrimeiroPagamento: '',
    carencia: '',
    detalhesCarencia: '',
    reembolsoMatricula: '',
    indicacao: '',
    nomeIndicador: '',
    lotePos: '',
    matricula: '',
    modalidade: '',
    parcelamento: '',
    tipoVenda: '',
    vendaCasada: '',
    detalhesVendaCasada: '',
    observacoes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validações básicas
      if (!formData.nomeAluno || !formData.emailAluno) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Nome e email do aluno são obrigatórios',
          variant: 'destructive'
        });
        return;
      }

      // Aqui você implementará a lógica de salvamento
      console.log('📤 Enviando formulário:', formData);
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Venda cadastrada com sucesso!',
        description: 'A venda foi enviada para validação da secretaria'
      });

      // Limpar formulário e voltar
      setFormData({
        nomeAluno: '',
        emailAluno: '',
        telefoneAluno: '',
        crmvAluno: '',
        cursoId: '',
        formaPagamento: '',
        valorContrato: '',
        percentualDesconto: '',
        dataPrimeiroPagamento: '',
        carencia: '',
        detalhesCarencia: '',
        reembolsoMatricula: '',
        indicacao: '',
        nomeIndicador: '',
        lotePos: '',
        matricula: '',
        modalidade: '',
        parcelamento: '',
        tipoVenda: '',
        vendaCasada: '',
        detalhesVendaCasada: '',
        observacoes: ''
      });
      
      hideNovaVendaForm();

    } catch (error) {
      console.error('Erro ao cadastrar venda:', error);
      toast({
        title: 'Erro ao cadastrar venda',
        description: 'Tente novamente em alguns minutos',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={hideNovaVendaForm}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Nova Venda</CardTitle>
              <CardDescription>
                Preencha os dados para cadastrar uma nova venda
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do Aluno */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dados do Aluno</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeAluno">Nome do Aluno *</Label>
                  <Input
                    id="nomeAluno"
                    value={formData.nomeAluno}
                    onChange={(e) => handleInputChange('nomeAluno', e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emailAluno">Email do Aluno *</Label>
                  <Input
                    id="emailAluno"
                    type="email"
                    value={formData.emailAluno}
                    onChange={(e) => handleInputChange('emailAluno', e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefoneAluno">Telefone</Label>
                  <Input
                    id="telefoneAluno"
                    value={formData.telefoneAluno}
                    onChange={(e) => handleInputChange('telefoneAluno', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="crmvAluno">CRMV</Label>
                  <Input
                    id="crmvAluno"
                    value={formData.crmvAluno}
                    onChange={(e) => handleInputChange('crmvAluno', e.target.value)}
                    placeholder="Número do CRMV"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Curso */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dados do Curso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Curso</Label>
                  <Select value={formData.cursoId} onValueChange={(value) => handleInputChange('cursoId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="curso1">Curso de Exemplo 1</SelectItem>
                      <SelectItem value="curso2">Curso de Exemplo 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modalidade</Label>
                  <Select value={formData.modalidade} onValueChange={(value) => handleInputChange('modalidade', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dados de Pagamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dados de Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.formaPagamento} onValueChange={(value) => handleInputChange('formaPagamento', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cartao_vista">Cartão à vista</SelectItem>
                      <SelectItem value="cartao_parcelado">Cartão parcelado</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="valorContrato">Valor do Contrato</Label>
                  <Input
                    id="valorContrato"
                    value={formData.valorContrato}
                    onChange={(e) => handleInputChange('valorContrato', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="percentualDesconto">Percentual de Desconto</Label>
                  <Input
                    id="percentualDesconto"
                    value={formData.percentualDesconto}
                    onChange={(e) => handleInputChange('percentualDesconto', e.target.value)}
                    placeholder="0%"
                  />
                </div>
                <div>
                  <Label htmlFor="dataPrimeiroPagamento">Data do 1º Pagamento</Label>
                  <Input
                    id="dataPrimeiroPagamento"
                    type="date"
                    value={formData.dataPrimeiroPagamento}
                    onChange={(e) => handleInputChange('dataPrimeiroPagamento', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
              <div>
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais sobre a venda..."
                  rows={4}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-ppgvet-teal hover:bg-ppgvet-teal/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Salvando...' : 'Salvar Venda'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={hideNovaVendaForm}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NovaVendaForm;
