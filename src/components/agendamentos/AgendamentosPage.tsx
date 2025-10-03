import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, User, Clock, MapPin, Phone, CheckCircle, Mail, Eye, Grid, List, Edit, Edit2, X, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';
import { VendedorConversionService } from '@/services/vendedor/VendedorConversionService';
import { useCreateLead } from '@/hooks/useCreateLead';
import { toast } from 'sonner';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AgendamentosSDRPlanilha from '@/components/sdr/AgendamentosSDRPlanilha';
import AgendaGeral from './AgendaGeral';
import AgendamentoErrorDiagnosis from './AgendamentoErrorDiagnosis';
import MeusAgendamentosTab from './MeusAgendamentosTab';
import TodosAgendamentosTab from './TodosAgendamentosTab';
import { useUserRoles } from '@/hooks/useUserRoles';

import { useOverdueAppointments } from '@/hooks/useOverdueAppointments';
import { useAuth } from '@/hooks/useAuth';
import { useAgendamentosSDR } from '@/hooks/useAgendamentosSDR';
import { useAllAgendamentos } from '@/hooks/useAllAgendamentos';
import { VendedorSelectionService } from '@/services/vendedores/VendedorSelectionService';
import VendedorSelectionDebug from '@/components/debug/VendedorSelectionDebug';

import { EditarAgendamentoDiretor } from './EditarAgendamentoDiretor';
import ForcarNovoAgendamento from './ForcarNovoAgendamento';

