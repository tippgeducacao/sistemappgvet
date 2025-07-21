
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white font-medium">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu.email@ppgvet.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 bg-white/90 border-white/50 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-ppgvet-teal-500"
          autoComplete="email"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white font-medium">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 pr-10 bg-white/90 border-white/50 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-ppgvet-teal-500"
            autoComplete="current-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100/20 text-gray-600 hover:text-gray-800"
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

      <Button 
        type="submit" 
        className="w-full h-12 bg-gradient-to-r from-ppgvet-teal-500 to-ppgvet-teal-600 hover:from-ppgvet-teal-600 hover:to-ppgvet-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-sm border border-white/20"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Entrando...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <LogIn className="w-4 h-4" />
            <span>Entrar</span>
          </div>
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
