
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { FormValidationService } from '@/services/validation/FormValidationService';
import AuthLayout from './AuthLayout';
import LoginForm from './LoginForm';

const AuthContainer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (email: string, password: string) => {
    const emailValidation = FormValidationService.validateEmail(email);
    const passwordValidation = FormValidationService.validatePassword(password);

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha corretamente",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const success = await signIn(email, password);
    setIsLoading(false);

    if (success) {
      setTimeout(() => navigate('/'), 1000);
    }
  };

  return (
    <AuthLayout>
      <LoginForm onSubmit={handleSignIn} isLoading={isLoading} />
    </AuthLayout>
  );
};

export default AuthContainer;