const AgendamentosPage: React.FC = () => {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [posGraduacoes, setPosGraduacoes] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSprintHubForm, setShowSprintHubForm] = useState(false);
  const [selectedVendedorAgenda, setSelectedVendedorAgenda] = useState<any>(null);
  const [agendamentosVendedor, setAgendamentosVendedor] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // User roles
  const { isSDR, isAdmin, isDiretor } = useUserRoles();
  // Form fields
  const [searchType, setSearchType] = useState<'nome' | 'email' | 'whatsapp'>('nome');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedPosGraduacao, setSelectedPosGraduacao] = useState('');
  
  const [selectedDateForm, setSelectedDateForm] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [linkReuniao, setLinkReuniao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Estado para indicar vendedor que será selecionado automaticamente
  const [vendedorIndicado, setVendedorIndicado] = useState<any>(null);
  
  // Edit link form state
  const [editingAgendamento, setEditingAgendamento] = useState<any>(null);
  const [showEditLinkForm, setShowEditLinkForm] = useState(false);
  const [editLinkData, setEditLinkData] = useState({
    link_reuniao: ''
  });
  
  // Edit form state (mantido para compatibilidade)
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    data: '',
    horario_inicio: '',
    horario_fim: '',
    pos_graduacao_interesse: '',
    observacoes: ''
  });

  // Estado para edição de agendamento (Diretor)
  const [showEditarAgendamentoDiretor, setShowEditarAgendamentoDiretor] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState<any>(null);
  
  // Estado para debug da seleção automática
  const [showVendedorSelectionDebug, setShowVendedorSelectionDebug] = useState(false);
  
  // Calendar state for main page
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  
  // Agenda Geral state
  const [showAgendaGeral, setShowAgendaGeral] = useState(false);
  
  // Forçar agendamento state
  const [showForcarAgendamento, setShowForcarAgendamento] = useState(false);
  
  // Error diagnosis state
  const [lastError, setLastError] = useState<string | null>(null);
  const [showErrorDiagnosis, setShowErrorDiagnosis] = useState(false);
  
  // Force scheduling state
  const [showForceScheduleForm, setShowForceScheduleForm] = useState(false);
  const [forceScheduleData, setForceScheduleData] = useState({
    vendedor_id: '',
    lead_id: '',
    data_agendamento: '',
    data_fim_agendamento: '',
    pos_graduacao_interesse: '',
    link_reuniao: '',
    observacoes: 'Agendamento forçado fora do horário normal'
  });
  
  // SprintHub form fields
  const [sprintHubLead, setSprintHubLead] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    profissao: ''
  });

  // New lead form fields
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    observacoes: '',
    fonte_referencia: 'Agendamentos',
    status: 'novo'
  });


  const { mutate: createLead, isPending: isCreatingLead } = useCreateLead();

  // Hook para verificar agendamentos atrasados automaticamente
  useOverdueAppointments();
  
  // Hook para meus agendamentos SDR  
  const { agendamentos: meusAgendamentosSDR, fetchAgendamentos: recarregarMeusAgendamentos } = useAgendamentosSDR();
  
  // Hook para todos os agendamentos
  const { agendamentos: todosAgendamentosSDR, fetchAllAgendamentos: recarregarTodosAgendamentos } = useAllAgendamentos();
  
  // Estado para SDRs
  const [sdrs, setSdrs] = useState<any[]>([]);

  // Hook para verificar roles do usuário
  const { user } = useAuth();

  useEffect(() => {
    carregarDados();
    carregarSdrs();
  }, []);

  // ÚNICA FUNÇÃO para atualizar vendedor indicado - USA APENAS selecionarVendedorAutomatico
  useEffect(() => {
    const atualizarVendedorIndicado = async () => {
      console.log('🎯 ÚNICA FUNÇÃO: Atualizando vendedor indicado:', {
        vendedoresLength: vendedores.length,
        selectedDateForm,
        selectedTime,
        vendedores: vendedores.map(v => ({ id: v.id, name: v.name }))
      });
      
      if (vendedores.length > 0 && selectedDateForm && selectedTime) {
        try {
          // USA SEMPRE O MESMO FORMATO - COM TIMEZONE BRASILEIRO
          const dataHoraAgendamento = `${selectedDateForm}T${selectedTime}:00.000-03:00`;
          const dataHoraFim = selectedEndTime ? `${selectedDateForm}T${selectedEndTime}:00.000-03:00` : undefined;
          
          console.log('🎯 ÚNICA FUNÇÃO: Chamando selecionarVendedorAutomatico');
          console.log('🎯 ÚNICA FUNÇÃO: DataHora:', dataHoraAgendamento);
          const resultado = await selecionarVendedorAutomatico(
            vendedores, 
            dataHoraAgendamento, 
            dataHoraFim
          );
          
          console.log('🎯 ÚNICA FUNÇÃO: Resultado:', resultado);
          
          // Verificar se todos estão fora do horário
          if (resultado.diagnostico.todosForaHorario) {
            setVendedorIndicado({ 
              name: 'FORA DO HORÁRIO', 
              foraHorario: true,
              diagnostico: resultado.diagnostico
            });
          } else if (resultado.diagnostico.todoComConflito) {
            setVendedorIndicado({ 
              name: 'TODOS COM CONFLITO', 
              conflito: true,
              diagnostico: resultado.diagnostico
            });
          } else {
            setVendedorIndicado(resultado.vendedor);
          }
        } catch (error) {
          console.error('Erro ao atualizar vendedor indicado:', error);
          setVendedorIndicado(null);
        }
      } else {
        console.log('🎯 Condições não atendidas, limpando vendedor indicado');
        setVendedorIndicado(null);
      }
    };
    
    atualizarVendedorIndicado();
  }, [vendedores, selectedDateForm, selectedTime, selectedEndTime, agendamentos]);

  const carregarSdrs = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('user_type', ['sdr'])
        .eq('ativo', true)
        .order('name');

      if (error) throw error;
      setSdrs(data || []);
    } catch (error) {
      console.error('Erro ao carregar SDRs:', error);
    }
  };

  useEffect(() => {
    if (selectedPosGraduacao) {
      carregarVendedoresPorPosGraduacao();
    } else {
      setVendedores([]);
      setVendedorIndicado(null);
    }
  }, [selectedPosGraduacao]);


  const carregarDados = async (): Promise<void> => {
    setLoading(true);
    try {
      const [agendamentosData, posGraduacoesData, leadsData] = await Promise.all([
        AgendamentosService.buscarAgendamentos(),
        AgendamentosService.buscarPosGraduacoes(),
        AgendamentosService.buscarLeads()
      ]);

      setAgendamentos(agendamentosData);
      setPosGraduacoes(posGraduacoesData);
      setLeads(leadsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const carregarVendedoresPorPosGraduacao = async (): Promise<void> => {
    if (!selectedPosGraduacao) return;

    try {
      console.log('🔍 Carregando vendedores para pós-graduação:', selectedPosGraduacao);
      const vendedoresData = await AgendamentosService.buscarVendedoresPorPosGraduacao(selectedPosGraduacao);
      console.log('✅ Vendedores carregados:', vendedoresData);
      setVendedores(vendedoresData);
      
      if (vendedoresData.length === 0) {
        toast.error('Nenhum vendedor especializado encontrado para esta pós-graduação');
      }
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      toast.error('Erro ao carregar vendedores');
    }
  };

  // NOVA FUNÇÃO para seleção determinística com banco + debug
  const selecionarVendedorAutomaticoDeterministico = async (vendedoresList: any[], dataHora: string, dataHoraFim?: string) => {
    console.log('🎯 DETERMINÍSTICO: Nova função chamada:', { vendedoresList: vendedoresList.length, dataHora });
    
    try {
      // Usar o novo serviço determinístico
      const resultado = await VendedorSelectionService.selecionarVendedorDeterministico(
        vendedoresList,
        dataHora,
        dataHoraFim || new Date(new Date(dataHora).getTime() + 60 * 60 * 1000).toISOString()
      );

      console.log('🎯 DETERMINÍSTICO: Resultado da função do banco:', resultado);

      // Transformar resultado para compatibilidade com código existente
      const resultadoCompativel = {
        vendedor: resultado.vendedor_id ? {
          id: resultado.vendedor_id,
          name: resultado.vendedor_nome,
          email: resultado.vendedor_email
        } : null,
        diagnostico: {
          totalVendedores: resultado.diagnostico.total_vendedores,
          vendedoresForaHorario: resultado.diagnostico.vendedores_fora_horario,
          vendedoresComConflito: resultado.diagnostico.vendedores_com_conflito,
          vendedoresDisponiveis: resultado.diagnostico.vendedores_disponiveis,
          todosForaHorario: resultado.diagnostico.todos_fora_horario,
          todoComConflito: resultado.diagnostico.todos_com_conflito,
          agendamentosDetalhes: resultado.diagnostico.agendamentos_por_vendedor
        }
      };

      console.log('🎯 DETERMINÍSTICO: Resultado transformado:', resultadoCompativel);
      return resultadoCompativel;

    } catch (error) {
      console.error('❌ DETERMINÍSTICO: Erro na seleção determinística:', error);
      
      // Fallback para função original em caso de erro
      console.log('🔄 DETERMINÍSTICO: Usando fallback para função original');
      toast.error('Erro na seleção determinística, usando método tradicional');
      return await selecionarVendedorAutomatico(vendedoresList, dataHora, dataHoraFim);
    }
  };

  // Função original para seleção automática (mantida como fallback)
  const selecionarVendedorAutomatico = async (vendedoresList: any[], dataHora: string, dataHoraFim?: string) => {
    let vendedoresForaHorario = 0;
    let vendedoresComConflito = 0;
    
    // Buscar TODOS os agendamentos ativos de TODOS os vendedores (independente de SDR)
    const { data: todosAgendamentos, error } = await supabase
      .from('agendamentos')
      .select('vendedor_id, status')
      .in('vendedor_id', vendedoresList.map(v => v.id))
      .in('status', ['agendado', 'atrasado', 'finalizado', 'finalizado_venda']);
    
    if (error) {
      console.error('❌ Erro ao buscar agendamentos para seleção:', error);
      // Em caso de erro, usar os agendamentos já carregados como fallback
    }
    
    const agendamentosParaContar = todosAgendamentos || agendamentos;
    console.log('🎯 IMPORTANTE: Total de agendamentos considerados no cálculo:', agendamentosParaContar.length);
    
    // Buscar agendamentos existentes para contar distribuição
    const agendamentosVendedores = new Map();
    
    // Inicializar contadores para todos os vendedores
    vendedoresList.forEach(vendedor => {
      agendamentosVendedores.set(vendedor.id, 0);
    });
    
    // Contar agendamentos existentes de TODOS os SDRs
    agendamentosParaContar.forEach(agendamento => {
      if (agendamentosVendedores.has(agendamento.vendedor_id)) {
        agendamentosVendedores.set(
          agendamento.vendedor_id, 
          agendamentosVendedores.get(agendamento.vendedor_id) + 1
        );
      }
    });
    
    console.log('🎯 Contadores de agendamentos:', Array.from(agendamentosVendedores.entries()));
    console.log('🎯 IMPORTANTE: Função selecionarVendedorAutomatico chamada para dataHora:', dataHora);
    console.log('🎯 IMPORTANTE: Agendamentos considerados no cálculo:', agendamentos.length);
    console.log('🎯 IMPORTANTE: Vendedores disponíveis:', vendedoresList.map(v => v.name));
    // Calcular taxa de conversão de TODO O PERÍODO (histórico completo)
    const startOfAllTime = new Date('2020-01-01'); // Data bem antiga para pegar tudo
    const endOfAllTime = new Date(); // Até hoje
    
    console.log('🎯 IMPORTANTE: Calculando taxa de conversão de TODO O PERÍODO histórico');
    
    // Buscar taxas de conversão dos vendedores usando o serviço existente
    const conversionsMap = new Map();
    try {
      for (const vendedor of vendedoresList) {
        const conversion = await VendedorConversionService.calcularTaxaConversaoVendedor(
          vendedor.id, 
          startOfAllTime, 
          endOfAllTime
        );
        conversionsMap.set(vendedor.id, conversion.taxaConversao || 0);
        console.log(`📊 Taxa conversão histórica ${vendedor.name}: ${conversion.taxaConversao.toFixed(1)}%`);
      }
    } catch (error) {
      console.error('Erro ao buscar conversões:', error);
      // Se houver erro, continuar sem conversões (todas serão 0)
    }
    
    // Encontrar vendedor com menor número de agendamentos
    // Em caso de empate, usar maior taxa de conversão como critério de desempate
    let vendedorSelecionado = null;
    let menorNumeroAgendamentos = Infinity;
    let maiorTaxaConversao = -1;
    
    for (const vendedor of vendedoresList) {
      const numAgendamentos = agendamentosVendedores.get(vendedor.id);
      const taxaConversao = conversionsMap.get(vendedor.id) || 0;
      
      console.log(`🎯 DETALHE: Verificando vendedor ${vendedor.name} (${vendedor.id}):`, {
        numAgendamentos,
        taxaConversao,
        menorNumeroAgendamentos,
        maiorTaxaConversao,
        dataHoraRecebida: dataHora
      });
      
      // Verificar conflito de agenda - usar dataHoraFim se fornecida
      const dataFimAgendamento = dataHoraFim || new Date(new Date(dataHora).getTime() + 60 * 60 * 1000).toISOString();
      
      // PRIMEIRO: Verificar horário de trabalho
      const verificacaoHorario = await AgendamentosService.verificarHorarioTrabalho(
        vendedor.id, 
        dataHora, 
        dataFimAgendamento
      );
      
      if (!verificacaoHorario.valido) {
        console.log(`🎯 ❌ HORÁRIO INVÁLIDO: ${vendedor.name} - ${verificacaoHorario.motivo}`);
        vendedoresForaHorario++;
        continue; // Pula este vendedor
      }
      
      console.log(`🎯 ✅ HORÁRIO VÁLIDO: ${vendedor.name}`);
      
      // SEGUNDO: Verificar conflitos com eventos especiais
      console.log('🎯 SELEÇÃO AUTOMÁTICA - Verificando eventos especiais para:', vendedor.name);
      console.log('🎯 SELEÇÃO AUTOMÁTICA - DataHora:', dataHora);
      console.log('🎯 SELEÇÃO AUTOMÁTICA - DataFim:', dataFimAgendamento);
      
      const temConflitosEventos = await AgendamentosService.verificarConflitosEventosEspeciais(
        dataHora,
        dataFimAgendamento
      );
      
      console.log(`🎯 SELEÇÃO AUTOMÁTICA - Resultado eventos especiais para ${vendedor.name}:`, temConflitosEventos);
      
      if (temConflitosEventos) {
        console.log(`🎯 ❌ CONFLITO COM EVENTO ESPECIAL: ${vendedor.name} - horário bloqueado por evento`);
        vendedoresComConflito++;
        continue; // Pula este vendedor
      }
      
      console.log(`🎯 ✅ SEM CONFLITOS COM EVENTOS ESPECIAIS: ${vendedor.name}`);
      
      // TERCEIRO: Verificar conflitos de agenda
      const temConflito = await AgendamentosService.verificarConflitosAgenda(
        vendedor.id,
        dataHora,
        dataFimAgendamento
      );
      
      console.log(`🎯 CONFLITO: ${vendedor.name} tem conflito:`, temConflito);
      
      if (temConflito) {
        console.log(`🎯 ❌ CONFLITO: ${vendedor.name} tem conflito de horário`);
        vendedoresComConflito++;
        continue; // Pula este vendedor
      }
      
      console.log(`🎯 ✅ SEM CONFLITOS: ${vendedor.name}`);
      
      // TERCEIRO: Aplicar critérios de seleção
      // Critério 1: Menor número de agendamentos
      if (numAgendamentos < menorNumeroAgendamentos) {
        menorNumeroAgendamentos = numAgendamentos;
        maiorTaxaConversao = taxaConversao;
        vendedorSelecionado = vendedor;
        console.log(`🎯 ✅ SELECIONADO (menor agendamentos): ${vendedor.name} - ${numAgendamentos} agendamentos`);
      } 
      // Critério 2: Empate no número de agendamentos, usar maior taxa de conversão
      else if (numAgendamentos === menorNumeroAgendamentos && taxaConversao > maiorTaxaConversao) {
        maiorTaxaConversao = taxaConversao;
        vendedorSelecionado = vendedor;
        console.log(`🎯 ✅ SELECIONADO (maior conversão): ${vendedor.name} - conversão ${taxaConversao}%`);
      }
      // Critério 3: EMPATE TOTAL - usar ordem alfabética como critério final
      else if (numAgendamentos === menorNumeroAgendamentos && taxaConversao === maiorTaxaConversao) {
        // Se não há vendedor selecionado ainda, ou se este vendedor vem antes na ordem alfabética
        if (!vendedorSelecionado || vendedor.name.localeCompare(vendedorSelecionado.name) < 0) {
          vendedorSelecionado = vendedor;
          console.log(`🎯 ✅ SELECIONADO (ordem alfabética): ${vendedor.name} - critério final de desempate`);
        } else {
          console.log(`🎯 ❌ NÃO SELECIONADO (ordem alfabética): ${vendedor.name} vem depois de ${vendedorSelecionado.name}`);
        }
      } else {
        console.log(`🎯 ❌ NÃO SELECIONADO: ${vendedor.name} - ${numAgendamentos} agendamentos, ${taxaConversao}% conversão`);
      }
    }
    
    console.log('🎯 ===== RESULTADO FINAL DA SELEÇÃO =====');
    console.log('🎯 Vendedor final selecionado:', vendedorSelecionado?.name || 'NENHUM');
    console.log('🎯 Diagnóstico:', { 
      totalVendedores: vendedoresList.length,
      vendedoresForaHorario, 
      vendedoresComConflito,
      vendedoresDisponiveis: vendedoresList.length - vendedoresForaHorario - vendedoresComConflito
    });
    console.log('🎯 ========================================');
    
    // Retornar objeto com diagnóstico
    return {
      vendedor: vendedorSelecionado,
      diagnostico: {
        totalVendedores: vendedoresList.length,
        vendedoresForaHorario,
        vendedoresComConflito,
        todosForaHorario: vendedoresForaHorario === vendedoresList.length,
        todoComConflito: vendedoresComConflito === vendedoresList.length
      }
    };
  };

  const handleSubmit = async (): Promise<void> => {
    // Prevenir duplo clique/submissão
    if (loading) {
      console.log('🔒 Submissão já em andamento, ignorando...');
      return;
    }

    if (!selectedLead || !selectedPosGraduacao || !selectedDateForm || !selectedTime || !selectedEndTime || !linkReuniao.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar se horário final é após horário inicial
    if (selectedEndTime <= selectedTime) {
      toast.error('O horário final deve ser posterior ao horário inicial');
      return;
    }

    if (vendedores.length === 0) {
      toast.error('Nenhum vendedor especializado disponível para esta pós-graduação');
      return;
    }

    // Usar timezone brasileiro (-03:00) para salvar corretamente
    const dataHoraAgendamento = `${selectedDateForm}T${selectedTime}:00.000-03:00`;
    const dataHoraFim = `${selectedDateForm}T${selectedEndTime}:00.000-03:00`;
    
    console.log('🔍 DADOS PARA CRIAR AGENDAMENTO:', {
      selectedLead,
      selectedPosGraduacao,
      selectedDateForm,
      selectedTime,
      selectedEndTime,
      dataHoraAgendamento,
      dataHoraFim,
      observacoes
    });
    
    try {
      setLoading(true);
      console.log('🚀 Iniciando processo de criação de agendamento...');
      
      // Selecionar vendedor automaticamente usando NOVA FUNÇÃO DETERMINÍSTICA
      console.log('🎯 CRIAÇÃO: Chamando selecionarVendedorAutomaticoDeterministico para CRIAR AGENDAMENTO');
      console.log('🎯 CRIAÇÃO: DataHora sendo usada:', dataHoraAgendamento);
      const resultado = await selecionarVendedorAutomaticoDeterministico(vendedores, dataHoraAgendamento, dataHoraFim);
      
      console.log('👤 CRIAÇÃO: RESULTADO SELEÇÃO:', resultado);
      
      // Verificar se todos estão fora do horário
      if (resultado.diagnostico.todosForaHorario) {
        toast.error('Todos os vendedores estão fora do horário de trabalho. Use "Forçar Agendamento" se necessário.');
        return;
      }
      
      if (!resultado.vendedor) {
        toast.error('Nenhum vendedor disponível neste horário. Todos os vendedores já possuem Reuniões marcadas neste horário.');
        return;
      }

      // A função selecionarVendedorAutomatico já verifica conflitos,
      // não precisamos fazer verificação dupla

      const agendamento = await AgendamentosService.criarAgendamento({
        lead_id: selectedLead,
        vendedor_id: resultado.vendedor.id,
        pos_graduacao_interesse: selectedPosGraduacao,
        data_agendamento: dataHoraAgendamento,
        data_fim_agendamento: dataHoraFim,
        link_reuniao: linkReuniao,
        observacoes
      });

      if (agendamento) {
        // Atualizar status do lead para "reuniao_marcada"
        await AgendamentosService.atualizarStatusLead(selectedLead, 'reuniao_marcada');
        
        toast.success(`Agendamento criado com ${resultado.vendedor.name}!`);
        resetForm();
        setShowForm(false);
        carregarDados();
      } else {
        throw new Error('Erro ao criar agendamento');
      }
    } catch (error) {
      console.error('🚨 ERRO COMPLETO ao criar agendamento:', error);
      
      // Mostrar mensagem de erro mais específica e diagnóstico
      let errorMessage = 'Erro inesperado ao criar agendamento';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('📝 Mensagem específica do erro:', error.message);
      }
      
      // Sempre mostrar o diagnóstico com as informações do contexto
      setLastError(errorMessage);
      setShowErrorDiagnosis(true);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('✅ Processo de criação de agendamento finalizado');
    }
  };


  const resetForm = () => {
    setSearchType('nome');
    setSearchTerm('');
    setSelectedLead('');
    setSelectedPosGraduacao('');
    setSelectedDateForm('');
    setSelectedTime('');
    setSelectedEndTime('');
    setLinkReuniao('');
    setObservacoes('');
    setShowForm(false);
  };

  const resetSprintHubForm = () => {
    setSprintHubLead({
      nome: '',
      email: '',
      whatsapp: '',
      profissao: ''
    });
    setShowSprintHubForm(false);
  };

  // Função para iniciar o processo de forçar agendamento
  const handleForcarAgendamento = () => {
    // Preencher dados do agendamento forçado com os dados do formulário atual
    const dataHora = selectedDateForm && selectedTime ? `${selectedDateForm}T${selectedTime}:00.000-03:00` : '';
    const dataFim = selectedDateForm && selectedEndTime ? `${selectedDateForm}T${selectedEndTime}:00.000-03:00` : '';
    
    setForceScheduleData({
      vendedor_id: '',
      lead_id: selectedLead,
      data_agendamento: dataHora,
      data_fim_agendamento: dataFim,
      pos_graduacao_interesse: selectedPosGraduacao,
      link_reuniao: linkReuniao, // Usar o link já preenchido no formulário principal
      observacoes: `Agendamento forçado fora do horário normal. ${observacoes}`
    });
    
    setShowErrorDiagnosis(false);
    setShowForceScheduleForm(true);
  };

  // Função para criar agendamento forçado
  const handleCreateForceSchedule = async () => {
    // Validação de campos obrigatórios
    const camposObrigatorios = [];
    
    if (!forceScheduleData.vendedor_id) {
      camposObrigatorios.push('Vendedor');
    }
    
    if (!forceScheduleData.lead_id) {
      camposObrigatorios.push('Lead');
    }
    
    if (!forceScheduleData.data_agendamento) {
      camposObrigatorios.push('Data e horário');
    }
    
    if (!forceScheduleData.pos_graduacao_interesse) {
      camposObrigatorios.push('Pós-graduação');
    }
    
    if (!forceScheduleData.link_reuniao?.trim()) {
      camposObrigatorios.push('Link da reunião');
    }

    if (camposObrigatorios.length > 0) {
      toast.error(`Os seguintes campos são obrigatórios: ${camposObrigatorios.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      
      const result = await AgendamentosService.criarAgendamento({
        lead_id: forceScheduleData.lead_id,
        vendedor_id: forceScheduleData.vendedor_id,
        data_agendamento: forceScheduleData.data_agendamento,
        data_fim_agendamento: forceScheduleData.data_fim_agendamento,
        pos_graduacao_interesse: forceScheduleData.pos_graduacao_interesse,
        link_reuniao: forceScheduleData.link_reuniao,
        observacoes: forceScheduleData.observacoes
      }, true);

      if (result) {
        toast.success('Agendamento forçado criado com sucesso!');
        setShowForceScheduleForm(false);
        resetForm();
        await carregarDados();
      } else {
        toast.error('Erro ao criar agendamento forçado');
      }
    } catch (error) {
      console.error('Erro ao criar agendamento forçado:', error);
      
      let errorMessage = 'Erro ao criar agendamento forçado';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir edição de agendamento (Diretor)
  const handleEditarAgendamentoDiretor = (agendamento: any) => {
    setAgendamentoEditando(agendamento);
    setShowEditarAgendamentoDiretor(true);
  };

  const handleSuccessEditDiretor = () => {
    carregarDados(); // Recarregar dados após edição
    setShowEditarAgendamentoDiretor(false);
    setAgendamentoEditando(null);
  };

  // Extrair profissões únicas dos leads existentes
  const extractProfissao = (observacoes?: string) => {
    if (!observacoes) return null;
    const match = observacoes.match(/Profissão\/Área:\s*([^\n]+)/);
    return match ? match[1].trim() : null;
  };

  const profissoesUnicas = [...new Set(
    leads.map(l => extractProfissao(l.observacoes))
      .filter(Boolean)
  )];

  // Filtrar leads baseado na busca ou mostrar os 5 últimos por padrão
  const filteredLeads = leads
    .filter(lead => lead.status !== 'reuniao_marcada') // Excluir leads com Reunião já marcada
    .filter(lead => {
      if (!searchTerm) {
        // Se não há termo de busca, mostrar todos os leads disponíveis
        return true;
      }
      
      // Se há termo de busca, filtrar conforme o tipo
      switch (searchType) {
        case 'nome':
          return lead.nome?.toLowerCase().includes(searchTerm.toLowerCase());
        case 'email':
          return lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
        case 'whatsapp':
          return lead.whatsapp?.includes(searchTerm);
        default:
          return false;
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5); // Limitar a 5 leads

  const createLeadMutation = useCreateLead();

  const handleCreateSprintHubLead = async () => {
    try {
      if (!sprintHubLead.nome || !sprintHubLead.email || !sprintHubLead.whatsapp || !sprintHubLead.profissao) {
        toast.error('Todos os campos são obrigatórios');
        return;
      }

      const observacoesFormatadas = `Profissão/Área: ${sprintHubLead.profissao}`;
      
      const novoLead = {
        nome: sprintHubLead.nome,
        email: sprintHubLead.email,
        whatsapp: sprintHubLead.whatsapp,
        observacoes: observacoesFormatadas,
        fonte_referencia: 'SprintHub',
        status: 'novo'
      };

      const leadCriado = await createLeadMutation.mutateAsync(novoLead);
      
      // Atualizar lista de leads
      await carregarDados();
      
      // Selecionar o lead criado automaticamente
      setSelectedLead(leadCriado.id);
      
      resetSprintHubForm();
    } catch (error) {
      console.error('Erro ao criar lead:', error);
    }
  };

  const verAgendaVendedor = async (vendedor: any) => {
    try {
      setSelectedVendedorAgenda(vendedor);
      setViewMode('list');
      setSelectedDate(new Date());
      // Filtrar agendamentos do vendedor específico
      const agendamentosDoVendedor = agendamentos.filter(agendamento => 
        agendamento.vendedor_id === vendedor.id
      );
      setAgendamentosVendedor(agendamentosDoVendedor);
    } catch (error) {
      console.error('Erro ao carregar agenda do vendedor:', error);
      toast.error('Erro ao carregar agenda do vendedor');
    }
  };

  // Filtrar agendamentos por data selecionada no calendário
  const agendamentosDoCalendario = agendamentosVendedor.filter(agendamento => 
    selectedDate && isSameDay(parseISO(agendamento.data_agendamento), selectedDate)
  );

  // Verificar se uma data tem agendamentos
  const dateHasAppointments = (date: Date) => {
    return agendamentosVendedor.some(agendamento => 
      isSameDay(parseISO(agendamento.data_agendamento), date)
    );
  };

  const handleEditAgendamento = (agendamento: any) => {
    setEditingAgendamento(agendamento);
    setEditLinkData({
      link_reuniao: agendamento.link_reuniao || ''
    });
    setShowEditLinkForm(true);
  };

  const handleUpdateLink = async () => {
    if (!editingAgendamento || !editLinkData.link_reuniao.trim()) {
      toast.error('O link da Reunião é obrigatório');
      return;
    }

    try {
      const success = await AgendamentosService.atualizarLinkReuniao(
        editingAgendamento.id,
        editLinkData.link_reuniao
      );

      if (success) {
        toast.success('Link da Reunião atualizado com sucesso!');
        setShowEditLinkForm(false);
        setEditingAgendamento(null);
        carregarDados();
      } else {
        toast.error('Erro ao atualizar link da Reunião');
      }
    } catch (error) {
      console.error('Erro ao atualizar link:', error);
      toast.error('Erro ao atualizar link da Reunião');
    }
  };


  const handleCancelAgendamento = async (agendamentoId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      const success = await AgendamentosService.cancelarAgendamento(agendamentoId);

      if (success) {
        toast.success('Agendamento cancelado com sucesso!');
        carregarDados();
      } else {
        toast.error('Erro ao cancelar agendamento');
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento');
    }
  };

  const handleCreateNewLead = async () => {
    try {
      if (!newLeadData.nome || !newLeadData.email || !newLeadData.whatsapp) {
        toast.error('Nome, email e WhatsApp são obrigatórios');
        return;
      }

      createLead(newLeadData, {
        onSuccess: (leadCriado) => {
          toast.success('Lead criado com sucesso!');
          setNewLeadData({
            nome: '',
            email: '',
            whatsapp: '',
            observacoes: '',
            fonte_referencia: 'Agendamentos',
            status: 'novo'
          });
          setShowNewLeadForm(false);
          // Selecionar automaticamente o lead criado
          setSelectedLead(leadCriado.id);
          // Atualizar a lista de leads
          carregarDados();
        },
        onError: (error) => {
          console.error('Erro ao criar lead:', error);
          toast.error('Erro ao criar lead');
        }
      });
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    }
  };

  const getStatusBadge = (status: string): JSX.Element => {
    const statusConfig = {
      agendado: { label: 'Agendado', variant: 'default' as const },
      atrasado: { label: 'Atrasado', variant: 'destructive' as const },
      realizado: { label: 'Realizado', variant: 'secondary' as const },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const },
      reagendado: { label: 'Reagendado', variant: 'outline' as const }
    };

    // Validação e padronização de status
    const normalizedStatus = status?.toLowerCase().trim();
    
    // Se receber "pendente" ou status inválido, corrigir para "agendado"
    if (!normalizedStatus || normalizedStatus === 'pendente' || !statusConfig[normalizedStatus as keyof typeof statusConfig]) {
      console.warn(`Status inválido detectado: "${status}". Corrigindo para "agendado".`);
      return <Badge variant="default">Agendado</Badge>;
    }

    const config = statusConfig[normalizedStatus as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Visualize agendamentos de reuniões entre leads e vendedores (somente leitura)" 
              : "Gerencie Reuniões entre SDRs, leads e vendedores"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowAgendaGeral(true)} 
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Agenda Geral
          </Button>
          {/* Administradores só podem visualizar */}
          {!isAdmin && (
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Agendamento
            </Button>
          )}
          {isSDR && !isAdmin && (
            <Button 
              onClick={() => setShowForcarAgendamento(true)} 
              variant="outline"
              className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Plus className="h-4 w-4" />
              Forçar Novo Agendamento
            </Button>
          )}
          {/* Debug da Seleção Automática - Apenas para Admins/Diretores */}
          {(isAdmin || isDiretor) && (
            <VendedorSelectionDebug 
              isOpen={showVendedorSelectionDebug}
              onOpenChange={setShowVendedorSelectionDebug}
            />
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
            <CardDescription>
              Agende uma Reunião entre um lead e um vendedor especializado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lead Search */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="lead">Buscar Lead *</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNewLeadForm(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Novo Lead
                </Button>
              </div>
              
              {/* Formulário de novo lead */}
              {showNewLeadForm && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Criar Novo Lead</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowNewLeadForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="newLeadNome">Nome *</Label>
                      <Input
                        id="newLeadNome"
                        value={newLeadData.nome}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newLeadEmail">Email *</Label>
                      <Input
                        id="newLeadEmail"
                        type="email"
                        value={newLeadData.email}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newLeadWhatsapp">WhatsApp *</Label>
                      <Input
                        id="newLeadWhatsapp"
                        value={newLeadData.whatsapp}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newLeadObservacoes">Observações</Label>
                      <Textarea
                        id="newLeadObservacoes"
                        value={newLeadData.observacoes}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Informações adicionais..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowNewLeadForm(false);
                        setNewLeadData({
                          nome: '',
                          email: '',
                          whatsapp: '',
                          observacoes: '',
                          fonte_referencia: 'Agendamentos',
                          status: 'novo'
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleCreateNewLead}
                      disabled={isCreatingLead}
                    >
                      {isCreatingLead ? 'Criando...' : 'Criar Lead'}
                    </Button>
                  </div>
                </div>
              )}
              
              {!showNewLeadForm && (
                <>
                  <div className="flex gap-2">
                    <Select value={searchType} onValueChange={(value: 'nome' | 'email' | 'whatsapp') => setSearchType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nome">Nome</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder={`Buscar por ${searchType}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {/* Lista de leads com scroll - sempre visível se há leads */}
                  {filteredLeads.length > 0 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedLead === lead.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                          }`}
                          onClick={() => setSelectedLead(lead.id)}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{lead.nome}</p>
                              {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                              {lead.whatsapp && <p className="text-xs text-muted-foreground">{lead.whatsapp}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pós-graduação Selection */}
            <div className="space-y-2">
              <Label htmlFor="pos-graduacao">Pós-graduação de Interesse *</Label>
              <Select value={selectedPosGraduacao} onValueChange={setSelectedPosGraduacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a pós-graduação" />
                </SelectTrigger>
                <SelectContent>
                  {posGraduacoes.map((pos) => (
                    <SelectItem key={pos.id} value={pos.nome}>
                      {pos.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendedor Selection - Sistema distribui automaticamente */}
            <div className="space-y-2">
              <Label>Vendedor Especializado</Label>
              <div className="p-3 bg-muted/50 rounded-lg border">
                {!selectedPosGraduacao ? (
                  <p className="text-sm text-muted-foreground">Selecione primeiro a pós-graduação</p>
                ) : vendedores.length === 0 ? (
                  <p className="text-sm text-destructive">Nenhum vendedor disponível para esta pós-graduação</p>
                ) : !selectedDateForm || !selectedTime ? (
                  <div>
                    <p className="text-sm font-medium mb-2">Vendedores especializados disponíveis:</p>
                    <p className="text-sm text-muted-foreground mb-2">Selecione data e horário para ver quem será selecionado automaticamente</p>
                    <div className="space-y-2">
                      {vendedores.map((vendedor) => {
                        const contadorAgendamentos = agendamentos.filter(
                          ag => ag.vendedor_id === vendedor.id && ['agendado', 'atrasado'].includes(ag.status)
                        ).length;
                        
                        return (
                        <div key={vendedor.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3" />
                            <span>{vendedor.name}</span>
                            <span className="text-xs text-muted-foreground">({vendedor.email})</span>
                            <Badge variant={contadorAgendamentos === 0 ? "outline" : "secondary"} className="text-xs">
                              {contadorAgendamentos} agendamento{contadorAgendamentos !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => verAgendaVendedor(vendedor)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver Agenda
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <User className="h-5 w-5" />
                                  Agenda de {vendedor.name}
                                </DialogTitle>
                              </DialogHeader>
                              
                              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="list" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Lista
                                  </TabsTrigger>
                                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Calendário
                                  </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="list" className="mt-4 max-h-[50vh] overflow-y-auto">
                                  <div className="space-y-2">
                                    {agendamentosVendedor.length === 0 ? (
                                      <p className="text-center text-muted-foreground py-4">
                                        Nenhum agendamento encontrado para este vendedor
                                      </p>
                                    ) : (
                                      agendamentosVendedor.map((agendamento) => (
                                        <div key={agendamento.id} className="p-3 border rounded-lg">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Calendar className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">
                                                {new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')}
                                              </span>
                                              <span className="text-muted-foreground">
                                                às {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', { 
                                                  hour: '2-digit', 
                                                  minute: '2-digit' 
                                                })}
                                              </span>
                                            </div>
                                            <Badge variant={
                                              agendamento.status === 'agendado' ? 'default' :
                                              agendamento.status === 'realizado' ? 'secondary' :
                                              agendamento.status === 'cancelado' ? 'destructive' :
                                              agendamento.status === 'atrasado' ? 'destructive' : 'outline'
                                            }>
                                              {agendamento.status}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {agendamento.pos_graduacao_interesse}
                                          </p>
                                          {agendamento.observacoes && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                              <strong>Observações:</strong> {agendamento.observacoes}
                                            </p>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="calendar" className="mt-4">
                                  <div className="space-y-4">
                                    <CalendarComponent
                                      mode="single"
                                      selected={selectedDate}
                                      onSelect={setSelectedDate}
                                      className="rounded-md border w-full"
                                      modifiers={{
                                        agendado: agendamentosVendedor.map(a => new Date(a.data_agendamento))
                                      }}
                                      modifiersStyles={{
                                        agendado: {
                                          backgroundColor: 'hsl(var(--primary))',
                                          color: 'white'
                                        }
                                      }}
                                    />
                                    
                                    {selectedDate && (
                                      <div className="space-y-2">
                                        <h4 className="font-medium">
                                          Agendamentos para {selectedDate.toLocaleDateString('pt-BR')}:
                                        </h4>
                                        {agendamentosVendedor
                                          .filter(a => {
                                            const agendamentoDate = new Date(a.data_agendamento);
                                            return agendamentoDate.toDateString() === selectedDate.toDateString();
                                          })
                                          .map((agendamento) => (
                                            <div key={agendamento.id} className="p-2 border rounded">
                                              <div className="flex items-center justify-between">
                                                <span className="text-sm">
                                                  {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                  })} - {agendamento.pos_graduacao_interesse}
                                                </span>
                                                <Badge variant={
                                                  agendamento.status === 'agendado' ? 'default' :
                                                  agendamento.status === 'realizado' ? 'secondary' :
                                                  'destructive'
                                                }>
                                                  {agendamento.status}
                                                </Badge>
                                              </div>
                                            </div>
                                          ))
                                        }
                                        {agendamentosVendedor.filter(a => {
                                          const agendamentoDate = new Date(a.data_agendamento);
                                          return agendamentoDate.toDateString() === selectedDate.toDateString();
                                        }).length === 0 && (
                                          <p className="text-sm text-muted-foreground">
                                            Nenhum agendamento para esta data
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                     <div className="flex items-center justify-between mb-2">
                       <p className="text-sm font-medium">Vendedores especializados disponíveis:</p>
                         {vendedorIndicado ? (
                           vendedorIndicado.foraHorario ? (
                             <div className="flex items-center gap-2">
                               <div className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded border border-red-200">
                                 <span>⚠️</span>
                                 <span>Fora do horário de trabalho</span>
                               </div>
                               <Button
                                 variant="destructive"
                                 size="sm"
                                 onClick={handleForcarAgendamento}
                                 className="text-xs px-3 py-1 h-7"
                               >
                                 Forçar Agendamento
                               </Button>
                             </div>
                           ) : vendedorIndicado.conflito ? (
                             <div className="flex items-center gap-2">
                               <div className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                 <span>⚠️</span>
                                 <span>Todos têm conflitos</span>
                               </div>
                               <Button
                                 variant="destructive"
                                 size="sm"
                                 onClick={handleForcarAgendamento}
                                 className="text-xs px-3 py-1 h-7"
                               >
                                 Forçar Agendamento
                               </Button>
                             </div>
                           ) : (
                             <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                               <span>🎯</span>
                               <span>Será agendado com: {vendedorIndicado.name}</span>
                             </div>
                           )
                         ) : selectedDateForm && selectedTime ? (
                          <div className="text-xs text-muted-foreground">
                            Calculando vendedor disponível...
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Selecione data e horário para ver indicação
                          </div>
                        )}
                     </div>
                    <div className="space-y-2">
                     {vendedores.map((vendedor) => {
                        // Contar agendamentos ativos e atrasados do vendedor
                        const contadorAgendamentos = agendamentos.filter(
                          ag => ag.vendedor_id === vendedor.id && ['agendado', 'atrasado'].includes(ag.status)
                        ).length;
                        
                        // Verificar se este vendedor é o indicado pelo sistema
                        const isIndicado = vendedorIndicado?.id === vendedor.id;
                        
                        console.log(`Vendedor ${vendedor.name}: ${contadorAgendamentos} agendamentos, indicado: ${isIndicado}`);
                        
                         const isManuallySelected = false; // Não há mais seleção manual
                         
                         return (
                        <div 
                          key={vendedor.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${
                            isIndicado ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm">
                            {isIndicado && <span className="text-primary text-xl animate-pulse">🎯</span>}
                            <User className="h-3 w-3" />
                            <span className={isIndicado ? 'font-bold text-primary' : ''}>{vendedor.name}</span>
                            <span className="text-xs text-muted-foreground">({vendedor.email})</span>
                            <Badge variant={contadorAgendamentos === 0 ? "outline" : "secondary"} className="text-xs">
                              {contadorAgendamentos} agendamento{contadorAgendamentos !== 1 ? 's' : ''}
                            </Badge>
                            {isIndicado && (
                              <Badge variant="default" className="text-xs bg-primary font-semibold animate-pulse">
                                DISTRIBUIÇÃO AUTOMÁTICA
                              </Badge>
                            )}
                         </div>
                       </div>
                       );
                     })}
                    </div>
                     <p className="text-xs text-muted-foreground mt-2">
                       🎯 Sistema distribui automaticamente para o vendedor com menor número de agendamentos E que esteja disponível. 
                       Em caso de empate, será escolhido quem tem maior taxa de conversão.
                     </p>
                  </div>
                )}
              </div>
            </div>

            {/* Data e Horário */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={selectedDateForm}
                  onChange={(e) => {
                    console.log('🎯 Data alterada:', e.target.value);
                    setSelectedDateForm(e.target.value);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario-inicio">Horário Início *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input
                       id="horario-inicio"
                       type="time"
                       value={selectedTime}
                         onChange={(e) => {
                           console.log('🎯 Horário alterado:', e.target.value);
                           setSelectedTime(e.target.value);
                           // Automaticamente definir horário final com duração baseada no horário e dia
                           if (e.target.value) {
                              const [hours, minutes] = e.target.value.split(':');
                              const startTime = new Date();
                              startTime.setHours(parseInt(hours), parseInt(minutes));
                              
                              // Duração fixa de 30 minutos
                              const durationMinutes = 30;
                              const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
                              const endTimeString = endTime.toTimeString().slice(0, 5);
                              
                              console.log('🎯 Definindo horário final:', {
                                horario: e.target.value,
                                duracao: `${durationMinutes}min`,
                                horarioFinal: endTimeString
                              });
                              
                              setSelectedEndTime(endTimeString);
                           }
                         }}
                       className="pl-10"
                     />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario-fim">Horário Fim *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="horario-fim"
                      type="time"
                      value={selectedEndTime}
                      onChange={(e) => setSelectedEndTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vendedor Selecionado Automaticamente */}
            {selectedDateForm && (
              <div className={`p-4 rounded-lg border ${
                vendedorIndicado?.foraHorario || vendedorIndicado?.conflito 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      vendedorIndicado?.foraHorario || vendedorIndicado?.conflito 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    }`}>
                      {vendedorIndicado?.foraHorario || vendedorIndicado?.conflito ? '⚠️' : '🎯'} Vendedor Selecionado:
                    </span>
                    {(() => {
                      try {
                        console.log('🔍 Debug vendedor selecionado interface:', {
                          vendedores: vendedores?.length,
                          selectedDateForm,
                          selectedTime,
                          agendamentos: agendamentos?.length
                        });

                        // Usar o mesmo vendedor que foi indicado pela lógica principal
                        if (!vendedorIndicado) {
                          return <span className="text-gray-500">Aguardando seleção de data e horário</span>;
                        }

                        if (vendedorIndicado.foraHorario) {
                          return <span className="text-red-600 font-semibold">Todos os vendedores estão fora do horário de trabalho</span>;
                        }
                        
                        if (vendedorIndicado.conflito) {
                          return <span className="text-red-500">Nenhum vendedor disponível neste horário</span>;
                        }
                        
                        // Contar agendamentos do vendedor indicado
                        const agendamentosVendedor = agendamentos.filter(ag => 
                          ag.vendedor_id === vendedorIndicado.id && 
                          ['agendado', 'atrasado'].includes(ag.status)
                        ).length;
                        
                        return (
                          <span className="text-blue-800 font-semibold">
                            {vendedorIndicado.name} ({agendamentosVendedor} agendamentos)
                          </span>
                        );
                      } catch (error) {
                        console.error('❌ Erro na seleção do vendedor:', error);
                        return <span className="text-red-500">Erro na seleção do vendedor</span>;
                      }
                    })()}
                  </div>
                  
                  {(vendedorIndicado?.foraHorario || vendedorIndicado?.conflito) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleForcarAgendamento}
                      className="text-sm px-4 py-2"
                    >
                      Forçar Agendamento
                    </Button>
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  vendedorIndicado?.foraHorario || vendedorIndicado?.conflito 
                    ? 'text-red-600' 
                    : 'text-blue-600'
                }`}>
                  {vendedorIndicado?.foraHorario || vendedorIndicado?.conflito 
                    ? '* Todos os vendedores estão fora do horário de trabalho. Use "Forçar Agendamento" se necessário.'
                    : '* Sistema selecionou automaticamente o vendedor com menor número de agendamentos'
                  }
                </p>
              </div>
            )}

            {/* Link da Reunião */}
            <div className="space-y-2">
              <Label htmlFor="linkReuniao">Link da Reunião *</Label>
              <Input
                id="linkReuniao"
                type="url"
                placeholder="https://zoom.us/j/123456789 ou https://meet.google.com/abc-def-ghi"
                value={linkReuniao}
                onChange={(e) => setLinkReuniao(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Insira o link da Reunião online (Zoom, Google Meet, Teams, etc.)
              </p>
            </div>


            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Adicione observações sobre o agendamento..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Agendamento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Link Modal */}
      {showEditLinkForm && editingAgendamento && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Editar Link da Reunião</CardTitle>
            <CardDescription>
              Atualize o link da Reunião com {editingAgendamento.lead?.nome}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editLinkReuniao">Link da Reunião *</Label>
              <Input
                id="editLinkReuniao"
                type="url"
                placeholder="https://zoom.us/j/123456789 ou https://meet.google.com/abc-def-ghi"
                value={editLinkData.link_reuniao}
                onChange={(e) => setEditLinkData({ link_reuniao: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Insira o link da Reunião online (Zoom, Google Meet, Teams, etc.)
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Data:</strong> {format(new Date(editingAgendamento.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Vendedor:</strong> {editingAgendamento.vendedor?.name}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditLinkForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateLink}>
                Atualizar Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SprintHub Lead Form Modal */}
      {showSprintHubForm && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Novo Lead - SprintHub</CardTitle>
            <CardDescription>
              Cadastre um novo lead rapidamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={sprintHubLead.nome}
                onChange={(e) => setSprintHubLead(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={sprintHubLead.email}
                onChange={(e) => setSprintHubLead(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                value={sprintHubLead.whatsapp}
                onChange={(e) => setSprintHubLead(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profissao">Profissão *</Label>
              <Select 
                value={sprintHubLead.profissao} 
                onValueChange={(value) => setSprintHubLead(prev => ({ ...prev, profissao: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a profissão" />
                </SelectTrigger>
                <SelectContent>
                  {profissoesUnicas.map((profissao) => (
                    <SelectItem key={profissao} value={profissao}>
                      {profissao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetSprintHubForm}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSprintHubLead}>
              Criar Lead
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Nova estrutura de abas: Meus Agendamentos vs Todos os Agendamentos */}
      <Tabs defaultValue="meus" className="space-y-4">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {/* Administradores não veem "Meus Agendamentos" */}
          {!isAdmin && (
            <TabsTrigger value="meus" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Meus Agendamentos
            </TabsTrigger>
          )}
          <TabsTrigger value="todos" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Todos os Agendamentos
          </TabsTrigger>
          {/* Administradores podem ver "Calendário" */}
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          {/* Administradores não veem "Cancelados" */}
          {!isAdmin && (
            <TabsTrigger value="cancelados" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancelados
            </TabsTrigger>
          )}
        </TabsList>

        {!isAdmin && (
          <TabsContent value="meus">
            <MeusAgendamentosTab 
              agendamentos={meusAgendamentosSDR}
              onRefresh={() => {
                recarregarMeusAgendamentos();
                carregarDados();
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="todos">
          <TodosAgendamentosTab 
            agendamentos={todosAgendamentosSDR}
            sdrs={sdrs}
            onEditarAgendamento={handleEditarAgendamentoDiretor}
          />
        </TabsContent>


        <TabsContent value="calendario">
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium mb-4">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }, (_, i) => {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const startOfCalendar = new Date(startOfMonth);
                startOfCalendar.setDate(startOfCalendar.getDate() - startOfMonth.getDay());
                
                const currentDate = new Date(startOfCalendar);
                currentDate.setDate(currentDate.getDate() + i);
                
                const isCurrentMonth = currentDate.getMonth() === now.getMonth();
                const isToday = currentDate.toDateString() === new Date().toDateString();
                const dayAgendamentos = agendamentos
                  .filter(ag => ag.status !== 'cancelado') // Filtrar cancelados do calendário
                  .filter(ag => 
                    new Date(ag.data_agendamento).toDateString() === currentDate.toDateString()
                  );
                
                return (
                  <div
                    key={i}
                    className={`
                      min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                      ${isToday ? 'bg-primary/10 border-primary' : 'border-border'}
                      ${dayAgendamentos.length > 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                      hover:bg-muted/50
                    `}
                    onClick={() => {
                      if (dayAgendamentos.length > 0) {
                        setSelectedCalendarDate(currentDate);
                      }
                    }}
                  >
                    <div className={`text-sm ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {currentDate.getDate()}
                    </div>
                    {dayAgendamentos.length > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {dayAgendamentos.length} {dayAgendamentos.length === 1 ? "Reunião" : "Reuniões"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {selectedCalendarDate && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Agendamentos para {selectedCalendarDate.toLocaleDateString('pt-BR')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {agendamentos
                    .filter(ag => ag.status !== 'cancelado') // Filtrar cancelados
                    .filter(ag => new Date(ag.data_agendamento).toDateString() === selectedCalendarDate.toDateString())
                    .map((agendamento) => (
                      <div key={agendamento.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium">{agendamento.lead?.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-sm">{agendamento.pos_graduacao_interesse}</p>
                            <p className="text-sm text-muted-foreground">
                              Vendedor: {agendamento.vendedor?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              SDR: {agendamento.sdr?.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(agendamento.status)}
                            {isDiretor && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditarAgendamentoDiretor(agendamento)}
                                className="h-8 px-2"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
          </TabsContent>

        {!isAdmin && (
          <TabsContent value="cancelados">
          <div className="grid gap-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Agendamentos Cancelados</h3>
                <p className="text-sm text-muted-foreground">
                  Visualização dos agendamentos que foram cancelados
                </p>
              </div>
              <Badge variant="outline">
                {meusAgendamentosSDR.filter(ag => ag.status === 'cancelado').length} cancelado(s)
              </Badge>
            </div>
            {meusAgendamentosSDR.filter(ag => ag.status === 'cancelado').length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <X className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum agendamento cancelado</h3>
                    <p className="text-muted-foreground">Todos os agendamentos estão ativos</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              meusAgendamentosSDR
                .filter(ag => ag.status === 'cancelado') // Apenas cancelados
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) // Mais recentes primeiro
                .map((agendamento) => (
                  <Card key={agendamento.id}>
                    <CardContent className="p-6 bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-destructive" />
                            <div>
                              <p className="font-semibold text-foreground">{agendamento.lead?.nome}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {agendamento.lead?.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {agendamento.lead.email}
                                  </span>
                                )}
                                {agendamento.lead?.whatsapp && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {agendamento.lead.whatsapp}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Pós-graduação</p>
                              <p className="font-medium text-foreground">{agendamento.pos_graduacao_interesse}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Vendedor</p>
                              <p className="font-medium text-foreground">{agendamento.vendedor?.name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Agendado para</p>
                              <p className="font-medium text-foreground">
                                {format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })} das {format(new Date(agendamento.data_agendamento), 'HH:mm', { locale: ptBR })}
                                {agendamento.data_fim_agendamento && (
                                  <>
                                    {' até '}
                                    {format(new Date(agendamento.data_fim_agendamento), 'HH:mm', { locale: ptBR })}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {agendamento.observacoes && (
                            <div>
                              <p className="text-muted-foreground text-sm">Observações</p>
                              <p className="text-sm text-foreground">{agendamento.observacoes}</p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Cancelado em: {format(new Date(agendamento.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end gap-2">
                          <Badge variant="destructive">Cancelado</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Error Diagnosis Modal */}
      {showErrorDiagnosis && lastError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <AgendamentoErrorDiagnosis 
              error={lastError}
              vendedor={vendedores.find(v => v.id === vendedorIndicado?.id)}
              dataAgendamento={selectedDateForm && selectedTime ? `${selectedDateForm}T${selectedTime}:00` : undefined}
              onForcarAgendamento={handleForcarAgendamento}
            />
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowErrorDiagnosis(false);
                  setLastError(null);
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Forçar Agendamento */}
      {showForceScheduleForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4 text-orange-600 dark:text-orange-400">
              Forçar Agendamento
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Este agendamento será criado fora do horário normal de trabalho. 
              Selecione manualmente o vendedor especializado.
            </p>
            
            <div className="space-y-4">
              {/* Seleção de Vendedor */}
              <div>
                <label className="text-sm font-medium dark:text-foreground">Vendedor Especializado *</label>
                <select
                  value={forceScheduleData.vendedor_id}
                  onChange={(e) => setForceScheduleData(prev => ({ ...prev, vendedor_id: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md bg-background dark:bg-background dark:border-border dark:text-foreground"
                >
                  <option value="">Selecione um vendedor</option>
                  {vendedores
                    .filter(v => {
                      // Filtrar vendedores que vendem a pós-graduação selecionada
                      const posGradIds = Array.isArray(v.pos_graduacoes) ? v.pos_graduacoes : [];
                      const posGradSelecionada = posGraduacoes.find(p => p.nome === selectedPosGraduacao);
                      return posGradSelecionada && posGradIds.includes(posGradSelecionada.id);
                    })
                    .map(vendedor => (
                      <option key={vendedor.id} value={vendedor.id}>
                        {vendedor.name} ({vendedor.email})
                      </option>
                    ))
                  }
                 </select>
               </div>
               
               {/* Informações do Agendamento */}
               <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-lg text-sm border dark:border-border">
                 <div className="dark:text-foreground"><strong>Pós-graduação:</strong> {selectedPosGraduacao}</div>
                 <div className="dark:text-foreground"><strong>Data/Hora:</strong> {forceScheduleData.data_agendamento ? new Date(forceScheduleData.data_agendamento).toLocaleString('pt-BR') : 'Não definido'}</div>
                 <div className="dark:text-foreground"><strong>Lead:</strong> {leads.find(l => l.id === selectedLead)?.nome}</div>
                 <div className="dark:text-foreground"><strong>Link:</strong> {forceScheduleData.link_reuniao || 'Não definido'}</div>
               </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowForceScheduleForm(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateForceSchedule}
                className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white"
                disabled={!forceScheduleData.vendedor_id}
              >
                Criar Agendamento Forçado
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Agenda Geral Modal */}
      <AgendaGeral 
        isOpen={showAgendaGeral} 
        onClose={() => setShowAgendaGeral(false)} 
      />

      {/* Forçar Novo Agendamento Modal */}
      <ForcarNovoAgendamento
        isOpen={showForcarAgendamento}
        onClose={() => setShowForcarAgendamento(false)}
        onSuccess={carregarDados}
        leads={leads}
        posGraduacoes={posGraduacoes}
      />

      {/* Modal de Edição para Diretores */}
      <EditarAgendamentoDiretor
        agendamento={agendamentoEditando}
        isOpen={showEditarAgendamentoDiretor}
        onClose={() => {
          setShowEditarAgendamentoDiretor(false);
          setAgendamentoEditando(null);
        }}
        onSuccess={handleSuccessEditDiretor}
      />
    </div>
  );
};

export default AgendamentosPage;