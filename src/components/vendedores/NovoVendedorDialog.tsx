
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VendedorCadastroService } from '@/services/vendedores/VendedorCadastroService';

interface NovoVendedorDialogProps {
  onVendedorCadastrado: () => void;
}

const NovoVendedorDialog: React.FC<NovoVendedorDialogProps> = ({ onVendedorCadastrado }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Iniciando cadastro de novo vendedor:', formData.email);
      
      await VendedorCadastroService.cadastrarVendedor(
        formData.email,
        formData.password,
        formData.name
      );

      console.log('✅ Vendedor cadastrado com sucesso');
      
      toast({
        title: "Vendedor cadastrado",
        description: `${formData.name} foi cadastrado com sucesso!`,
      });

      // Limpar formulário e fechar dialog
      setFormData({ name: '', email: '', password: '' });
      setOpen(false);
      onVendedorCadastrado();

    } catch (error: any) {
      console.error('❌ Erro ao cadastrar vendedor:', error);
      
      let errorMessage = 'Erro inesperado ao cadastrar vendedor.';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado no sistema.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Email inválido.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Senha deve ter pelo menos 6 caracteres.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-ppgvet-teal hover:bg-ppgvet-teal/90">
          <UserPlus className="h-4 w-4 mr-2" />
          Cadastrar Vendedor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Vendedor</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo vendedor no sistema.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nome do vendedor"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@ppgvet.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Senha (mín. 6 caracteres)"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                required
                minLength={6}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-ppgvet-teal hover:bg-ppgvet-teal/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovoVendedorDialog;
