import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
interface AuthLayoutProps {
  children: React.ReactNode;
}
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children
}) => {
  return <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background with gradient and animated elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-ppgvet-teal-500/20 via-ppgvet-magenta-500/10 to-ppgvet-teal-600/30">
        {/* Animated background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ppgvet-teal-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ppgvet-magenta-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-ppgvet-teal-300/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Glassmorphism container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo section with glass effect */}
        <div className="text-center mb-8 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-xl bg-[#c4c4c4]">
          <img src="/lovable-uploads/fff79721-2c80-40ff-8da5-5a2174a9f86c.png" alt="Logo" className="h-20 w-auto mx-auto mb-4 drop-shadow-lg" />
          <div className="text-gray-800 drop-shadow-sm">
            <span className="text-xl font-light">Seja o </span>
            <span className="text-xl font-bold text-blue-600 typing-effect">Ponto</span>
            <span className="text-xl font-light"> Fora da caixa</span>
          </div>
        </div>

        {/* Main card with liquid glass effect */}
        <Card className="backdrop-blur-lg bg-white/95 border border-white/30 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-gray-900">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-gray-600">
              Entre ou crie sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AuthLayout;