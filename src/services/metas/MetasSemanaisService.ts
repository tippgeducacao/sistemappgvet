import { supabase } from '@/integrations/supabase/client';

export interface MetaSemanalVendedor {
  id: string;
  vendedor_id: string;
  ano: number;
  semana: number;
  meta_vendas: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface NivelVendedor {
  id: string;
  nivel: string;
  tipo_usuario: string;
  meta_semanal_inbound: number;
  meta_semanal_outbound: number;
  meta_vendas_cursos: number;
  meta_semanal_vendedor: number;
}

export class MetasSemanaisService {
  // Função auxiliar para obter semanas do mês
  static getSemanasDoMes(ano: number, mes: number): number[] {
    const semanas: number[] = [];
    
    // Último dia do mês
    const ultimaDataMes = new Date(ano, mes, 0);
    
    // Primeira semana do ano
    const primeiroDiaAno = new Date(ano, 0, 1);
    const primeiroDiaSemana = primeiroDiaAno.getDay();
    let primeiraSegunda = new Date(ano, 0, 1);
    
    if (primeiroDiaSemana !== 1) {
      const diasParaSegunda = primeiroDiaSemana === 0 ? 1 : 8 - primeiroDiaSemana;
      primeiraSegunda.setDate(primeiroDiaAno.getDate() + diasParaSegunda);
    }
    
    // Calcular para cada semana do ano
    for (let semanaDoAno = 1; semanaDoAno <= 53; semanaDoAno++) {
      const inicioSemana = new Date(primeiraSegunda);
      inicioSemana.setDate(primeiraSegunda.getDate() + (semanaDoAno - 1) * 7);
      
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      
      // A semana pertence ao mês se pelo menos um dia está no mês
      if ((inicioSemana.getFullYear() === ano && inicioSemana.getMonth() === mes - 1) ||
          (fimSemana.getFullYear() === ano && fimSemana.getMonth() === mes - 1)) {
        semanas.push(semanaDoAno);
      }
      
      // Parar se já passou do ano
      if (inicioSemana.getFullYear() > ano) break;
    }
    
    return semanas;
  }

  static async buscarMetasVendedor(vendedorId: string, ano?: number, mes?: number): Promise<MetaSemanalVendedor[]> {
    let query = supabase
      .from('metas_semanais_vendedores')
      .select('*')
      .eq('vendedor_id', vendedorId);

    if (ano) {
      query = query.eq('ano', ano);
    }

    const { data, error } = await query.order('ano', { ascending: false }).order('semana', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar metas semanais:', error);
      throw error;
    }

    console.log(`📊 Metas encontradas para vendedor ${vendedorId}:`, data?.length || 0);
    
    // Se especificou um mês, filtrar apenas as semanas que pertencem ao mês
    if (mes && data) {
      const semanasDoMes = this.getSemanasDoMes(ano || new Date().getFullYear(), mes);
      console.log(`📅 Semanas do mês ${mes}/${ano}:`, semanasDoMes);
      
      const metasFiltradas = data.filter(meta => semanasDoMes.includes(meta.semana));
      console.log(`✅ Metas filtradas para o mês:`, metasFiltradas.length);
      
      return metasFiltradas;
    }

    return data || [];
  }

  static async buscarNivelVendedor(vendedorId: string): Promise<{ nivel: string; tipo_usuario: string }> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('nivel, user_type')
      .eq('id', vendedorId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar perfil do vendedor:', error);
      throw error;
    }

    return {
      nivel: profile.nivel || 'junior',
      tipo_usuario: profile.user_type || 'sdr'
    };
  }

  static async buscarConfiguracoesNivel(nivel: string, tipoUsuario: string): Promise<NivelVendedor | null> {
    const { data, error } = await supabase
      .from('niveis_vendedores')
      .select('*')
      .eq('nivel', nivel)
      .eq('tipo_usuario', tipoUsuario)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar configurações do nível:', error);
      return null;
    }

    return data;
  }

  static async criarMetasSemanaisAutomaticamente(vendedorId: string, ano: number, mes: number): Promise<MetaSemanalVendedor[]> {
    console.log(`🔄 Criando metas semanais para vendedor ${vendedorId}, período: ${mes}/${ano}`);

    // Buscar perfil do vendedor
    const perfilVendedor = await this.buscarNivelVendedor(vendedorId);
    console.log(`👤 Perfil do vendedor:`, perfilVendedor);

    // Buscar configurações do nível
    const configNivel = await this.buscarConfiguracoesNivel(perfilVendedor.nivel, perfilVendedor.tipo_usuario);
    if (!configNivel) {
      console.warn(`⚠️ Configuração de nível não encontrada para ${perfilVendedor.nivel} - ${perfilVendedor.tipo_usuario}`);
      return [];
    }

    console.log(`⚙️ Configuração do nível:`, configNivel);

    // Buscar semanas do mês
    const semanasDoMes = this.getSemanasDoMes(ano, mes);
    console.log(`📅 Semanas do mês ${mes}/${ano}:`, semanasDoMes);

    const metasCriadas: MetaSemanalVendedor[] = [];

    for (const semana of semanasDoMes) {
      // Verificar se já existe meta para esta semana
      const { data: metaExistente } = await supabase
        .from('metas_semanais_vendedores')
        .select('*')
        .eq('vendedor_id', vendedorId)
        .eq('ano', ano)
        .eq('semana', semana)
        .single();

      if (metaExistente) {
        console.log(`✅ Meta já existe para semana ${semana}/${ano}`);
        metasCriadas.push(metaExistente);
        continue;
      }

      // Criar nova meta baseada no tipo de usuário
      const novaMeta = {
        vendedor_id: vendedorId,
        ano,
        semana,
        meta_vendas: perfilVendedor.tipo_usuario === 'sdr' ? 
          configNivel.meta_semanal_inbound : 
          configNivel.meta_semanal_vendedor || 0,
      };

      const { data: metaCriada, error } = await supabase
        .from('metas_semanais_vendedores')
        .insert(novaMeta)
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao criar meta para semana ${semana}:`, error);
        continue;
      }

      console.log(`✅ Meta criada para semana ${semana}/${ano}:`, metaCriada);
      metasCriadas.push(metaCriada);
    }

    return metasCriadas;
  }

  static async garantirMetasExistem(vendedorId: string, ano: number, mes?: number): Promise<MetaSemanalVendedor[]> {
    console.log(`🔍 Garantindo que metas existem para vendedor ${vendedorId}, período: ${mes || 'todo ano'}/${ano}`);

    if (mes) {
      // Criar apenas para o mês especificado
      return await this.criarMetasSemanaisAutomaticamente(vendedorId, ano, mes);
    } else {
      // Criar para todo o ano
      const todasMetas: MetaSemanalVendedor[] = [];
      for (let m = 1; m <= 12; m++) {
        const metasDoMes = await this.criarMetasSemanaisAutomaticamente(vendedorId, ano, m);
        todasMetas.push(...metasDoMes);
      }
      return todasMetas;
    }
  }

  static async buscarOuCriarMetas(vendedorId: string, ano: number, mes?: number): Promise<MetaSemanalVendedor[]> {
    // Primeiro, tentar buscar metas existentes
    const metasExistentes = await this.buscarMetasVendedor(vendedorId, ano, mes);
    
    if (metasExistentes.length > 0) {
      console.log(`✅ Metas encontradas no banco: ${metasExistentes.length}`);
      return metasExistentes;
    }

    console.log(`⚠️ Nenhuma meta encontrada, criando automaticamente...`);
    
    // Se não existir, criar automaticamente
    return await this.garantirMetasExistem(vendedorId, ano, mes);
  }
}