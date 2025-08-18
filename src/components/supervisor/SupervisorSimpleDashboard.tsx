import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const SupervisorSimpleDashboard: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-muted-foreground">Área do Supervisor</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Seu painel está sendo configurado
            </p>
          </div>
          <div className="text-muted-foreground/60">
            <p className="text-xs">
              Entre em contato com a administração para configurar suas permissões
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorSimpleDashboard;