import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EffectiveSalesService } from '@/services/vendas/EffectiveSalesService';

export const useAgendamentosPorVendedorSemana = (
  vendedorId: string,
  startDate: Date,
  endDate: Date
) => {
  const [convertidas, setConvertidas] = useState<any[]>([]);
  const [pendentesReuniao, setPendentesReuniao] = useState<any[]>([]);
  const [pendentesPorVenda, setPendentesPorVenda] = useState<any[]>([]);
  const [compareceram, setCompareceram] = useState<any[]>([]);
  const [naoCompareceram, setNaoCompareceram] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 1. Buscar agendamentos do vendedor na semana
        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select(`
            *,
            leads (
              id,
              nome,
              email,
              whatsapp
            )
          `)
          .eq('vendedor_id', vendedorId)
          .gte('data_agendamento', startDate.toISOString())
          .lte('data_agendamento', endDate.toISOString());

        if (agendamentosError) {
          console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
          return;
        }

        // 2. Buscar vendas efetivas (convertidas) do vendedor no período
        const vendasEfetivas = await EffectiveSalesService.getMatriculasByEffectiveDate(
          vendedorId,
          startDate,
          endDate
        );

        // 3. Buscar dados das vendas convertidas (curso, aluno)
        const convertidassWithDetails: any[] = [];
        for (const venda of vendasEfetivas) {
          const { data: vendaDetalhes, error } = await supabase
            .from('form_entries')
            .select(`
              *,
              alunos (
                nome,
                email
              ),
              cursos (
                nome
              )
            `)
            .eq('id', venda.id)
            .single();

          if (!error && vendaDetalhes) {
            // Tentar encontrar o agendamento relacionado
            const agendamentoRelacionado = agendamentos?.find(ag => 
              ag.resultado_reuniao === 'comprou' || 
              ag.resultado_reuniao === 'compareceu'
            );

            convertidassWithDetails.push({
              ...vendaDetalhes,
              data_efetiva: venda.data_efetiva,
              agendamento: agendamentoRelacionado,
              // Para compatibilidade com o modal
              data_agendamento: agendamentoRelacionado?.data_agendamento || venda.enviado_em,
              leads: agendamentoRelacionado?.leads || {
                nome: vendaDetalhes.alunos?.nome || 'Nome não encontrado',
                email: vendaDetalhes.alunos?.email
              },
              curso: vendaDetalhes.cursos
            });
          }
        }

        // 4. Categorizar agendamentos
        const agendamentosCompareceram: any[] = [];
        const agendamentosNaoCompareceram: any[] = [];
        const pendentesReuniaoDados: any[] = [];

        agendamentos?.forEach(agendamento => {
          switch (agendamento.resultado_reuniao) {
            case 'compareceu':
            case 'compareceu_nao_comprou':
            case 'presente':
            case 'realizada':
              agendamentosCompareceram.push(agendamento);
              // Se compareceu mas não tem venda convertida nesta semana, é pendente
              const temVendaConvertida = vendasEfetivas.some(v => 
                // Verificar se existe relação entre agendamento e venda (pode ser por timing ou lead)
                Math.abs(new Date(v.enviado_em).getTime() - new Date(agendamento.data_agendamento).getTime()) < (7 * 24 * 60 * 60 * 1000)
              );
              if (!temVendaConvertida) {
                pendentesReuniaoDados.push(agendamento);
              }
              break;
            case 'nao_compareceu':
            case 'faltou':
              agendamentosNaoCompareceram.push(agendamento);
              break;
            default:
              // Resultado null ou outros estados
              if (agendamento.resultado_reuniao === null) {
                pendentesReuniaoDados.push(agendamento);
              }
          }
        });

        // 5. Buscar vendas pendentes do vendedor (usando enviado_em como proxy)
        const { data: vendasPendentes, error: vendasPendentesError } = await supabase
          .from('form_entries')
          .select(`
            *,
            alunos (
              nome,
              email
            ),
            cursos (
              nome
            )
          `)
          .eq('vendedor_id', vendedorId)
          .eq('status', 'pendente')
          .gte('enviado_em', startDate.toISOString())
          .lte('enviado_em', endDate.toISOString());

        const pendentesPorVendaDados = vendasPendentes?.map(venda => ({
          ...venda,
          data_agendamento: venda.enviado_em,
          leads: {
            nome: venda.alunos?.nome || 'Nome não encontrado',
            email: venda.alunos?.email
          },
          curso: venda.cursos,
          resultado_reuniao: 'venda_pendente'
        })) || [];

        // 6. Atualizar estados
        setConvertidas(convertidassWithDetails);
        setPendentesReuniao(pendentesReuniaoDados);
        setPendentesPorVenda(pendentesPorVendaDados);
        setCompareceram(agendamentosCompareceram);
        setNaoCompareceram(agendamentosNaoCompareceram);

        console.log(`📊 useAgendamentosPorVendedorSemana: ${vendedorId}`, {
          periodo: `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`,
          convertidas: convertidassWithDetails.length,
          pendentes_reuniao: pendentesReuniaoDados.length,
          pendentes_venda: pendentesPorVendaDados.length,
          compareceram: agendamentosCompareceram.length,
          nao_compareceram: agendamentosNaoCompareceram.length
        });

      } catch (error) {
        console.error('❌ Erro ao buscar dados do vendedor:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (vendedorId && startDate && endDate) {
      fetchData();
    }
  }, [vendedorId, startDate, endDate]);

  return {
    convertidas,
    pendentesReuniao,
    pendentesPorVenda,
    compareceram,
    naoCompareceram,
    isLoading
  };
};