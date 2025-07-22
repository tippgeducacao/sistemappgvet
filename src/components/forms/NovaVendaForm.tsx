
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigationStore } from '@/stores/NavigationStore';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useFormStore } from '@/store/FormStore';
import CourseInfoSection from './sections/CourseInfoSection';
import CourseInfoSectionVendedor from './sections/CourseInfoSectionVendedor';
import CourseInfoSectionSDR from './sections/CourseInfoSectionSDR';

const NovaVendaForm: React.FC = () => {
  const { hideNovaVendaForm } = useNavigationStore();
  const { toast } = useToast();
  const { isSDR, isVendedor, isAdmin } = useUserRoles();
  const { formData, updateField, clearForm, isSubmitting, setIsSubmitting } = useFormStore();

  const handleInputChange = (field: string, value: string) => {
    updateField(field as any, value);
  };

  // Renderizar seção de curso baseada no tipo de usuário
  const renderCourseSection = () => {
    if (isSDR) {
      return <CourseInfoSectionSDR formData={formData} updateField={handleInputChange} />;
    } else if (isVendedor) {
      return <CourseInfoSectionVendedor formData={formData} updateField={handleInputChange} />;
    } else if (isAdmin) {
      return <CourseInfoSection formData={formData} updateField={handleInputChange} />;
    }
    return <CourseInfoSection formData={formData} updateField={handleInputChange} />;
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
      clearForm();
      
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
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ''}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="crmv">CRMV</Label>
                  <Input
                    id="crmv"
                    value={formData.crmv || ''}
                    onChange={(e) => handleInputChange('crmv', e.target.value)}
                    placeholder="Número do CRMV"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Curso */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dados do Curso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderCourseSection()}
              </div>
            </div>

            {/* Dados de Pagamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dados de Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.pagamento || ''} onValueChange={(value) => handleInputChange('pagamento', value)}>
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
                    value={formData.valorContrato || ''}
                    onChange={(e) => handleInputChange('valorContrato', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="percentualDesconto">Percentual de Desconto</Label>
                  <Input
                    id="percentualDesconto"
                    value={formData.percentualDesconto || ''}
                    onChange={(e) => handleInputChange('percentualDesconto', e.target.value)}
                    placeholder="0%"
                  />
                </div>
                <div>
                  <Label htmlFor="dataPrimeiroPagamento">Data do 1º Pagamento</Label>
                  <Input
                    id="dataPrimeiroPagamento"
                    type="date"
                    value={formData.dataPrimeiroPagamento || ''}
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
                    value={formData.observacoes || ''}
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
