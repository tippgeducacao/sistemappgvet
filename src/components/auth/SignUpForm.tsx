
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

interface SignUpFormProps {
  onSubmit: (email: string, password: string, name: string, userType: 'secretaria' | 'vendedor') => Promise<void>;
  isLoading: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'secretaria' | 'vendedor'>('vendedor');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password, name, userType);
    
    // Limpar campos após sucesso
    setEmail('');
    setPassword('');
    setName('');
    setUserType('vendedor');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Nome Completo</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-12"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-email">E-mail</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="seu.email@ppgvet.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12"
          autoComplete="email"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Digite sua senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-12 pr-10"
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-type">Tipo de Usuário</Label>
        <Select onValueChange={(value: 'secretaria' | 'vendedor') => setUserType(value)} value={userType}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vendedor">Vendedor</SelectItem>
            <SelectItem value="secretaria">Secretaria</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 bg-ppgvet-teal hover:bg-ppgvet-teal/90"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Criando conta...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Criar Conta</span>
          </div>
        )}
      </Button>
    </form>
  );
};

export default SignUpForm;
