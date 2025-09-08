import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  scope: 'user-week' | 'user-month' | 'current-week-all';
  userId?: string;
  userType?: 'vendedor' | 'sdr' | 'supervisor';
  ano?: number;
  semana?: number;
  mes?: number;
}

interface ComissionamentoData {
  user_id: string;
  user_type: string;
  ano: number;
  semana: number;
  pontos: number;
  meta: number;
  percentual: number;
  multiplicador: number;
  variavel: number;
  valor: number;
  regra_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Edge Function iniciada - recalc-weekly-commissions');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('🔑 Variáveis de ambiente:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    console.log('📊 Recalculando comissionamentos:', body);

    const { scope, userId, userType, ano, semana, mes } = body;

    // Buscar regras de comissionamento (cache local)
    console.log('📋 Buscando regras de comissionamento...');
    const { data: regras, error: regrasError } = await supabase
      .from('regras_comissionamento')
      .select('*')
      .order('percentual_minimo');

    if (regrasError) {
      console.error('❌ Erro ao buscar regras:', regrasError);
      throw regrasError;
    }

    console.log('📋 Regras encontradas:', regras?.length || 0);

    if (!regras?.length) {
      throw new Error('Nenhuma regra de comissionamento encontrada');
    }

    const resultados: ComissionamentoData[] = [];

    if (scope === 'user-week' && userId && userType && ano && semana) {
      const resultado = await calcularComissionamentoUsuario(supabase, userId, userType, ano, semana, regras);
      if (resultado) resultados.push(resultado);
    } 
    else if (scope === 'user-month' && userId && userType && ano && mes) {
      // Calcular todas as semanas do mês
      const semanas = await getSemanasDoMes(ano, mes);
      for (const s of semanas) {
        const resultado = await calcularComissionamentoUsuario(supabase, userId, userType, ano, s, regras);
        if (resultado) resultados.push(resultado);
      }
    }
    else if (scope === 'current-week-all') {
      // Pegar todos os usuários ativos e calcular a semana atual
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentWeek = getNumeroSemana(now);

      const { data: usuarios } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('ativo', true)
        .in('user_type', ['vendedor', 'sdr']);

      if (usuarios) {
        for (const user of usuarios) {
          const resultado = await calcularComissionamentoUsuario(
            supabase, 
            user.id, 
            user.user_type, 
            currentYear, 
            currentWeek, 
            regras
          );
          if (resultado) resultados.push(resultado);
        }
      }
    }

