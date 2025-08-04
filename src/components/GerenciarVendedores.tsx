
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Upload, Trash2, Users, UserPlus, Camera, Power, PowerOff, User, Edit, Settings, KeyRound, Clock, ArrowUpDown } from 'lucide-react';
import { useVendedores } from '@/hooks/useVendedores';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import NovoVendedorDialog from '@/components/vendedores/NovoVendedorDialog';
import VendorWeeklyGoalsModal from '@/components/dashboard/VendorWeeklyGoalsModal';
import SDRProfileModal from '@/components/sdr/SDRProfileModal';
import EditarVendedorDialog from '@/components/vendedores/EditarVendedorDialog';
import ResetPasswordDialog from '@/components/vendedores/ResetPasswordDialog';
import ConfigurarNiveisDialog from '@/components/niveis/ConfigurarNiveisDialog';
import { UserMigrationDialog } from '@/components/admin/UserMigrationDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NiveisService } from '@/services/niveisService';
import type { Vendedor } from '@/services/vendedoresService';
import { formatarHorarioTrabalho, type HorarioTrabalho } from '@/utils/horarioUtils';
import { ImageCropper } from '@/components/ImageCropper';

const GerenciarVendedores: React.FC = () => {
  const { vendedores, allUsers, loading, fetchVendedores, fetchAllUsers, uploadPhoto, removePhoto, toggleUserStatus, resetPassword } = useVendedores();
  const [showNewVendedorDialog, setShowNewVendedorDialog] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<{
    id: string;
    name: string;
    photo_url?: string;
    user_type?: string;
    nivel?: string;
  } | null>(null);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [resetPasswordVendedor, setResetPasswordVendedor] = useState<Vendedor | null>(null);
  const [showNiveisConfig, setShowNiveisConfig] = useState(false);
  const [showUserMigration, setShowUserMigration] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [currentVendedorId, setCurrentVendedorId] = useState<string>('');
  const { toast } = useToast();
  const { isAdmin, isSecretaria, isDiretor } = useUserRoles();
  

  // Verificar se o usuário tem permissão para gerenciar usuários (apenas diretores)
  const canManageUsers = isDiretor;

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Você não tem permissão para gerenciar usuários.</p>
          <p className="text-sm text-gray-500">Apenas diretores podem acessar esta seção.</p>
        </div>
      </div>
    );
  }

  // Verificar se o usuário tem permissão para alterar fotos
  const canEditPhotos = isDiretor;

  const handlePhotoSelect = (vendedorId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImageFile(file);
    setCurrentVendedorId(vendedorId);
    setCropperOpen(true);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      setUploadingPhoto(currentVendedorId);
      
      // Converter blob para file
      const croppedFile = new File([croppedImageBlob], 'profile-photo.jpg', {
        type: 'image/jpeg'
      });
      
      await uploadPhoto(currentVendedorId, croppedFile);
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setUploadingPhoto(null);
      setCropperOpen(false);
      setSelectedImageFile(null);
      setCurrentVendedorId('');
    }
  };

  const handleRemovePhoto = async (vendedorId: string) => {
    try {
      setUploadingPhoto(vendedorId);
      await removePhoto(vendedorId);
    } catch (error) {
      console.error('Erro ao remover foto:', error);
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus(userId, !currentStatus);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-4 text-lg font-medium">Carregando vendedores...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h2>
          <p className="text-muted-foreground">Cadastre e gerencie usuários do sistema</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowNiveisConfig(true)} 
            variant="outline" 
            className="border-gray-300 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar Níveis
          </Button>
          
          <Button 
            onClick={() => setShowUserMigration(true)} 
            variant="outline" 
            className="border-amber-300 hover:bg-amber-50 text-amber-700"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Migrar Usuários
          </Button>
          
          <Button onClick={() => setShowNewVendedorDialog(true)} className="bg-ppgvet-teal hover:bg-ppgvet-teal/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>


      <Tabs defaultValue="ativos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ativos" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários Ativos ({vendedores.length})
          </TabsTrigger>
          <TabsTrigger value="todos" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Todos os Usuários ({allUsers.length})
          </TabsTrigger>
          <TabsTrigger value="estatisticas">
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="mt-6">
          {vendedores.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum usuário ativo
              </h3>
              <p className="text-gray-600 mb-4">
                Comece cadastrando o primeiro usuário do sistema
              </p>
              <Button onClick={() => setShowNewVendedorDialog(true)} className="bg-ppgvet-teal hover:bg-ppgvet-teal/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Usuário
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Horário de Trabalho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedores.map((vendedor) => (
                    <TableRow key={vendedor.id} className={!vendedor.ativo ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={vendedor.photo_url || ''} 
                                alt={vendedor.name}
                              />
                              <AvatarFallback className="bg-ppgvet-teal text-white text-sm">
                                {getInitials(vendedor.name)}
                              </AvatarFallback>
                            </Avatar>
                            {canEditPhotos && vendedor.ativo && (
                              <label 
                                htmlFor={`photo-${vendedor.id}`}
                                className="absolute -bottom-1 -right-1 cursor-pointer bg-white rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
                              >
                                <Camera className="h-3 w-3 text-gray-600" />
                                <input
                                  id={`photo-${vendedor.id}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handlePhotoSelect(vendedor.id, file);
                                      }
                                    }}
                                />
                              </label>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{vendedor.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{vendedor.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={vendedor.user_type === 'admin' ? 'default' : 'secondary'}>
                            {vendedor.user_type === 'vendedor' && 'Vendedor'}
                            {vendedor.user_type === 'admin' && 'Admin'}
                            {vendedor.user_type === 'secretaria' && 'Secretaria'}
                            {vendedor.user_type === 'diretor' && 'Diretor'}
                            {vendedor.user_type === 'sdr_inbound' && 'SDR Inbound'}
                            {vendedor.user_type === 'sdr_outbound' && 'SDR Outbound'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {vendedor.nivel || 'Não definido'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">
                            {formatarHorarioTrabalho(vendedor.horario_trabalho as HorarioTrabalho)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendedor.ativo ? 'default' : 'secondary'} className={vendedor.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {vendedor.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(vendedor.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUserProfile({
                                  id: vendedor.id,
                                  name: vendedor.name,
                                  photo_url: vendedor.photo_url,
                                  user_type: vendedor.user_type,
                                  nivel: vendedor.nivel
                                })}
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver Perfil</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingVendedor(vendedor)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar Usuário</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setResetPasswordVendedor(vendedor)}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Resetar Senha</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={vendedor.ativo ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleToggleUserStatus(vendedor.id, vendedor.ativo)}
                              >
                                {vendedor.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{vendedor.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          {vendedor.photo_url && canEditPhotos && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemovePhoto(vendedor.id)}
                                  disabled={uploadingPhoto === vendedor.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remover Foto</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="todos" className="mt-6">
          {allUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum usuário cadastrado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece cadastrando o primeiro usuário do sistema
              </p>
              <Button onClick={() => setShowNewVendedorDialog(true)} className="bg-ppgvet-teal hover:bg-ppgvet-teal/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Usuário
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Horário de Trabalho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((vendedor) => (
                    <TableRow key={vendedor.id} className={!vendedor.ativo ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={vendedor.photo_url || ''} 
                                alt={vendedor.name}
                              />
                              <AvatarFallback className="bg-ppgvet-teal text-white text-sm">
                                {getInitials(vendedor.name)}
                              </AvatarFallback>
                            </Avatar>
                            {canEditPhotos && vendedor.ativo && (
                              <label 
                                htmlFor={`photo-all-${vendedor.id}`}
                                className="absolute -bottom-1 -right-1 cursor-pointer bg-white rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
                              >
                                <Camera className="h-3 w-3 text-gray-600" />
                                <input
                                  id={`photo-all-${vendedor.id}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handlePhotoSelect(vendedor.id, file);
                                      }
                                    }}
                                />
                              </label>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{vendedor.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{vendedor.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={vendedor.user_type === 'admin' ? 'default' : 'secondary'}>
                            {vendedor.user_type === 'vendedor' && 'Vendedor'}
                            {vendedor.user_type === 'admin' && 'Admin'}
                            {vendedor.user_type === 'secretaria' && 'Secretaria'}
                            {vendedor.user_type === 'diretor' && 'Diretor'}
                            {vendedor.user_type === 'sdr_inbound' && 'SDR Inbound'}
                            {vendedor.user_type === 'sdr_outbound' && 'SDR Outbound'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {vendedor.nivel || 'Não definido'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">
                            {formatarHorarioTrabalho(vendedor.horario_trabalho as HorarioTrabalho)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendedor.ativo ? 'default' : 'secondary'} className={vendedor.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {vendedor.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(vendedor.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUserProfile({
                                  id: vendedor.id,
                                  name: vendedor.name,
                                  photo_url: vendedor.photo_url,
                                  user_type: vendedor.user_type,
                                  nivel: vendedor.nivel
                                })}
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver Perfil</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingVendedor(vendedor)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar Usuário</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setResetPasswordVendedor(vendedor)}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Resetar Senha</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={vendedor.ativo ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleToggleUserStatus(vendedor.id, vendedor.ativo)}
                              >
                                {vendedor.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{vendedor.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          {vendedor.photo_url && canEditPhotos && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemovePhoto(vendedor.id)}
                                  disabled={uploadingPhoto === vendedor.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remover Foto</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="estatisticas" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-ppgvet-teal">{allUsers.length}</div>
                <p className="text-sm text-gray-600">No sistema</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Usuários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {allUsers.filter(u => u.ativo).length}
                </div>
                <p className="text-sm text-gray-600">Podem acessar o sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Usuários Inativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {allUsers.filter(u => !u.ativo).length}
                </div>
                <p className="text-sm text-gray-600">Temporariamente desativados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Com Foto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {allUsers.filter(v => v.photo_url).length}
                </div>
                <p className="text-sm text-gray-600">Perfis completos</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Tipo de Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Vendedores:</span>
                    <span className="font-semibold">{allUsers.filter(u => u.user_type === 'vendedor').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Administradores:</span>
                    <span className="font-semibold">{allUsers.filter(u => u.user_type === 'admin').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SDRs:</span>
                    <span className="font-semibold">{allUsers.filter(u => u.user_type === 'sdr_inbound' || u.user_type === 'sdr_outbound').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cadastros Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {allUsers.filter(v => {
                    const created = new Date(v.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return created > thirtyDaysAgo;
                  }).length}
                </div>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taxa de Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {allUsers.length > 0 ? Math.round((allUsers.filter(u => u.ativo).length / allUsers.length) * 100) : 0}%
                </div>
                <p className="text-sm text-gray-600">Usuários ativos</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <NovoVendedorDialog
        open={showNewVendedorDialog}
        onOpenChange={setShowNewVendedorDialog}
        onSuccess={() => {
          fetchVendedores();
          fetchAllUsers();
          setShowNewVendedorDialog(false);
        }}
      />
      
      {/* Modal para Vendedores */}
      {selectedUserProfile && (selectedUserProfile.user_type === 'vendedor' || selectedUserProfile.user_type === 'admin') && (
        <VendorWeeklyGoalsModal
          vendedorId={selectedUserProfile?.id}
          vendedorNome={selectedUserProfile?.name}
          vendedorPhoto={selectedUserProfile?.photo_url}
          selectedMonth={new Date().getMonth() + 1}
          selectedYear={new Date().getFullYear()}
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
        />
      )}

      {/* Modal para SDRs */}
      {selectedUserProfile && (selectedUserProfile.user_type === 'sdr_inbound' || selectedUserProfile.user_type === 'sdr_outbound') && (
        <SDRProfileModal
          sdrId={selectedUserProfile?.id}
          sdrNome={selectedUserProfile?.name}
          sdrPhoto={selectedUserProfile?.photo_url}
          sdrNivel={selectedUserProfile?.nivel}
          sdrUserType={selectedUserProfile?.user_type}
          selectedMonth={new Date().getMonth() + 1}
          selectedYear={new Date().getFullYear()}
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
        />
      )}
      
      <EditarVendedorDialog
        vendedor={editingVendedor}
        open={!!editingVendedor}
        onOpenChange={(open) => !open && setEditingVendedor(null)}
        onSuccess={() => {
          fetchVendedores();
          fetchAllUsers();
        }}
      />
      
      <ConfigurarNiveisDialog
        open={showNiveisConfig}
        onOpenChange={setShowNiveisConfig}
      />
      
      <UserMigrationDialog
        open={showUserMigration}
        onOpenChange={setShowUserMigration}
      />
      
      <ResetPasswordDialog
        vendedor={resetPasswordVendedor}
        open={!!resetPasswordVendedor}
        onOpenChange={(open) => !open && setResetPasswordVendedor(null)}
        onSuccess={() => {
          // Não precisa recarregar listas pois a senha é independente
          setResetPasswordVendedor(null);
        }}
      />

      {selectedImageFile && (
        <ImageCropper
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setSelectedImageFile(null);
            setCurrentVendedorId('');
          }}
          onCropComplete={handleCropComplete}
          imageFile={selectedImageFile}
        />
      )}
      </div>
    </TooltipProvider>
  );
};

// Componente UserCard para reutilização
interface UserCardProps {
  vendedor: Vendedor;
  canEditPhotos: boolean;
  uploadingPhoto: string | null;
  onPhotoSelect: (vendedorId: string, file: File) => void;
  onRemovePhoto: (vendedorId: string) => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  onViewProfile: (user: { id: string; name: string; photo_url?: string; user_type?: string; nivel?: string }) => void;
  onEditVendedor: (vendedor: Vendedor) => void;
  onResetPassword: (vendedor: Vendedor) => void;
  getInitials: (name: string) => string;
}

const UserCard: React.FC<UserCardProps> = ({
  vendedor,
  canEditPhotos,
  uploadingPhoto,
  onPhotoSelect,
  onRemovePhoto,
  onToggleStatus,
  onViewProfile,
  onEditVendedor,
  onResetPassword,
  getInitials
}) => {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${!vendedor.ativo ? 'opacity-75 border-gray-300' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={vendedor.photo_url || ''} 
                alt={vendedor.name}
                key={vendedor.photo_url || 'no-photo'}
              />
              <AvatarFallback className="bg-ppgvet-teal text-white">
                {getInitials(vendedor.name)}
              </AvatarFallback>
            </Avatar>
            
            {canEditPhotos && vendedor.ativo && (
              <div className="absolute -bottom-1 -right-1">
                <label 
                  htmlFor={`photo-${vendedor.id}`}
                  className="cursor-pointer bg-white rounded-full p-1 shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <Camera className="h-3 w-3 text-gray-600" />
                </label>
                <input
                  id={`photo-${vendedor.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onPhotoSelect(vendedor.id, file);
                    }
                  }}
                  disabled={uploadingPhoto === vendedor.id}
                />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <CardTitle className={`text-lg ${!vendedor.ativo ? 'text-gray-500' : ''}`}>
              {vendedor.name}
            </CardTitle>
            <p className="text-sm text-gray-600">{vendedor.email}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={
                vendedor.user_type === 'admin' ? 'bg-red-100 text-red-800' :
                vendedor.user_type === 'sdr_inbound' ? 'bg-cyan-100 text-cyan-800' :
                vendedor.user_type === 'sdr_outbound' ? 'bg-indigo-100 text-indigo-800' :
                'bg-green-100 text-green-800'
              }>
                {vendedor.user_type === 'admin' ? 'Admin' : 
                 vendedor.user_type === 'sdr_inbound' ? 'SDR Inbound' :
                 vendedor.user_type === 'sdr_outbound' ? 'SDR Outbound' : 'Vendedor'}
              </Badge>
              
              {/* Badge de nível para vendedores */}
              {vendedor.user_type === 'vendedor' && vendedor.nivel && (
                <Badge variant="outline" className={NiveisService.getNivelColor(vendedor.nivel)}>
                  {NiveisService.getNivelLabel(vendedor.nivel)}
                </Badge>
              )}
              
              <Badge variant={vendedor.ativo ? "default" : "secondary"} className={
                vendedor.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }>
                {vendedor.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <span className="text-sm text-gray-500">
              Desde {new Date(vendedor.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {uploadingPhoto === vendedor.id ? (
              <Button disabled size="sm" className="flex-1">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processando...
              </Button>
            ) : (
              <>
                {/* Botão para editar vendedor - apenas para vendedores */}
                {vendedor.user_type === 'vendedor' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditVendedor(vendedor)}
                    className="bg-orange-50 hover:bg-orange-100 border-orange-200"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                
                {/* Botão para visualizar perfil - para vendedores e SDRs */}
                {(vendedor.user_type === 'vendedor' || vendedor.user_type === 'sdr_inbound' || vendedor.user_type === 'sdr_outbound') && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onViewProfile({
                      id: vendedor.id,
                      name: vendedor.name,
                      photo_url: vendedor.photo_url,
                      user_type: vendedor.user_type,
                      nivel: vendedor.nivel
                    })}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Ver Perfil
                  </Button>
                )}
                
                {canEditPhotos && vendedor.ativo && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => document.getElementById(`photo-${vendedor.id}`)?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Foto
                  </Button>
                )}
                
                {canEditPhotos && vendedor.photo_url && vendedor.ativo && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRemovePhoto(vendedor.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Botão para resetar senha */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResetPassword(vendedor)}
                  className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-800"
                >
                  <KeyRound className="h-4 w-4 mr-1" />
                  Resetar Senha
                </Button>
                
                <Button
                  variant={vendedor.ativo ? "destructive" : "default"}
                  size="sm"
                  onClick={() => onToggleStatus(vendedor.id, vendedor.ativo)}
                  className={vendedor.ativo ? 
                    "bg-red-600 hover:bg-red-700" : 
                    "bg-green-600 hover:bg-green-700"
                  }
                >
                  {vendedor.ativo ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-1" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-1" />
                      Ativar
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GerenciarVendedores;
