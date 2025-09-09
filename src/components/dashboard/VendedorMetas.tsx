import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Trophy, DollarSign, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useAllVendas, useVendas } from '@/hooks/useVendas';
import { useAuthStore } from '@/stores/AuthStore';
import { useNiveis } from '@/hooks/useNiveis';
import { useVendedores } from '@/hooks/useVendedores';
import { ComissionamentoService } from '@/services/comissionamentoService';
import { useVendaWithFormResponses } from '@/hooks/useVendaWithFormResponses';
import { debugSemanasAgosto2025 } from '@/utils/semanasDebug';
import { getVendaPeriod, getSemanaAtual, getSemanaFromDate, getSemanasDoAno, getWeekDatesFromNumber, getMesAnoSemanaAtual } from '@/utils/semanaUtils';
import { getDataEfetivaVenda, getVendaEffectivePeriod } from '@/utils/vendaDateUtils';
import { useBatchWeeklyCommissions } from '@/hooks/useWeeklyCommission';
import { supabase } from '@/integrations/supabase/client';

interface VendedorMetasProps {
  selectedMonth: number;
  selectedYear: number;
}

const VendedorMetas: React.FC<VendedorMetasProps> = ({
  selectedMonth,
  selectedYear
}) => {
  console.log('🚨 VENDEDOR METAS - Props recebidas:', { selectedMonth, selectedYear });
  const { metasSemanais, getMetaSemanalVendedor, syncMetasWithNivel, loading: metasSemanaisLoading, fetchMetasSemanaisByVendedorMes } = useMetasSemanais();
  const { vendas, isLoading: vendasLoading } = useVendas(); // Usar vendas do usuário específico em vez de todas
  const { profile } = useAuthStore();
  const { niveis } = useNiveis();
  const { vendedores } = useVendedores();
  
  // Filtrar vendas com buffer para incluir semanas que cruzam meses (ex: Aug 27-31 para Set semana 35)
  const vendasDoMesSelecionado = vendas.filter(venda => {
    if (venda.vendedor_id !== profile?.id) return false;
    if (venda.status !== 'matriculado') return false;
    
    // Usar data_aprovacao, data_assinatura_contrato ou enviado_em
    const dataVenda = venda.data_aprovacao || venda.data_assinatura_contrato || venda.enviado_em;
    if (!dataVenda) return false;
    
    const data = new Date(dataVenda);
    const mesVenda = data.getMonth() + 1;
    const anoVenda = data.getFullYear();
    
    // Incluir vendas do mês selecionado E do mês anterior (para pegar semanas que cruzam)
    // Ex: vendas de 27-31 Aug devem ser incluídas quando selecionamos Setembro
    const mesAnterior = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const anoAnterior = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    
    const isCurrentMonth = mesVenda === selectedMonth && anoVenda === selectedYear;
    const isPreviousMonth = mesVenda === mesAnterior && anoVenda === anoAnterior;
    
    // Log específico para August 27-31 -> September weeks
    if (selectedMonth === 9 && selectedYear === 2025 && isPreviousMonth) {
      console.log(`🚨 BUFFER FILTER - Incluindo venda de Aug para Set:`, {
        venda_id: venda.id.substring(0, 8),
        data_venda: dataVenda,
        mes_venda: mesVenda,
        ano_venda: anoVenda,
        selected: `${selectedMonth}/${selectedYear}`
      });
    }
    
    return isCurrentMonth || isPreviousMonth;
  });
  
  // Buscar respostas apenas para vendas filtradas
  const { vendasWithResponses, isLoading: isLoadingResponses } = useVendaWithFormResponses(vendasDoMesSelecionado);
  
  // Estado para armazenar os cálculos de comissão (com fallback local sempre garantido)
  const [comissoesPorSemana, setComissoesPorSemana] = useState<{[key: string]: {valor: number, multiplicador: number, percentual: number}}>({});
  const [regrasComissionamento, setRegrasComissionamento] = useState<any[]>([]);
  
  // Carregar regras de comissionamento uma única vez
  useEffect(() => {
    const carregarRegras = async () => {
      try {
        const regras = await ComissionamentoService.fetchRegras('vendedor');
        setRegrasComissionamento(regras);
        console.log('📋 Regras de comissionamento carregadas:', regras.length);
      } catch (error) {
        console.error('❌ Erro ao carregar regras:', error);
      }
    };

    carregarRegras();
  }, []);
  
  // Hook para buscar comissionamentos (apenas como cache secundário)
  const { data: weeklyCommissions, isLoading: commissionsLoading } = useBatchWeeklyCommissions(
    profile?.id ? [{ id: profile.id, type: 'vendedor' as const }] : [],
    selectedYear,
    0, // Buscar todas as semanas do ano para ter cache completo
    !!profile?.id
  );
  
  // Estado para controlar exportação de PDF
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { toast } = useToast();

  // Função para obter meta baseada no nível do vendedor
  const getMetaBaseadaNivel = (semana: number) => {
    if (!profile?.user_type) {
      console.log('⚠️ User type não encontrado');
      return 0;
    }
    
    // Se não tem nível definido, usar junior como padrão
    const nivelUsuario = profile.nivel || 'junior';
    
    console.log(`🔍 Buscando meta para: ${nivelUsuario} - ${profile.user_type}`);
    
    if (!niveis || niveis.length === 0) {
      console.log('⚠️ Array de níveis vazio');
      return 0;
    }
    
    const nivelConfig = niveis.find(n => 
      n.nivel === nivelUsuario && 
      n.tipo_usuario === profile.user_type
    );
    
    console.log('⚙️ Configuração encontrada:', nivelConfig);
    
    if (!nivelConfig) {
      console.warn(`❌ Configuração não encontrada para ${nivelUsuario} - ${profile.user_type}`);
      // Como fallback temporário, usar valores fixos baseados na imagem
      if (profile.user_type === 'vendedor') {
        switch (nivelUsuario) {
          case 'junior': return 7;
          case 'pleno': return 8;
          case 'senior': return 9;
          default: return 7;
        }
      }
      return 0;
    }
    
    const meta = profile.user_type === 'vendedor' ? 
      nivelConfig.meta_semanal_vendedor : 
      nivelConfig.meta_semanal_inbound || 0;
      
    console.log('🎯 Meta calculada:', meta);
    
    // Se a meta for 0 e for vendedor, usar valores padrão
    if (meta === 0 && profile.user_type === 'vendedor') {
      switch (nivelUsuario) {
        case 'junior': return 7;
        case 'pleno': return 8;
        case 'senior': return 9;
        default: return 7;
      }
    }
    
    return meta;
  };

  // Sincronizar metas com o nível atual do vendedor
  useEffect(() => {
    const sincronizarMetas = async () => {
      if (!profile?.id || metasSemanaisLoading) return;
      
      try {
        console.log(`🔄 CARLOS DEBUG - Iniciando sincronização para vendedor:`, {
          id: profile.id,
          email: profile.email,
          nome: profile.name,
          periodo: `${selectedMonth}/${selectedYear}`
        });
        
        const metasAtualizadas = await syncMetasWithNivel(profile.id, selectedYear, selectedMonth);
        
        console.log(`✅ CARLOS DEBUG - Metas sincronizadas:`, metasAtualizadas);
        console.log(`✅ CARLOS DEBUG - Total de metas atualizadas: ${metasAtualizadas.length}`);
        
      } catch (error) {
        console.error('❌ CARLOS DEBUG - Erro ao sincronizar metas:', error);
      }
    };
    
    sincronizarMetas();
  }, [profile?.id, selectedMonth, selectedYear, metasSemanaisLoading]);

  // Sincronizar comissões garantindo sempre fallback local válido
  useEffect(() => {
    const syncComissionsWithFallback = async () => {
      if (commissionsLoading || !profile?.id || regrasComissionamento.length === 0) return;
      
      console.log('🔄 Sincronizando comissões com fallback local garantido...');
      
      const newComissoes: {[key: string]: {valor: number, multiplicador: number, percentual: number}} = {};
      
      // Determinar ano para cache (usar anoParaExibir consistentemente)
      const { mesAtual, anoAtual } = getSemanaAtual() > 0 ? 
        (() => {
          const agora = new Date();
          return { mesAtual: agora.getMonth() + 1, anoAtual: agora.getFullYear() };
        })() : 
        { mesAtual: selectedMonth, anoAtual: selectedYear };
      
      const anoParaCache = (selectedMonth === mesAtual && selectedYear === anoAtual) ? anoAtual : selectedYear;
      
      // Obter todas as semanas do mês para calcular
      const semanasDoAno = getSemanasDoAno(anoParaCache);
      const semanasDoMesAtual = semanasDoAno.filter(semana => {
        const { end } = getWeekDatesFromNumber(anoParaCache, semana);
        const endMonth = end.getMonth() + 1;
        return endMonth === selectedMonth;
      });

      console.log(`📊 Calculando comissões para ${semanasDoMesAtual.length} semanas do mês ${selectedMonth}/${anoParaCache}`);

      // Processar cada semana, sempre calculando fallback local
      for (const semana of semanasDoMesAtual) {
        const cacheKey = `${anoParaCache}-${semana}`;
        
        // Tentar usar valor do servidor primeiro
        const serverComm = weeklyCommissions?.find(c => c.ano === anoParaCache && c.semana === semana);
        
        // Calcular pontos da semana usando a mesma lógica da tela
        const { start: startSemana, end: endSemana } = getWeekDatesFromNumber(anoParaCache, semana);
        const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
          if (venda.vendedor_id !== profile.id) return false;
          if (venda.status !== 'matriculado') return false;
          
          const dataVenda = getDataEfetivaVenda(venda, respostas);
          const vendaPeriod = getVendaEffectivePeriod(venda, respostas);
          
          const periodoCorreto = vendaPeriod.mes === selectedMonth && vendaPeriod.ano === anoParaCache;
          
          dataVenda.setHours(0, 0, 0, 0);
          const startSemanaUTC = new Date(startSemana);
          startSemanaUTC.setHours(0, 0, 0, 0);
          const endSemanaUTC = new Date(endSemana);
          endSemanaUTC.setHours(23, 59, 59, 999);
          const isInRange = dataVenda >= startSemanaUTC && dataVenda <= endSemanaUTC;
          
          return periodoCorreto && isInRange;
        }).reduce((total, { venda }) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

        // Obter meta semanal
        const metaSemanal = metasSemanais.find(meta => 
          meta.vendedor_id === profile.id && 
          meta.ano === anoParaCache && 
          meta.semana === semana
        );
        
        const metaVendas = metaSemanal?.meta_vendas || getMetaBaseadaNivel(semana);
        
        // Obter variável semanal do nível
        const nivelUsuario = profile.nivel || 'junior';
        const nivelConfig = niveis?.find(n => 
          n.nivel === nivelUsuario && n.tipo_usuario === profile.user_type
        );
        const variabelSemanal = nivelConfig?.variavel_semanal || 800;

        // Se servidor tem dados válidos (multiplicador > 0), usar ele
        if (serverComm && serverComm.multiplicador > 0) {
          newComissoes[cacheKey] = {
            valor: serverComm.valor,
            multiplicador: serverComm.multiplicador,
            percentual: serverComm.percentual
          };
          console.log(`💾 Servidor - Semana ${semana}: R$ ${serverComm.valor} (${serverComm.multiplicador}x)`);
        } else {
          // Senão, calcular localmente com regras pré-carregadas
          try {
            const fallbackComissao = await ComissionamentoService.calcularComissao(
              pontosDaSemana,
              metaVendas,
              variabelSemanal,
              'vendedor',
              regrasComissionamento
            );
            
            newComissoes[cacheKey] = fallbackComissao;
            console.log(`🔄 Fallback - Semana ${semana}: R$ ${fallbackComissao.valor} (${fallbackComissao.multiplicador}x) - Meta: ${metaVendas}, Pontos: ${pontosDaSemana}`);
          } catch (error) {
            console.error(`❌ Erro no fallback semana ${semana}:`, error);
            // Fallback básico se tudo der errado
            newComissoes[cacheKey] = { valor: 0, multiplicador: 0, percentual: 0 };
          }
        }
      }
      
      console.log('✅ Estado de comissões atualizado com fallback:', Object.keys(newComissoes).length, 'semanas');
      setComissoesPorSemana(newComissoes);
    };
    
    syncComissionsWithFallback();
  }, [weeklyCommissions, profile?.id, selectedYear, selectedMonth, regrasComissionamento, vendasWithResponses, metasSemanais, niveis]);

  // Função para exportar PDF do ano inteiro
  const exportarPDFAno = async () => {
    if (!profile?.id) return;
    
    // Evitar exportação enquanto dados estão carregando
    if (vendasLoading || metasSemanaisLoading || isLoadingResponses) {
      toast({
        title: "Aguarde",
        description: "Aguarde o carregamento dos dados antes de exportar.",
        variant: "destructive"
      });
      return;
    }
    
    setIsExportingPDF(true);
    
    try {
      const doc = new jsPDF();
      const vendedorInfo = vendedores.find(v => v.id === profile.id);
      const vendedorNome = vendedorInfo?.name || profile.name || 'Vendedor';
      
      // Título do documento
      doc.setFontSize(16);
      doc.text(`Metas Semanais ${selectedYear} - ${vendedorNome}`, 20, 20);
      
      let yPosition = 40;
      
      // Loop pelos 12 meses do ano
      for (let mes = 1; mes <= 12; mes++) {
        const nomesMeses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Título do mês
        doc.setFontSize(14);
        doc.text(`${nomesMeses[mes - 1]} ${selectedYear}`, 20, yPosition);
        yPosition += 10;
        
        // USAR A MESMA LÓGICA DA TELA - calcular mesParaExibir e anoParaExibir
        const { mesAtual, anoAtual } = getSemanaAtual() > 0 ? 
          (() => {
            const agora = new Date();
            return { mesAtual: agora.getMonth() + 1, anoAtual: agora.getFullYear() };
          })() : 
          { mesAtual: selectedMonth, anoAtual: selectedYear };
        
        const mesParaExibir = mes;
        const anoParaExibir = selectedYear;
        
        // Obter semanas do mês (mesma lógica da tela)
        const semanasDoAno = getSemanasDoAno(anoParaExibir);
        const semanasDoMes = semanasDoAno.filter(semana => {
          const { end } = getWeekDatesFromNumber(anoParaExibir, semana);
          // A semana pertence ao mês onde ela termina (terça-feira)
          const endMonth = end.getMonth() + 1;
          return endMonth === mesParaExibir;
        });
        
        if (semanasDoMes.length === 0) {
          doc.setFontSize(10);
          doc.text('Nenhuma semana encontrada para este mês', 20, yPosition);
          yPosition += 15;
          continue;
        }
        
        // Dados da tabela
        const tableData = [];
        let totalMeta = 0;
        let totalPontos = 0;
        let totalComissao = 0;
        
        for (const numeroSemana of semanasDoMes) {
          const metaSemanal = metasSemanais.find(meta => 
            meta.vendedor_id === profile.id && 
            meta.ano === selectedYear && 
            meta.semana === numeroSemana
          );
          
          const { start: startSemana, end: endSemana } = getWeekDatesFromNumber(selectedYear, numeroSemana);
          
          // USAR A MESMA LÓGICA EXATA DA TELA para calcular pontos
          const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
            if (venda.vendedor_id !== profile.id) return false;
            if (venda.status !== 'matriculado') return false;
            
            // PADRONIZADO: Usar função centralizada para obter data efetiva e período
            const dataVenda = getDataEfetivaVenda(venda, respostas);
            const vendaPeriod = getVendaEffectivePeriod(venda, respostas);
            
            // MESMA LÓGICA DA TELA
            const periodoCorreto = vendaPeriod.mes === mesParaExibir && vendaPeriod.ano === anoParaExibir;
            
            // Verificar se está na semana específica
            dataVenda.setHours(0, 0, 0, 0);
            const startSemanaUTC = new Date(startSemana);
            startSemanaUTC.setHours(0, 0, 0, 0);
            const endSemanaUTC = new Date(endSemana);
            endSemanaUTC.setHours(23, 59, 59, 999);
            const isInRange = dataVenda >= startSemanaUTC && dataVenda <= endSemanaUTC;
            
            const incluirVenda = periodoCorreto && isInRange;
            return incluirVenda;
          }).reduce((total, { venda }) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
          
          // Buscar comissão usando anoParaExibir consistentemente
          const chaveComissao = `${anoParaExibir}-${numeroSemana}`;
          const comissaoData = comissoesPorSemana[chaveComissao] || { valor: 0, multiplicador: 0 };
          
          // Formatação das datas
          const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const periodoSemana = `${formatDate(startSemana)} - ${formatDate(endSemana)}`;
          
          const metaVendas = metaSemanal?.meta_vendas || 0;
          const percentual = metaVendas > 0 ? Math.floor((pontosDaSemana / metaVendas) * 100) : 0;
          
          tableData.push([
            numeroSemana.toString(),
            periodoSemana,
            metaVendas.toString(),
            pontosDaSemana.toFixed(1),
            `${percentual}%`,
            `${comissaoData.multiplicador.toFixed(1)}x`,
            `R$ ${comissaoData.valor.toFixed(0)}`
          ]);
          
          totalMeta += metaVendas;
          totalPontos += pontosDaSemana;
          totalComissao += comissaoData.valor;
        }
        
        // Adicionar linha de total
        const percentualTotal = totalMeta > 0 ? Math.floor((totalPontos / totalMeta) * 100) : 0;
        tableData.push([
          'TOTAL',
          '-',
          totalMeta.toString(),
          totalPontos.toFixed(1),
          `${percentualTotal}%`,
          '-',
          `R$ ${totalComissao.toFixed(0)}`
        ]);
        
        // Criar tabela
        autoTable(doc, {
          startY: yPosition,
          head: [['Semana', 'Período', 'Meta', 'Pontos', '%', 'Mult.', 'Comissão']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 20, right: 20 }
        });
        
        // Atualizar posição Y
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Salvar o PDF
      doc.save(`metas-semanais-${selectedYear}-${vendedorNome.replace(/\s+/g, '-')}.pdf`);
      
      toast({
        title: "PDF Exportado",
        description: `Relatório anual de metas semanais salvo com sucesso.`
      });
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro na Exportação",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (vendasLoading || metasSemanaisLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">Carregando metas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get current period based on today's date
  const { mes: mesCorretoSemana, ano: anoCorretoSemana } = getVendaPeriod(new Date());
  
  // Decidir qual mês/ano usar para exibir - priorizar a semana atual se estiver selecionada
  // Usar diretamente a lógica de semanas, sem usar new Date().getMonth()
  const semanaAtual = getSemanaAtual();
  
  // Se o mês/ano selecionado corresponde ao mês/ano da semana atual, mostrar o mês da semana
  // Senão, mostrar o mês selecionado normalmente
  const { mesParaExibir, anoParaExibir, isSemanaAtual } = 
    (selectedMonth === mesCorretoSemana && selectedYear === anoCorretoSemana)
    ? { 
        mesParaExibir: mesCorretoSemana, 
        anoParaExibir: anoCorretoSemana, 
        isSemanaAtual: true 
      }
    : { 
        mesParaExibir: selectedMonth, 
        anoParaExibir: selectedYear, 
        isSemanaAtual: false 
      };

  // Determine weeks to display for the selected month/year
  const semanasDoAno = getSemanasDoAno(anoParaExibir);
  const semanasDoMes = semanasDoAno.filter(semana => {
    const { end } = getWeekDatesFromNumber(anoParaExibir, semana);
    // A semana pertence ao mês onde ela termina (terça-feira)
    const endMonth = end.getMonth() + 1;
    return endMonth === mesParaExibir;
  });

  const mesNome = new Date(anoParaExibir, mesParaExibir - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  console.log('🔍 DEBUG VendedorMetas:');
  console.log('  📅 Selecionado:', selectedMonth, '/', selectedYear);
  console.log('  📅 Semana atual pertence a:', mesCorretoSemana, '/', anoCorretoSemana);
  console.log('  📅 Exibindo:', mesParaExibir, '/', anoParaExibir);
  console.log('  📅 É semana atual?', isSemanaAtual);
  
  // Debug específico para agosto 2025
  if (selectedMonth === 8 && selectedYear === 2025) {
    debugSemanasAgosto2025();
    
    // Debug das vendas do vendedor teste
    if (profile?.name?.includes('teste')) {
      const vendasMatriculadas = vendas.filter(v => 
        v.vendedor_id === profile.id && v.status === 'matriculado'
      );
      
      console.log(`🎯 VENDEDOR TESTE - Total de vendas matriculadas:`, vendasMatriculadas.length);
      vendasMatriculadas.forEach(v => {
        console.log(`  📝 Venda ${v.id.substring(0, 8)}: ${v.aluno?.nome} - ${v.pontuacao_validada || v.pontuacao_esperada} pts - Data assinatura: ${v.data_assinatura_contrato || 'N/A'} - Enviado: ${v.enviado_em}`);
      });
    }
  }
  
  // Só buscar meta da semana atual se estivermos no mês correto da semana
  const metaSemanaAtual = isSemanaAtual
    ? metasSemanais.find(meta => 
        meta.vendedor_id === profile.id && 
        meta.ano === anoCorretoSemana && 
        meta.semana === semanaAtual
      )
    : null;


  return (
    <div className="space-y-4">
      {/* Metas Semanais Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Metas Semanais - {mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
              {isSemanaAtual && (
                <Badge variant="default" className="text-xs">
                  Semana Atual
                </Badge>
              )}
            </div>
            {/* <Button
              onClick={exportarPDFAno}
              disabled={isExportingPDF}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              {isExportingPDF ? 'Exportando...' : `Exportar PDF do Ano ${selectedYear}`}
            </Button> */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-9 gap-2 p-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground border-b">
              <div>Semana</div>
              <div>Período</div>
              <div>Base</div>
              <div>Meta</div>
              <div>Pontos</div>
              <div>%</div>
              <div>Mult.</div>
              <div>Comissão</div>
              <div>Status</div>
            </div>
            
            {/* Linhas das semanas */}
            {semanasDoMes.map((numeroSemana) => {
              // Buscar meta semanal para o mês e semana específicos (usando os valores corretos)
              const metaSemanal = metasSemanais.find(meta => 
                meta.vendedor_id === profile.id && 
                meta.ano === anoParaExibir && 
                meta.semana === numeroSemana
              );
              
              // Verificar se é a semana atual (apenas se estivermos vendo o mês da semana atual)
              const isAtual = isSemanaAtual && numeroSemana === semanaAtual;
              
              // Use getWeekDatesFromNumber for week dates
              const { start: startSemana, end: endSemana } = getWeekDatesFromNumber(anoParaExibir, numeroSemana);

              // Formatar datas para exibição (DD/MM)
              const formatDate = (date: Date) => {
                return date.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit' 
                });
              };

              const periodoSemana = `${formatDate(startSemana)} - ${formatDate(endSemana)}`;

              // Calcular pontos da semana usando data de assinatura do contrato
              // CORREÇÃO: Verificar se a venda realmente pertence ao período selecionado
              const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
                if (venda.vendedor_id !== profile.id) return false;
                if (venda.status !== 'matriculado') return false;
                
                // PADRONIZADO: Usar função centralizada para obter data efetiva e período
                const dataVenda = getDataEfetivaVenda(venda, respostas);
                const vendaPeriod = getVendaEffectivePeriod(venda, respostas);
                
                // Debug específico para Pedro Garbelini
                if (venda.id === '53af0209-9b2d-4b76-b6a2-2c9d8e4f7a8c' || 
                    (venda.aluno && (venda.aluno.nome === 'Pedro Garbelini' || venda.aluno.nome?.includes('Pedro')))) {
                  console.log(`🚨 PEDRO GARBELINI - VendedorMetas semanas:`, {
                    venda_id: venda.id?.substring(0, 8),
                    aluno: venda.aluno?.nome,
                    data_efetiva: dataVenda.toISOString(),
                    data_efetiva_br: dataVenda.toLocaleDateString('pt-BR'),
                    periodo_calculado: vendaPeriod,
                    data_assinatura_contrato: venda.data_assinatura_contrato,
                    data_enviado: venda.enviado_em,
                    status: venda.status,
                    numero_semana: numeroSemana
                  });
                }
                const periodoCorreto = vendaPeriod.mes === mesParaExibir && vendaPeriod.ano === anoParaExibir;
                
                // Verificar se está na semana específica
                dataVenda.setHours(0, 0, 0, 0);
                const startSemanaUTC = new Date(startSemana);
                startSemanaUTC.setHours(0, 0, 0, 0);
                const endSemanaUTC = new Date(endSemana);
                endSemanaUTC.setHours(23, 59, 59, 999);
                const isInRange = dataVenda >= startSemanaUTC && dataVenda <= endSemanaUTC;
                
                // Só incluir se AMBOS forem verdadeiros: está na semana E pertence ao período
                const incluirVenda = periodoCorreto && isInRange;
                
                // Debug para vendedor teste
                if (venda.status === 'matriculado' && profile?.name?.includes('teste')) {
                  console.log(`🔍 VENDEDOR TESTE - Análise venda:`, {
                    venda_id: venda.id.substring(0, 8),
                    aluno: venda.aluno?.nome,
                    data_assinatura_contrato: venda.data_assinatura_contrato,
                    data_usada: dataVenda.toLocaleDateString('pt-BR'),
                    pontos: venda.pontuacao_validada || venda.pontuacao_esperada || 0,
                    venda_period: vendaPeriod,
                    periodo_exibindo: `${mesParaExibir}/${anoParaExibir}`,
                    periodo_correto: periodoCorreto,
                    semana_periodo: `${formatDate(startSemana)} - ${formatDate(endSemana)}`,
                    numero_semana: numeroSemana,
                    isInRange,
                    incluir_venda: incluirVenda,
                    motivo: !incluirVenda ? (
                      !periodoCorreto ? 'Período incorreto' : 'Fora da semana'
                    ) : 'Incluído'
                  });
                }
                
                return incluirVenda;
              }).reduce((total, { venda }) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
              
              console.log(`📊 Semana ${numeroSemana} - Total de pontos: ${pontosDaSemana}`);

              // Buscar valor da variável semanal do nível do vendedor
              const vendedorInfo = vendedores.find(v => v.id === profile.id);
              const vendedorNivel = vendedorInfo?.nivel || 'junior';
              const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
              const variavelSemanal = nivelConfig?.variavel_semanal || 0;

              // CORREÇÃO: Usar metasSemanais como fonte única da verdade para meta e cálculo
              const progressoSemanal = metaSemanal?.meta_vendas > 0 
                ? (pontosDaSemana / metaSemanal.meta_vendas) * 100 
                : 0;

              // Buscar dados de comissão calculados using the new key format
              const chaveComissao = `${anoParaExibir}-${numeroSemana}`;
              const comissaoData = comissoesPorSemana[chaveComissao] || {
                valor: 0,
                multiplicador: 0,
                percentual: 0
              };
              
              return (
                <div 
                  key={numeroSemana} 
                  className={`grid grid-cols-9 gap-2 p-2 text-xs border rounded hover:bg-muted/30 transition-colors ${
                    isAtual ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-card'
                  }`}
                >
                  {/* Semana */}
                  <div className="flex items-center gap-1 font-medium">
                    <span>{numeroSemana}</span>
                    {isAtual && (
                      <Badge variant="default" className="text-[10px] h-4 px-1">
                        Atual
                      </Badge>
                    )}
                  </div>
                  
                  {/* Período */}
                  <div className="text-muted-foreground text-[10px] flex items-center">
                    {periodoSemana}
                  </div>
                  
                  {/* Base (Variável Semanal) */}
                  <div className="font-medium text-muted-foreground text-[10px] flex items-center">
                    R$ {variavelSemanal.toLocaleString('pt-BR')}
                  </div>
                  
                  {/* Meta */}
                  <div className="flex items-center">
                    <Badge variant="default" className="text-[10px] h-4 px-1">
                      {metaSemanal?.meta_vendas || 0}
                    </Badge>
                  </div>
                  
                  {/* Pontos */}
                  <div className="flex items-center font-medium">
                    {pontosDaSemana.toFixed(1)}
                  </div>
                   
                   {/* Percentual */}
                   <div className="flex items-center">
                     <span className={`font-medium ${
                       progressoSemanal >= 100 ? 'text-green-600' : 
                       progressoSemanal >= 80 ? 'text-yellow-600' : 'text-muted-foreground'
                     }`}>
                       {Math.floor(progressoSemanal)}%
                     </span>
                   </div>
                  
                  {/* Multiplicador */}
                  <div className="flex items-center">
                    <Badge variant={comissaoData.multiplicador > 0 ? "default" : "secondary"} className="text-[10px] h-4 px-1">
                      {comissaoData.multiplicador.toFixed(1)}x
                    </Badge>
                  </div>
                  
                  {/* Comissão */}
                  <div className="flex items-center font-medium text-green-600">
                    R$ {comissaoData.valor.toFixed(0)}
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center justify-center gap-1">
                    {metaSemanal && pontosDaSemana >= metaSemanal.meta_vendas && (
                      <Trophy className="h-3 w-3 text-green-500" />
                    )}
                    {comissaoData.valor > 0 && (
                      <DollarSign className="h-3 w-3 text-green-600" />
                    )}
                    {!metaSemanal && (
                      <span className="text-muted-foreground text-[10px]">N/D</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Linha de Total */}
            {semanasDoMes.length > 0 && (
              <div className="grid grid-cols-9 gap-2 p-2 text-xs font-medium bg-muted/70 rounded border-t-2 border-primary/20">
                <div>TOTAL</div>
                <div className="text-muted-foreground">-</div>
                <div className="text-muted-foreground">-</div>
                <div className="font-bold">
                  {semanasDoMes.reduce((total, numeroSemana) => {
                    const metaSemanal = metasSemanais.find(meta => 
                      meta.vendedor_id === profile.id && 
                      meta.ano === anoParaExibir && 
                      meta.semana === numeroSemana
                    );
                    return total + (metaSemanal?.meta_vendas || 0);
                  }, 0)}
                </div>
                <div className="font-bold text-primary">
                  {semanasDoMes.reduce((total, numeroSemana) => {
                    const { start: startSemana, end: endSemana } = getWeekDatesFromNumber(anoParaExibir, numeroSemana);
                    
                    const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
                      if (venda.vendedor_id !== profile.id) return false;
                      if (venda.status !== 'matriculado') return false;
                      
        // PADRONIZADO: Usar função centralizada
        const respostasVenda = vendasWithResponses.find(({ venda: v }) => v.id === venda.id);
        const vendaDate = getDataEfetivaVenda(venda, respostasVenda?.respostas);
                      
                      // CORREÇÃO: Aplicar a mesma lógica de validação de período
                      const vendaPeriod = getVendaPeriod(vendaDate);
                      const periodoCorreto = vendaPeriod.mes === mesParaExibir && vendaPeriod.ano === anoParaExibir;
                      
                      // Verificar se está na semana específica
                      vendaDate.setHours(0, 0, 0, 0);
                      const startSemanaUTC = new Date(startSemana);
                      startSemanaUTC.setHours(0, 0, 0, 0);
                      const endSemanaUTC = new Date(endSemana);
                      endSemanaUTC.setHours(23, 59, 59, 999);
                      const isInRange = vendaDate >= startSemanaUTC && vendaDate <= endSemanaUTC;
                      
                      return periodoCorreto && isInRange;
                    }).reduce((sum, { venda }) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                    
                    return total + pontosDaSemana;
                  }, 0).toFixed(1)}
                </div>
                <div className="font-bold">
                   {(() => {
                     // CORREÇÃO: Usar metasSemanais como fonte única da verdade
                     const totalMetaNivel = semanasDoMes.reduce((total, numeroSemana) => {
                       const metaSemanal = metasSemanais.find(meta => 
                         meta.vendedor_id === profile.id && 
                         meta.ano === anoParaExibir && 
                         meta.semana === numeroSemana
                       );
                       return total + (metaSemanal?.meta_vendas || 0);
                     }, 0);
                     
                     const totalPontos = semanasDoMes.reduce((total, numeroSemana) => {
                        const { start: startSemana, end: endSemana } = getWeekDatesFromNumber(anoParaExibir, numeroSemana);
                       
                       const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
                         if (venda.vendedor_id !== profile.id) return false;
                         if (venda.status !== 'matriculado') return false;
                         
          // PADRONIZADO: Usar função centralizada
          const respostasVenda = vendasWithResponses.find(({ venda: v }) => v.id === venda.id);
          const dataVenda = getDataEfetivaVenda(venda, respostasVenda?.respostas);
                         
                          // CORREÇÃO: Aplicar a mesma lógica de validação de período
                          const vendaPeriod = getVendaPeriod(dataVenda);
                          const periodoCorreto = vendaPeriod.mes === mesParaExibir && vendaPeriod.ano === anoParaExibir;
                          
                          // Verificar se está na semana específica
                          dataVenda.setHours(0, 0, 0, 0);
                          const startSemanaUTC = new Date(startSemana);
                          startSemanaUTC.setHours(0, 0, 0, 0);
                          const endSemanaUTC = new Date(endSemana);
                          endSemanaUTC.setHours(23, 59, 59, 999);
                          const isInRange = dataVenda >= startSemanaUTC && dataVenda <= endSemanaUTC;
                         
                         return periodoCorreto && isInRange;
                       }).reduce((sum, { venda }) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                       
                       return total + pontosDaSemana;
                     }, 0);
                     
                      const percentualTotal = totalMetaNivel > 0 ? (totalPontos / totalMetaNivel) * 100 : 0;
                      return `${Math.floor(percentualTotal)}%`;
                   })()}
                </div>
                <div>-</div>
                 <div className="font-bold text-green-600">
                   R$ {(() => {
                     // Calcular comissão total corrigida
                     let totalComissao = 0;
                     
                     // Buscar valor da variável semanal do nível do vendedor
                     const vendedorInfo = vendedores.find(v => v.id === profile.id);
                     const vendedorNivel = vendedorInfo?.nivel || 'junior';
                     const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
                     const variavelSemanal = nivelConfig?.variavel_semanal || 0;
                     
                        semanasDoMes.forEach(numeroSemana => {
                          // Use new key format that matches the calculation
                          const chaveComissao = `${anoParaExibir}-${numeroSemana}`;
                          const comissaoData = comissoesPorSemana[chaveComissao];
                          if (comissaoData) {
                            totalComissao += comissaoData.valor;
                          }
                        });
                     
                     return totalComissao.toFixed(0);
                   })()}
                 </div>
                <div className="flex justify-center">
                  {Object.values(comissoesPorSemana).some(c => c.valor > 0) && (
                    <DollarSign className="h-3 w-3 text-green-600" />
                  )}
                </div>
              </div>
            )}
          </div>
          {semanasDoMes.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma semana encontrada para este período</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorMetas;