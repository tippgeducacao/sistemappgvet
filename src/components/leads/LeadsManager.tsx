import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Briefcase,
  Globe,
  Zap
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import VendasPagination from '@/components/vendas/VendasPagination';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import LeadDetailsDialog from './LeadDetailsDialog';
import LeadsDashboard from './LeadsDashboard';
import SprintHubSyncButton from './SprintHubSyncButton';
import type { Lead } from '@/hooks/useLeads';

const LeadsManager: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { data: leadsData, isLoading } = useLeads(currentPage, itemsPerPage);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [profissaoFilter, setProfissaoFilter] = useState('todos');
  const [paginaFilter, setPaginaFilter] = useState('todos');
  const [fonteFilter, setFonteFilter] = useState('todos');

  const leads = leadsData?.leads || [];
  const totalCount = leadsData?.totalCount || 0;
  const totalPages = leadsData?.totalPages || 0;

  // Função para mudança de página sem scroll
  const handlePageChange = (newPage: number) => {
    const currentScrollPosition = window.scrollY;
    setCurrentPage(newPage);
    // Mantém a posição do scroll após a mudança de página
    setTimeout(() => {
      window.scrollTo(0, currentScrollPosition);
    }, 0);
  };

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

  // Filtrar leads
  const filteredLeads = leads.filter(lead => {
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
    convertidos: filteredLeads.filter(l => l.convertido_em_venda).length,
    sprinthub: filteredLeads.filter(l => l.utm_source === 'SprintHub').length,
    greatpages: filteredLeads.filter(l => l.utm_source === 'GreatPages').length,
  };

  // Obter profissões únicas
  const profissoes = [...new Set(
    leads.map(l => extractProfissao(l.observacoes))
      .filter(Boolean)
  )];

  // Obter páginas de captura únicas (subdomínios)
  const paginasCaptura = [...new Set(
    leads.map(l => extractPaginaSubdominio(l.pagina_nome))
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
      case 'perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ppgvet-teal">Gestão de Leads</h1>
          <p className="text-muted-foreground">
            Gerencie leads do GreatPages e SprintHub em um só lugar
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {totalCount} leads totais
          </Badge>
          <SprintHubSyncButton />
        </div>
      </div>

      {/* Filtros - Movidos para o topo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>
            Os filtros aplicados afetam tanto os gráficos quanto a tabela de leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={fonteFilter} onValueChange={setFonteFilter}>
              <SelectTrigger className="w-[160px]">
                <Zap className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Fontes</SelectItem>
                <SelectItem value="GreatPages">GreatPages</SelectItem>
                <SelectItem value="SprintHub">SprintHub</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="novo">Novos</SelectItem>
                <SelectItem value="contatado">Contatados</SelectItem>
                <SelectItem value="qualificado">Qualificados</SelectItem>
                <SelectItem value="convertido">Convertidos</SelectItem>
                <SelectItem value="perdido">Perdidos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={profissaoFilter} onValueChange={setProfissaoFilter}>
              <SelectTrigger className="w-[160px]">
                <Briefcase className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Profissões</SelectItem>
                {profissoes.map(profissao => (
                  <SelectItem key={profissao} value={profissao}>
                    {profissao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paginaFilter} onValueChange={setPaginaFilter}>
              <SelectTrigger className="w-[160px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
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

      {/* Estatísticas baseadas nos filtros */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtrados</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Novos</p>
                <p className="text-2xl font-bold">{stats.novos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contatados</p>
                <p className="text-2xl font-bold">{stats.contatados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qualificados</p>
                <p className="text-2xl font-bold">{stats.qualificados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold">{stats.convertidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">SprintHub</p>
                <p className="text-2xl font-bold">{stats.sprinthub}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">GreatPages</p>
                <p className="text-2xl font-bold">{stats.greatpages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard com Gráficos - Agora recebe leads filtrados */}
      <LeadsDashboard leads={filteredLeads} />

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>
            Leads ({filteredLeads.length})
          </CardTitle>
          <CardDescription>
            Página {currentPage} de {totalPages} - {totalCount} leads totais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {totalCount === 0 ? 'Nenhum lead encontrado' : 'Nenhum lead corresponde aos filtros'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px] py-2">Nome</TableHead>
                    <TableHead className="py-2">Email</TableHead>
                    <TableHead className="py-2">WhatsApp</TableHead>
                    <TableHead className="py-2">Status</TableHead>
                    <TableHead className="py-2">Fonte</TableHead>
                    <TableHead className="py-2">Eu sou</TableHead>
                    <TableHead className="py-2">Página Captura</TableHead>
                    <TableHead className="py-2">Localização</TableHead>
                    <TableHead className="py-2">Data Captura</TableHead>
                    <TableHead className="text-right py-2">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/50 h-12">
                      <TableCell className="font-medium py-2">
                        <div className="flex flex-col">
                          <span>{lead.nome}</span>
                          {lead.convertido_em_venda && (
                            <Badge variant="outline" className="w-fit mt-1 text-xs bg-green-50 text-green-700">
                              Convertido
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center space-x-1">
                          {lead.email ? (
                            <>
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{lead.email}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não informado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center space-x-1">
                          {lead.whatsapp ? (
                            <>
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a 
                                href={formatWhatsAppLink(lead.whatsapp)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {lead.whatsapp}
                              </a>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não informado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center space-x-2">
                           {getFonteIcon(lead.utm_source)}
                           <Badge className={`text-xs ${getFonteBadgeColor(lead.utm_source)}`}>
                             {lead.utm_source || 'GreatPages'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center space-x-1">
                          {extractProfissao(lead.observacoes) ? (
                            <>
                              <Briefcase className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{extractProfissao(lead.observacoes)}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não informado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center space-x-1">
                          {extractPaginaSubdominio(lead.pagina_nome) ? (
                            <>
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{extractPaginaSubdominio(lead.pagina_nome)}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center space-x-1">
                          {lead.regiao ? (
                            <>
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{lead.regiao}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {DataFormattingService.formatDateTime(lead.data_captura)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLead(lead.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="mt-4">
              <VendasPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
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
