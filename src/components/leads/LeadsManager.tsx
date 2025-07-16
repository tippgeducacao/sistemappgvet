import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Phone, 
  Search,
  Filter,
  Eye,
  Briefcase,
  Globe,
  Zap,
  CheckCircle,
  CircleDot,
  Trophy
} from 'lucide-react';
import { useAllLeads } from '@/hooks/useLeads';
import { format } from 'date-fns';


import LeadDetailsDialog from './LeadDetailsDialog';
import LeadsDashboard from './LeadsDashboard';
import SprintHubSyncButton from './SprintHubSyncButton';
import type { Lead } from '@/hooks/useLeads';

const LeadsManager: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [profissaoFilter, setProfissaoFilter] = useState('todos');
  const [paginaFilter, setPaginaFilter] = useState('todos');
  const [fonteFilter, setFonteFilter] = useState('todos');

  const { data: allLeads = [] } = useAllLeads();

  // Extrair profissão das observações
  const extractProfissao = (observacoes?: string) => {
    if (!observacoes) return null;
    
    const match = observacoes.match(/Profissão\/Área:\s*([^\n]+)/);
    return match ? match[1].trim() : null;
  };

  // Extrair subdomínio da página de captura
  const extractPaginaSubdominio = (pagina_nome?: string) => {
    if (!pagina_nome) return null;
    
    // Procurar por .com.br/ e extrair o que vem depois
    const match = pagina_nome.match(/\.com\.br\/([^?&#]+)/);
    if (match) {
      return match[1].trim();
    }
    
    // Fallback: se não encontrar .com.br/, tentar extrair de outros padrões
    const urlMatch = pagina_nome.match(/\/([^/?&#]+)\/?$/);
    if (urlMatch) {
      return urlMatch[1].trim();
    }
    
    return null;
  };

  // Função para formatar o número do WhatsApp e criar o link
  const formatWhatsAppLink = (whatsapp: string) => {
    if (!whatsapp) return null;
    
    // Remove todos os caracteres não numéricos
    const cleanNumber = whatsapp.replace(/\D/g, '');
    
    // Se não começar com 55 (código do Brasil), adiciona
    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    
    return `https://wa.me/${formattedNumber}`;
  };

  // Filtrar todos os leads 
  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.whatsapp?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;
    
    const profissao = extractProfissao(lead.observacoes);
    const matchesProfissao = profissaoFilter === 'todos' || profissao === profissaoFilter;
    
    const paginaSubdominio = extractPaginaSubdominio(lead.pagina_nome);
    const matchesPagina = paginaFilter === 'todos' || paginaSubdominio === paginaFilter;
    
    const matchesFonte = fonteFilter === 'todos' || lead.utm_source === fonteFilter;
    
    return matchesSearch && matchesStatus && matchesProfissao && matchesPagina && matchesFonte;
  });

  // Estatísticas baseadas nos leads filtrados
  const stats = {
    total: filteredLeads.length,
    novos: filteredLeads.filter(l => l.status === 'novo').length,
    contatados: filteredLeads.filter(l => l.status === 'contatado').length,
    qualificados: filteredLeads.filter(l => l.status === 'qualificado').length,
    reunioesMarcadas: filteredLeads.filter(l => l.status === 'reuniao_marcada').length,
    convertidos: filteredLeads.filter(l => l.convertido_em_venda).length,
    sprinthub: filteredLeads.filter(l => l.utm_source === 'SprintHub').length,
    greatpages: filteredLeads.filter(l => l.utm_source === 'GreatPages').length,
  };

  // Obter profissões únicas
  const profissoes = [...new Set(
    allLeads.map(l => extractProfissao(l.observacoes))
      .filter(Boolean)
  )];

  // Obter páginas de captura únicas (subdomínios)
  const paginasCaptura = [...new Set(
    allLeads.map(l => extractPaginaSubdominio(l.pagina_nome))
      .filter(Boolean)
  )];

  // Função para obter o ícone da fonte
  const getFonteIcon = (fonte?: string) => {
    switch (fonte) {
      case 'SprintHub':
        return <Zap className="h-3 w-3 text-orange-600" />;
      case 'GreatPages':
        return <Globe className="h-3 w-3 text-blue-600" />;
      default:
        return <Globe className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // Função para obter a cor do badge da fonte
  const getFonteBadgeColor = (fonte?: string) => {
    switch (fonte) {
      case 'SprintHub':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'GreatPages':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo': return 'bg-blue-100 text-blue-800';
      case 'contatado': return 'bg-yellow-100 text-yellow-800';
      case 'qualificado': return 'bg-green-100 text-green-800';
      case 'convertido': return 'bg-purple-100 text-purple-800';
      case 'reuniao_marcada': return 'bg-orange-100 text-orange-800';
      case 'perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (allLeads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Leads</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie leads do GreatPages e SprintHub em um só lugar
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Badge variant="outline" className="text-xs sm:text-sm whitespace-nowrap">
            {allLeads.length} leads totais
          </Badge>
          <SprintHubSyncButton />
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription className="text-sm">
            Os filtros aplicados afetam tanto os gráficos quanto a tabela de leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtros em grade responsiva */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {/* Fonte */}
            <Select value={fonteFilter} onValueChange={setFonteFilter}>
              <SelectTrigger className="w-full text-xs">
                <Zap className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Fontes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Fontes</SelectItem>
                <SelectItem value="GreatPages">GreatPages</SelectItem>
                <SelectItem value="SprintHub">SprintHub</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contatado">Contatado</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
                <SelectItem value="reuniao_marcada">Reunião Marcada</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>

            {/* Profissão */}
            <Select value={profissaoFilter} onValueChange={setProfissaoFilter}>
              <SelectTrigger className="w-full text-xs">
                <Briefcase className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Profissões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {profissoes.map(profissao => (
                  <SelectItem key={profissao} value={profissao}>
                    {profissao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Páginas */}
            <Select value={paginaFilter} onValueChange={setPaginaFilter}>
              <SelectTrigger className="w-full text-xs">
                <Globe className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Páginas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Páginas</SelectItem>
                {paginasCaptura.map(pagina => (
                  <SelectItem key={pagina} value={pagina}>
                    {pagina}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Filtrados</p>
              <p className="text-lg font-semibold">{filteredLeads.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <CircleDot className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Novos</p>
              <p className="text-lg font-semibold">{stats.novos}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Contatados</p>
              <p className="text-lg font-semibold">{stats.contatados}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Qualificados</p>
              <p className="text-lg font-semibold">{stats.qualificados}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Reuniões</p>
              <p className="text-lg font-semibold">{stats.reunioesMarcadas}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Convertidos</p>
              <p className="text-lg font-semibold">{stats.convertidos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">SprintHub</p>
              <p className="text-lg font-semibold">{stats.sprinthub}</p>
            </div>
          </div>
        </Card>
      </div>

        {/* Dashboard com gráficos */}
        <div className="w-full">
          <LeadsDashboard leads={filteredLeads} />
        </div>

        {/* Tabela de Leads */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lista de Leads</CardTitle>
            <CardDescription className="text-sm">
              {filteredLeads.length} leads encontrados
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                 <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
                   <TableRow>
                     <TableHead className="w-[140px] py-2 text-xs font-medium">Nome</TableHead>
                     <TableHead className="w-[180px] py-2 text-xs font-medium hidden sm:table-cell">Email</TableHead>
                     <TableHead className="w-[130px] py-2 text-xs font-medium hidden md:table-cell">WhatsApp</TableHead>
                     <TableHead className="w-[80px] py-2 text-xs font-medium">Status</TableHead>
                     <TableHead className="w-[80px] py-2 text-xs font-medium hidden lg:table-cell">Fonte</TableHead>
                     <TableHead className="w-[90px] py-2 text-xs font-medium hidden xl:table-cell">Profissão</TableHead>
                     <TableHead className="w-[90px] py-2 text-xs font-medium hidden 2xl:table-cell">Data</TableHead>
                     <TableHead className="w-[50px] py-2 text-xs font-medium text-right">Ações</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredLeads.map((lead) => (
                     <TableRow key={lead.id} className="hover:bg-muted/50">
                       <TableCell className="py-2">
                         <div className="font-medium text-xs max-w-[130px]" title={lead.nome}>
                           {lead.nome}
                         </div>
                       </TableCell>
                       <TableCell className="py-2 hidden sm:table-cell">
                         <div className="text-xs max-w-[170px]" title={lead.email}>
                           {lead.email || '-'}
                         </div>
                       </TableCell>
                       <TableCell className="py-2 hidden md:table-cell">
                         {lead.whatsapp ? (
                           <a
                             href={formatWhatsAppLink(lead.whatsapp)}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-green-600 hover:text-green-800 text-xs block max-w-[120px]"
                             title={lead.whatsapp}
                           >
                             {lead.whatsapp}
                           </a>
                         ) : (
                           <span className="text-xs text-muted-foreground">-</span>
                         )}
                       </TableCell>
                       <TableCell className="py-2">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(lead.status)} px-1 py-0`}>
                            {lead.status === 'novo' ? 'Novo' : 
                             lead.status === 'contatado' ? 'Cont.' :
                             lead.status === 'qualificado' ? 'Qual.' :
                             lead.status === 'convertido' ? 'Conv.' : 
                             lead.status === 'reuniao_marcada' ? 'Reunião' :
                             lead.status === 'perdido' ? 'Perdido' : lead.status}
                          </Badge>
                       </TableCell>
                       <TableCell className="py-2 hidden lg:table-cell">
                         <div className="flex items-center gap-1">
                           {getFonteIcon(lead.utm_source)}
                           <Badge variant="outline" className={`text-xs ${getFonteBadgeColor(lead.utm_source)} px-1 py-0`}>
                             {(lead.utm_source || lead.fonte_referencia || 'N/A').substring(0, 4)}
                           </Badge>
                         </div>
                       </TableCell>
                       <TableCell className="py-2 hidden xl:table-cell">
                         <span className="text-xs truncate block max-w-[80px]" title={extractProfissao(lead.observacoes)}>
                           {(extractProfissao(lead.observacoes) || '-').substring(0, 10)}
                         </span>
                       </TableCell>
                        <TableCell className="py-2 hidden 2xl:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                          </span>
                        </TableCell>
                       <TableCell className="py-2 text-right">
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setSelectedLead(lead.id)}
                           className="h-6 w-6 p-0"
                         >
                           <Eye className="h-3 w-3" />
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                  </TableBody>
                </Table>
              </div>
            
            {filteredLeads.length === 0 && allLeads.length > 0 && (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum lead corresponde aos filtros aplicados
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Dialog de Detalhes */}
      {selectedLead && (
        <LeadDetailsDialog
          leadId={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
        />
      )}
    </div>
  );
};

export default LeadsManager;
