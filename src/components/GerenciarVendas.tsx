
import React from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import SecretariaGerenciarVendas from '@/components/SecretariaGerenciarVendas';
import SimpleGerenciarVendas from '@/components/SimpleGerenciarVendas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

const GerenciarVendas: React.FC = () => {
  const { isAdmin, isSecretaria, isVendedor, isDiretor, isLoading } = useUserRoles();

  console.log('🔍 GerenciarVendas: Verificando permissões:', {
    isAdmin,
    isSecretaria,
    isVendedor,
    isDiretor,
    isLoading
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ppgvet-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Admin, secretaria e diretor podem gerenciar vendas
  const canManageVendas = isAdmin || isSecretaria || isDiretor;

  if (!canManageVendas) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar o gerenciamento de vendas.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 text-sm">
                <Shield className="h-4 w-4 inline mr-1" />
                Esta área é restrita para administradores e membros da secretaria.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se é admin, secretaria ou diretor, mostrar interface completa
  if (isAdmin || isSecretaria || isDiretor) {  
    console.log('🎭 Renderizando SecretariaGerenciarVendas para admin/secretaria/diretor');
    return <SecretariaGerenciarVendas />;
  }

  // Fallback para interface simples
  console.log('🎭 Renderizando SimpleGerenciarVendas como fallback');
  return <SimpleGerenciarVendas />;
};

export default GerenciarVendas;