    // Upsert resultados na tabela
    if (resultados.length > 0) {
      const { error } = await supabase
        .from('comissionamentos_semanais')
        .upsert(resultados, { 
          onConflict: 'user_id,user_type,ano,semana',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('❌ Erro ao salvar comissionamentos:', error);
        throw error;
      }
    }

    console.log(`✅ ${resultados.length} comissionamentos calculados e salvos`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: resultados.length,
        resultados: resultados.slice(0, 5) // Amostra para debug
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function calcularComissionamentoUsuario(
  supabase: any,
  userId: string,
  userType: string,
  ano: number,
  semana: number,
  regras: any[]
): Promise<ComissionamentoData | null> {
  try {
    const { startDate, endDate } = getDatasSemana(ano, semana);
    
    let pontos = 0;
    let meta = 0;
    let variavel = 0;

    if (userType === 'vendedor') {
      // Calcular pontos das vendas matriculadas
      console.log(`📊 Buscando vendas para vendedor ${userId} na semana ${semana}/${ano}`);
      
      const { data: vendas, error: vendasError } = await supabase
        .from('form_entries')
        .select('pontuacao_validada, pontuacao_esperada, data_aprovacao, data_assinatura_contrato, enviado_em')
        .eq('vendedor_id', userId)
        .eq('status', 'matriculado');

      if (vendasError) {
        console.error('❌ Erro ao buscar vendas:', vendasError);
        throw vendasError;
      }

      console.log(`📊 Total de vendas matriculadas encontradas: ${vendas?.length || 0}`);

      // Filtrar vendas da semana específica
      const vendasDaSemana = vendas?.filter(venda => {
        // Usar a mesma lógica do frontend para data efetiva
        const dataEfetiva = venda.data_assinatura_contrato 
          ? new Date(venda.data_assinatura_contrato)
          : new Date(venda.data_aprovacao || venda.enviado_em);
        
        return dataEfetiva >= startDate && dataEfetiva <= endDate;
      }) || [];

      console.log(`📊 Vendas da semana ${semana}: ${vendasDaSemana.length} vendas`);

      pontos = vendasDaSemana.reduce((sum: number, venda: any) => 
        sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

      console.log(`📊 Total de pontos calculados: ${pontos}`);

      // Buscar meta semanal
      const { data: metaData } = await supabase
        .from('metas_semanais_vendedores')
        .select('meta_vendas')
        .eq('vendedor_id', userId)
        .eq('ano', ano)
        .eq('semana', semana)
        .single();

      meta = metaData?.meta_vendas || 0;

      // Buscar variável do nível
      const { data: profile } = await supabase
        .from('profiles')
        .select('nivel')
        .eq('id', userId)
        .single();

      if (profile?.nivel) {
        const { data: nivelData } = await supabase
          .from('niveis_vendedores')
          .select('variavel_semanal')
          .eq('nivel', profile.nivel)
          .eq('tipo_usuario', 'vendedor')
          .single();

        variavel = nivelData?.variavel_semanal || 0;
      }

    } else if (userType === 'sdr') {
      // Contar reuniões realizadas
      const { data: reunioes } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('sdr_id', userId)
        .eq('status', 'finalizado')
        .in('resultado_reuniao', ['presente', 'compareceu', 'realizada'])
        .gte('data_agendamento', startDate.toISOString())
        .lte('data_agendamento', endDate.toISOString());

      pontos = reunioes?.length || 0;

      // Buscar meta e variável do nível SDR
      const { data: profile } = await supabase
        .from('profiles')
        .select('nivel, user_type')
        .eq('id', userId)
        .single();

      if (profile?.nivel) {
        const metaField = profile.user_type === 'sdr_inbound' ? 'meta_semanal_inbound' : 'meta_semanal_outbound';
        
        const { data: nivelData } = await supabase
          .from('niveis_vendedores')
          .select(`${metaField}, variavel_semanal`)
          .eq('nivel', profile.nivel)
          .eq('tipo_usuario', 'vendedor') // SDRs usam mesmo nível que vendedores
          .single();

        meta = nivelData?.[metaField] || 0;
        variavel = nivelData?.variavel_semanal || 0;
      }
    }

    // Calcular percentual e encontrar regra
    const percentual = meta > 0 ? (pontos / meta) * 100 : 0;
    const percentualFloor = Math.floor(percentual);
    
    const regra = regras
      .filter(r => r.tipo_usuario === userType)
      .find(r => percentualFloor >= r.percentual_minimo && 
                (r.percentual_maximo >= percentualFloor || r.percentual_maximo >= 999));

    const multiplicador = regra?.multiplicador || 1;
    const valor = variavel * multiplicador;

    return {
      user_id: userId,
      user_type: userType,
      ano,
      semana,
      pontos,
      meta,
      percentual,
      multiplicador,
      variavel,
      valor,
      regra_id: regra?.id
    };

  } catch (error) {
    console.error(`❌ Erro ao calcular comissionamento para ${userId}:`, error);
    return null;
  }
}

function getDatasSemana(ano: number, semana: number) {
  // Semana começa na quarta-feira
  const startOfYear = new Date(ano, 0, 1);
  let firstWednesday = new Date(startOfYear);
  
  // Encontrar primeira quarta-feira do ano
  while (firstWednesday.getDay() !== 3) {
    firstWednesday.setDate(firstWednesday.getDate() + 1);
  }
  
  const startDate = new Date(firstWednesday);
  startDate.setDate(startDate.getDate() + (semana - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

function getNumeroSemana(date: Date): number {
  const ano = date.getFullYear();
  const startOfYear = new Date(ano, 0, 1);
  
  // Encontrar primeira quarta-feira do ano
  let firstWednesday = new Date(startOfYear);
  while (firstWednesday.getDay() !== 3) {
    firstWednesday.setDate(firstWednesday.getDate() + 1);
  }
  
  // Se está antes da primeira quarta, pertence à última semana do ano anterior
  if (date < firstWednesday) {
    return getNumeroSemana(new Date(ano - 1, 11, 31));
  }
  
  const diffTime = date.getTime() - firstWednesday.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.floor(diffDays / 7) + 1;
}

async function getSemanasDoMes(ano: number, mes: number): Promise<number[]> {
  // Simplificado: assumir 4-5 semanas por mês
  const semanas = [];
  for (let s = 1; s <= 53; s++) {
    const { startDate, endDate } = getDatasSemana(ano, s);
    if (startDate.getMonth() + 1 === mes || endDate.getMonth() + 1 === mes) {
      semanas.push(s);
    }
  }
  return semanas;
}