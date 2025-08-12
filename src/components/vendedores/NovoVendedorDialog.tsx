
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { VendedoresService } from '@/services/vendedoresService';
import { UserPlus } from 'lucide-react';
import { useNiveis } from '@/hooks/useNiveis';

interface NovoVendedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const NovoVendedorDialog: React.FC<NovoVendedorDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'vendedor',
    nivel: 'junior'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { niveis } = useNiveis();
  
  // Tipos de usuário disponíveis baseados nos níveis
  const tiposUsuario = React.useMemo(() => {
    const tipos = new Set(['admin', 'vendedor']); // Sempre disponíveis
    
    // Adicionar tipos baseados nos níveis existentes
    niveis.forEach(nivel => {
      if (['sdr', 'coordenador', 'supervisor'].includes(nivel.tipo_usuario)) {
        tipos.add(nivel.tipo_usuario);
      }
    });
    
    return Array.from(tipos);
  }, [niveis]);
  
  // Níveis disponíveis baseados no tipo de usuário selecionado
  const niveisDisponiveis = React.useMemo(() => {
    if (formData.userType === 'admin') {
      return []; // Admin não tem nível
    }
    
    const niveisDoTipo = niveis.filter(n => n.tipo_usuario === formData.userType);
    const niveisUnicos = new Set(niveisDoTipo.map(n => n.nivel));
    
    return Array.from(niveisUnicos);
  }, [niveis, formData.userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.userType) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    
    // Validar nível para tipos que precisam
    if (formData.userType !== 'admin' && !formData.nivel) {
      toast({
        title: "Nível obrigatório",
        description: "Por favor, selecione um nível para este tipo de usuário",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await VendedoresService.createVendedor(formData);
      
      const userTypeLabel = formData.userType === 'admin' ? 'Administrador' : 
                             formData.userType === 'sdr' ? 'SDR' :
                             formData.userType === 'coordenador' ? 'Coordenador' :
                             formData.userType === 'supervisor' ? 'Supervisor' : 'Vendedor';
      
      toast({
        title: "Usuário criado",
        description: `${formData.name} foi cadastrado como ${userTypeLabel} com sucesso!`,
      });

      setFormData({ name: '', email: '', password: '', userType: 'vendedor', nivel: 'junior' });
      onSuccess();
      
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Usuário
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Digite o nome do usuário"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@email.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              disabled={isSubmitting}
              required
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="userType">Tipo de usuário</Label>
            <Select
              value={formData.userType}
              onValueChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  userType: value,
                  nivel: value === 'admin' ? '' : 'junior' // Reset nível quando muda tipo
                }));
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                {tiposUsuario.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo === 'admin' ? 'Administrador' : 
                     tipo === 'vendedor' ? 'Vendedor' : 
                     tipo === 'sdr' ? 'SDR' :
                     tipo === 'coordenador' ? 'Coordenador' :
                     tipo === 'supervisor' ? 'Supervisor' : tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Mostrar seleção de nível apenas se não for admin e tiver níveis disponíveis */}
          {formData.userType !== 'admin' && niveisDisponiveis.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="nivel">Nível</Label>
              <Select
                value={formData.nivel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, nivel: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  {niveisDisponiveis.map(nivel => (
                    <SelectItem key={nivel} value={nivel}>
                      {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-ppgvet-teal hover:bg-ppgvet-teal/90"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Criando...</span>
                </div>
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovoVendedorDialog;
