import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
interface AuthLayoutProps {
  children: React.ReactNode;
}
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children
}) => {
  return <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-background">
      {/* Background with gradient and animated elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-ppgvet-teal/20 via-ppgvet-magenta/10 to-ppgvet-teal/30 dark:from-ppgvet-teal/10 dark:via-ppgvet-magenta/5 dark:to-ppgvet-teal/15">
        {/* Animated background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ppgvet-teal/30 dark:bg-ppgvet-teal/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ppgvet-magenta/20 dark:bg-ppgvet-magenta/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-ppgvet-teal/20 dark:bg-ppgvet-teal/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Glassmorphism container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo section with glass effect */}
        <div className="text-center mb-8 backdrop-blur-md rounded-2xl p-6 border border-white/40 dark:border-white/20 shadow-xl bg-card/95 dark:bg-card/90">
          <img src="/lovable-uploads/fff79721-2c80-40ff-8da5-5a2174a9f86c.png" alt="Logo" className="h-20 w-auto mx-auto mb-4 drop-shadow-lg" />
          <div className="text-foreground drop-shadow-sm">
            <span className="text-xl font-light">Seja o </span>
            <span className="text-xl font-bold text-ppgvet-teal">Ponto</span>
            <span className="text-xl font-light"> Fora da caixa</span>
          </div>
        </div>

        {/* Main card with liquid glass effect */}
        <Card className="backdrop-blur-lg bg-card/95 dark:bg-card/90 border border-white/30 dark:border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-foreground">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-muted-foreground">
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