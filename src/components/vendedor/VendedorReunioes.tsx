import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List, Users, Plus } from 'lucide-react';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { supabase } from '@/integrations/supabase/client';
import { getWeekRange } from '@/utils/semanaUtils';
import ReunioesPlanilha from './ReunioesPlanilha';
import ReunisoesCalendario from './ReunisoesCalendario';
import MarcarReuniaoVendedor from './MarcarReuniaoVendedor';

const VendedorReunioes: React.FC = () => {
  const { agendamentos, isLoading, atualizarResultadoReuniao, fetchAgendamentos } = useAgendamentos();
  const [showMarcarReuniao, setShowMarcarReuniao] = useState(false);
  const [reunioesFiltradas, setReunioesFiltradas] = useState<{
    pendentes: any[];
    finalizadas: any[];
  }>({ pendentes: [], finalizadas: [] });

  // Aplicar a nova lógica de filtragem que exclui vendas convertidas globalmente
  const aplicarFiltroAvancado = async () => {
    console.log('🔍 VendedorReunioes: Iniciando filtro avançado para', agendamentos.length, 'agendamentos');

    // 1. Separar reuniões por resultado
    const reunioesPendentesRaw = agendamentos.filter(a => !a.resultado_reuniao);
    const reunioesFinalizadasRaw = agendamentos.filter(a => a.resultado_reuniao);

    console.log('📊 Status inicial:', {
      pendentesRaw: reunioesPendentesRaw.length,
      finalizadasRaw: reunioesFinalizadasRaw.length
    });

    // 2. Identificar reuniões "comprou" com form_entry_id
    const agendamentosComprouComFormEntry = agendamentos.filter(a => 
      a.resultado_reuniao === 'comprou' && a.form_entry_id
    );
    const formEntryIds = agendamentosComprouComFormEntry.map(a => a.form_entry_id).filter(Boolean);

    // 3. Identificar reuniões "comprou" sem form_entry_id
    const agendamentosComprouSemFormEntry = agendamentos.filter(a => 
      a.resultado_reuniao === 'comprou' && !a.form_entry_id
    );

    // 4. Verificar quais form_entries estão convertidas globalmente
    let convertidasGlobal = new Set<string>();
    if (formEntryIds.length > 0) {
      const { data: vendasGlobal } = await supabase
        .from('form_entries')
        .select('id, status, data_assinatura_contrato')
        .in('id', formEntryIds)
        .in('status', ['matriculado', 'desistiu']);
      
      console.log('🔍 VendedorReunioes: Vendas convertidas globalmente:', {
        vendasEncontradas: vendasGlobal?.length || 0,
        detalhesVendas: vendasGlobal?.map(v => ({
          id: v.id,
          status: v.status,
          data_assinatura_contrato: v.data_assinatura_contrato
        }))
      });
      
      vendasGlobal?.forEach((v: any) => {
        if ((v.status === 'matriculado' && v.data_assinatura_contrato) || v.status === 'desistiu') {
          convertidasGlobal.add(v.id);
        }
      });
    }

    // 5. Fazer matching por contato de lead para reuniões "comprou" sem form_entry_id
    let agendamentosMatchingLeads = new Set<string>();
    if (agendamentosComprouSemFormEntry.length > 0) {
      const leadIds = agendamentosComprouSemFormEntry.map(a => a.lead_id).filter(Boolean);
      
      if (leadIds.length > 0) {
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, whatsapp, email')
          .in('id', leadIds);
          
        if (leadsData && leadsData.length > 0) {
          const { data: vendasConcluidas } = await supabase
            .from('form_entries')
            .select(`
              id,
              status,
              data_assinatura_contrato,
              alunos!inner(telefone, email)
            `)
            .in('status', ['matriculado', 'desistiu']);
          
          if (vendasConcluidas && vendasConcluidas.length > 0) {
            const contactMatches = leadsData.reduce((acc, lead) => {
              const leadWhatsapp = lead.whatsapp?.replace(/\D/g, '');
              const leadEmail = lead.email?.toLowerCase();
              
              const matchingVenda = vendasConcluidas.find((venda: any) => {
                const alunoTelefone = (venda as any).alunos?.telefone?.replace(/\D/g, '');
                const alunoEmail = (venda as any).alunos?.email?.toLowerCase();
                
                return (leadWhatsapp && alunoTelefone && leadWhatsapp === alunoTelefone) ||
                       (leadEmail && alunoEmail && leadEmail === alunoEmail);
              });
              
              if (matchingVenda) {
                acc[lead.id] = matchingVenda.id;
                
                const agendamentoMatch = agendamentosComprouSemFormEntry.find(a => a.lead_id === lead.id);
                if (agendamentoMatch) {
                  agendamentosMatchingLeads.add(agendamentoMatch.id);
                }
              }
              
              return acc;
            }, {} as Record<string, string>);
            
            console.log('🔗 VendedorReunioes: Matching por contato encontrado:', {
              totalMatches: Object.keys(contactMatches).length,
              agendamentosMatched: agendamentosMatchingLeads.size,
              detalhes: contactMatches
            });
          }
        }
      }
    }

    // 6. Aplicar filtros finais
    const pendentesFinais = reunioesPendentesRaw.filter(agendamento => {
      // Excluir se tem form_entry_id convertido globalmente
      if (agendamento.form_entry_id && convertidasGlobal.has(agendamento.form_entry_id)) {
        console.log(`🚫 VendedorReunioes: Excluindo agendamento ${agendamento.id} - convertido via form_entry_id`);
        return false;
      }
      
      // Excluir se foi matched por contato de lead
      if (agendamentosMatchingLeads.has(agendamento.id)) {
        console.log(`🚫 VendedorReunioes: Excluindo agendamento ${agendamento.id} - convertido via matching de lead`);
        return false;
      }
      
      return true;
    });

    const finalizadasFinais = reunioesFinalizadasRaw.filter(agendamento => {
      // Manter todas as finalizadas, mas que não foram convertidas por matching
      if (agendamento.resultado_reuniao === 'comprou' && agendamentosMatchingLeads.has(agendamento.id)) {
        return false; // Excluir comprou que foi matched por contato
      }
      return true;
    });

    console.log('✅ VendedorReunioes: Filtro aplicado:', {
      pendentesAntes: reunioesPendentesRaw.length,
      pendentesDepois: pendentesFinais.length,
      finalizadasAntes: reunioesFinalizadasRaw.length,
      finalizadasDepois: finalizadasFinais.length,
      convertidasGlobalExcluidas: convertidasGlobal.size,
      matchingLeadsExcluidos: agendamentosMatchingLeads.size
    });

    setReunioesFiltradas({
      pendentes: pendentesFinais,
      finalizadas: finalizadasFinais
    });
  };

  useEffect(() => {
    if (agendamentos.length > 0) {
      aplicarFiltroAvancado();
    }
  }, [agendamentos]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Carregando Reuniões...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reuniões</h1>
          <p className="text-muted-foreground">
            Gerencie suas reuniões e agende novas reuniões
          </p>
        </div>
        <Button 
          onClick={() => setShowMarcarReuniao(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Marcar Reunião
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendamentos.length}</div>
            <p className="text-xs text-muted-foreground">
              {reunioesFiltradas.pendentes.length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reunioesFiltradas.finalizadas.length}</div>
            <p className="text-xs text-muted-foreground">
              Reuniões com resultado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Comparecimento</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reunioesFiltradas.finalizadas.length > 0 
                ? Math.round((reunioesFiltradas.finalizadas.filter(r => r.resultado_reuniao !== 'nao_compareceu').length / reunioesFiltradas.finalizadas.length) * 100)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              leads que compareceram
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualizações */}
      <Tabs defaultValue="planilha" className="space-y-4">
        <TabsList>
          <TabsTrigger value="planilha" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Planilha
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planilha">
          <ReunioesPlanilha 
            agendamentos={agendamentos}
            onAtualizarResultado={atualizarResultadoReuniao}
            onRefresh={() => window.location.reload()}
          />
        </TabsContent>

        <TabsContent value="calendario">
          <ReunisoesCalendario 
            agendamentos={agendamentos}
            onAtualizarResultado={atualizarResultadoReuniao}
          />
        </TabsContent>
      </Tabs>

      {/* Modal para Marcar Reunião */}
      <MarcarReuniaoVendedor
        isOpen={showMarcarReuniao}
        onClose={() => setShowMarcarReuniao(false)}
        onSuccess={() => {
          fetchAgendamentos();
          setShowMarcarReuniao(false);
        }}
      />
    </div>
  );
};

export default VendedorReunioes;