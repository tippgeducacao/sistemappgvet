import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  Edit, 
  Save, 
  X,
  Shield,
  Award,
  TrendingUp,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import VendasHistoryTab from '@/components/profile/VendasHistoryTab';
import ReuniaoHistoryTab from '@/components/profile/ReuniaoHistoryTab';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  canEdit?: boolean;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  canEdit = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [isLoading, setIsLoading] = useState(false);
  const [fullUserProfile, setFullUserProfile] = useState(user);
  const { toast } = useToast();

  // Carregar perfil completo quando o modal abrir
  useEffect(() => {
    const loadFullProfile = async () => {
      if (!user?.id || !isOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao carregar perfil completo:', error);
          return;
        }

        if (data) {
          setFullUserProfile(data);
          setEditedUser(data);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil completo:', error);
      }
    };

    loadFullProfile();
  }, [user?.id, isOpen]);

  const getUserTypeLabel = (userType: string) => {
    const types: Record<string, string> = {
      'admin': 'Administrador',
      'diretor': 'Diretor',
      'secretaria': 'Secretária',
      'vendedor': 'Vendedor',
      'sdr': 'SDR'
    };
    return types[userType] || userType;
  };

  const getUserTypeColor = (userType: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800',
      'diretor': 'bg-purple-100 text-purple-800',
      'secretaria': 'bg-blue-100 text-blue-800',
      'vendedor': 'bg-green-100 text-green-800',
      'sdr': 'bg-orange-100 text-orange-800'
    };
    return colors[userType] || 'bg-gray-100 text-gray-800';
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editedUser.name,
          nivel: editedUser.nivel,
          horario_trabalho: editedUser.horario_trabalho
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "As informações do perfil foram atualizadas com sucesso.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const showHistoryTabs = user.user_type === 'vendedor' || 
                         user.user_type === 'sdr';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil do Usuário
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="perfil">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            {showHistoryTabs && (
              <>
                <TabsTrigger value="vendas">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Histórico de Vendas
                </TabsTrigger>
                <TabsTrigger value="reunioes">
                  <Users className="h-4 w-4 mr-2" />
                  Histórico de Reuniões
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="perfil" className="space-y-6">
            {/* Header com avatar e informações básicas */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={fullUserProfile?.photo_url} alt={fullUserProfile?.name} />
                    <AvatarFallback className="text-lg">
                      {fullUserProfile?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {isEditing ? (
                        <Input
                          value={editedUser.name}
                          onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                          className="text-lg font-semibold"
                        />
                      ) : (
                        <h2 className="text-lg font-semibold">{fullUserProfile?.name}</h2>
                      )}
                      
                      {canEdit && !isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getUserTypeColor(fullUserProfile?.user_type)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {getUserTypeLabel(fullUserProfile?.user_type)}
                      </Badge>
                      {fullUserProfile?.nivel && (
                        <Badge variant="outline">
                          <Award className="h-3 w-3 mr-1" />
                          {fullUserProfile.nivel}
                        </Badge>
                      )}
                      {fullUserProfile?.ativo === false && (
                        <Badge variant="destructive">
                          Inativo
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {fullUserProfile?.email}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isLoading}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações detalhadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Informações básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">ID:</span>
                    <span className="text-muted-foreground font-mono">
                      {fullUserProfile?.id?.substring(0, 8)}...
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Criado em:</span>
                    <span className="text-muted-foreground">
                      {fullUserProfile?.created_at ? new Date(fullUserProfile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>

                  {fullUserProfile?.updated_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Atualizado em:</span>
                      <span className="text-muted-foreground">
                        {new Date(fullUserProfile.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}

                  <Separator />

                    <div>
                    <Label className="text-sm font-medium">Nível</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.nivel || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, nivel: e.target.value }))}
                        placeholder="Ex: junior, pleno, senior"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {fullUserProfile?.nivel || 'Não informado'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Horário de trabalho */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Horário de Trabalho</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fullUserProfile?.horario_trabalho ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Manhã:</span>
                        <span className="text-muted-foreground">
                          {fullUserProfile.horario_trabalho.manha_inicio} - {fullUserProfile.horario_trabalho.manha_fim}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Tarde:</span>
                        <span className="text-muted-foreground">
                          {fullUserProfile.horario_trabalho.tarde_inicio} - {fullUserProfile.horario_trabalho.tarde_fim}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Horário não configurado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Informações adicionais */}
            {(fullUserProfile?.semanas_consecutivas_meta > 0 || fullUserProfile?.pos_graduacoes?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações Adicionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fullUserProfile?.semanas_consecutivas_meta > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Semanas consecutivas na meta:</span>
                      <span className="text-green-600 font-medium">
                        {fullUserProfile.semanas_consecutivas_meta}
                      </span>
                    </div>
                  )}

                  {fullUserProfile?.pos_graduacoes?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Pós-graduações:</span>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {fullUserProfile.pos_graduacoes.length} grupo(s) atribuído(s)
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba de Histórico de Vendas */}
          {showHistoryTabs && (
            <TabsContent value="vendas">
              <VendasHistoryTab userId={user.id} userType={user.user_type} />
            </TabsContent>
          )}

          {/* Aba de Histórico de Reuniões */}
          {showHistoryTabs && (
            <TabsContent value="reunioes">
              <ReuniaoHistoryTab userId={user.id} userType={user.user_type} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;