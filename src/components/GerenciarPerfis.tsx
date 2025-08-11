import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, Eye, Edit } from 'lucide-react';
import { useVendedores } from '@/hooks/useVendedores';
import LoadingSpinner from '@/components/LoadingSpinner';
import UserProfileModal from './UserProfileModal';

const GerenciarPerfis: React.FC = () => {
  const { vendedores, loading } = useVendedores();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Filtrar usuários baseado no termo de busca
  const filteredUsers = vendedores.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserTypeLabel = (userType: string) => {
    const types: Record<string, string> = {
      'admin': 'Administrador',
      'diretor': 'Diretor',
      'secretaria': 'Secretária',
      'vendedor': 'Vendedor',
      'sdr_inbound': 'SDR Inbound',
      'sdr_outbound': 'SDR Outbound'
    };
    return types[userType] || userType;
  };

  const getUserTypeColor = (userType: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800',
      'diretor': 'bg-purple-100 text-purple-800',
      'secretaria': 'bg-blue-100 text-blue-800',
      'vendedor': 'bg-green-100 text-green-800',
      'sdr_inbound': 'bg-orange-100 text-orange-800',
      'sdr_outbound': 'bg-yellow-100 text-yellow-800'
    };
    return colors[userType] || 'bg-gray-100 text-gray-800';
  };

  const handleViewProfile = (user: any) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Perfis de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Barra de pesquisa */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, email ou tipo de usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de usuários */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={user.photo_url} 
                            alt={user.name}
                          />
                          <AvatarFallback>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Informações do usuário */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{user.name}</h3>
                            <Badge 
                              className={getUserTypeColor(user.user_type)}
                            >
                              {getUserTypeLabel(user.user_type)}
                            </Badge>
                            {user.nivel && (
                              <Badge variant="outline">
                                {user.nivel}
                              </Badge>
                            )}
                            {!user.ativo && (
                              <Badge variant="destructive">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>ID: {user.id.substring(0, 8)}...</span>
                            <span>
                              Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            {user.updated_at && (
                              <span>
                                Atualizado em: {new Date(user.updated_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProfile(user)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Estatísticas */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {filteredUsers.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? 'Encontrados' : 'Total de Usuários'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredUsers.filter(u => u.ativo).length}
                </div>
                <div className="text-sm text-muted-foreground">Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredUsers.filter(u => !u.ativo).length}
                </div>
                <div className="text-sm text-muted-foreground">Inativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(filteredUsers.map(u => u.user_type)).size}
                </div>
                <div className="text-sm text-muted-foreground">Tipos de Usuário</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de perfil */}
      {selectedUser && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          canEdit={false} // Admin/diretor visualizando perfil de outro usuário
        />
      )}
    </>
  );
};

export default GerenciarPerfis;