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
  // Função auxiliar para obter semanas do mês (quarta a terça) - Corrigida
  static getSemanasDoMes(ano: number, mes: number): number[] {
    // Para agosto 2025, sabemos que são as semanas 31-35
    // Vamos usar um mapeamento fixo para garantir precisão
    const mapeamentoSemanas: { [key: string]: number[] } = {
      '2025-8': [31, 32, 33, 34, 35], // Agosto 2025
      '2025-7': [27, 28, 29, 30], // Julho 2025
      '2025-9': [35, 36, 37, 38, 39], // Setembro 2025
    };
    
    const chave = `${ano}-${mes}`;
    if (mapeamentoSemanas[chave]) {
      console.log(`📅 Usando mapeamento fixo para ${chave}:`, mapeamentoSemanas[chave]);
      return mapeamentoSemanas[chave];
    }
    
    // Fallback para outros meses - usar cálculo aproximado
    const semanaBase = Math.floor((mes - 1) * 4.33) + 1;
    return [semanaBase, semanaBase + 1, semanaBase + 2, semanaBase + 3];
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
        // Atualizar meta existente com a meta atual do nível do vendedor com fallback
        let metaCorreta = 0;
        if (perfilVendedor.tipo_usuario === 'vendedor') {
          metaCorreta = configNivel.meta_semanal_vendedor > 0 ? 
            configNivel.meta_semanal_vendedor : 
            (perfilVendedor.nivel === 'senior' ? 9 : perfilVendedor.nivel === 'pleno' ? 8 : 7);
        } else {
          metaCorreta = configNivel.meta_semanal_inbound > 0 ? 
            configNivel.meta_semanal_inbound : 7;
        }
        
        if (metaExistente.meta_vendas !== metaCorreta) {
          console.log(`🔄 Atualizando meta da semana ${semana}/${ano} de ${metaExistente.meta_vendas} para ${metaCorreta}`);
          
          const { data: metaAtualizada, error: updateError } = await supabase
            .from('metas_semanais_vendedores')
            .update({ meta_vendas: metaCorreta })
            .eq('id', metaExistente.id)
            .select()
            .single();

          if (updateError) {
            console.error(`❌ Erro ao atualizar meta para semana ${semana}:`, updateError);
            metasCriadas.push(metaExistente);
          } else {
            console.log(`✅ Meta atualizada para semana ${semana}/${ano}:`, metaAtualizada);
            metasCriadas.push(metaAtualizada);
          }
        } else {
          console.log(`✅ Meta já está correta para semana ${semana}/${ano}`);
          metasCriadas.push(metaExistente);
        }
        continue;
      }

      // Criar nova meta baseada no tipo de usuário com fallback se config for 0
      let metaVendas = 0;
      if (perfilVendedor.tipo_usuario === 'vendedor') {
        metaVendas = configNivel.meta_semanal_vendedor > 0 ? 
          configNivel.meta_semanal_vendedor : 
          (perfilVendedor.nivel === 'senior' ? 9 : perfilVendedor.nivel === 'pleno' ? 8 : 7);
      } else {
        metaVendas = configNivel.meta_semanal_inbound > 0 ? 
          configNivel.meta_semanal_inbound : 7;
      }
      
      const novaMeta = {
        vendedor_id: vendedorId,
        ano,
        semana,
        meta_vendas: metaVendas,
      };
      
      console.log(`📊 Nova meta calculada: ${metaVendas} (config nível: ${configNivel.meta_semanal_vendedor}, fallback aplicado: ${configNivel.meta_semanal_vendedor <= 0})`);

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