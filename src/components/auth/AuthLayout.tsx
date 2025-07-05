import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
interface AuthLayoutProps {
  children: React.ReactNode;
}
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children
}) => {
  return <div className="min-h-screen flex items-center justify-center bg-ppgvet-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/lovable-uploads/d8ea7bf6-cd20-48c9-bf0d-3a132ba840a9.png" alt="PPGVET Logo" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Sistema PPGVET</h1>
          <p className="text-gray-600">Gestão de Matrículas</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Entre ou crie sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {children}

            {/* Demo info */}
            
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AuthLayout;