import { supabase } from '@/integrations/supabase/client';
import type { VendaCompleta } from '@/hooks/useVendas';

/**
 * Serviço otimizado para consultas de vendas usando JOINs únicos
 * Resolve problema de N+1 queries que causava tráfego excessivo
 */
export class OptimizedVendaQueryService {
  /**
   * Busca vendas para supervisor com JOIN único - elimina N+1 queries
   */
  static async getAllVendasForSupervisor(): Promise<VendaCompleta[]> {
    console.log('🚀 [OTIMIZADO] Carregando vendas do supervisor com JOIN único...');
    
    try {
      // Query única com JOINs - substitui múltiplas queries
      const { data: vendas, error } = await supabase
        .from('form_entries')
        .select(`
          *,
          aluno:aluno_id (
            id,
            nome,
            email,
            telefone,
            crmv
          ),
          curso:curso_id (
            id,
            nome
          ),
          vendedor:vendedor_id (
            id,
            name,
            email,
            photo_url
          ),
          sdr:sdr_id (
            id,
            name,
            email,
            photo_url
          )
        `)
        .order('enviado_em', { ascending: false });

      if (error) {
        console.error('❌ Erro na query otimizada:', error);
        throw error;
      }

      console.log(`✅ [OTIMIZADO] Carregadas ${vendas?.length || 0} vendas com JOIN único`);

      return this.mapToVendaCompleta(vendas || []);
    } catch (error) {
      console.error('💥 Erro no serviço otimizado de vendas:', error);
      throw error;
    }
  }

  /**
   * Busca todas as vendas para admin com JOIN único - elimina N+1 queries  
   * EGRESS OPTIMIZED: Limitado a 200 registros mais recentes
   */
  static async getAllVendasForAdmin(): Promise<VendaCompleta[]> {
    console.log('🚀 [EGRESS OPTIMIZED] Carregando vendas com JOIN único (200 registros)...');
    
    try {
      // Query única com JOINs - substitui múltiplas queries
      const { data: vendas, error } = await supabase
        .from('form_entries')
        .select(`
          *,
          aluno:aluno_id (
            id,
            nome,
            email,
            telefone,
            crmv
          ),
          curso:curso_id (
            id,
            nome
          ),
          vendedor:vendedor_id (
            id,
            name,
            email,
            photo_url
          ),
          sdr:sdr_id (
            id,
            name,
            email,
            photo_url
          )
        `)
        .order('enviado_em', { ascending: false })
        .limit(200); // 🚀 EGRESS OPTIMIZED: Reduzido de 1000 para 200 registros (-80% volume)

      if (error) {
        console.error('❌ Erro na query otimizada:', error);
        throw error;
      }

      console.log(`✅ [EGRESS OPTIMIZED] Carregadas ${vendas?.length || 0} vendas com JOIN único (máx. 200)`);

      return this.mapToVendaCompleta(vendas || []);
    } catch (error) {
      console.error('💥 Erro no serviço otimizado de vendas:', error);
      throw error;
    }
  }

  /**
   * Busca vendas de um vendedor específico com JOIN único
   */
  static async getVendasByVendedor(vendedorId: string): Promise<VendaCompleta[]> {
    console.log('🚀 [OTIMIZADO] Carregando vendas do vendedor com JOIN único...');
    
    try {
      const { data: vendas, error } = await supabase
        .from('form_entries')
        .select(`
          *,
          aluno:aluno_id (
            id,
            nome,
            email,
            telefone,
            crmv
          ),
          curso:curso_id (
            id,
            nome
          ),
          vendedor:vendedor_id (
            id,
            name,
            email,
            photo_url
          ),
          sdr:sdr_id (
            id,
            name,
            email,
            photo_url
          )
        `)
        .eq('vendedor_id', vendedorId)
        .order('enviado_em', { ascending: false });

      if (error) {
        console.error('❌ Erro na query otimizada:', error);
        throw error;
      }

      console.log(`✅ [OTIMIZADO] Carregadas ${vendas?.length || 0} vendas do vendedor com JOIN único`);

      return this.mapToVendaCompleta(vendas || []);
    } catch (error) {
      console.error('💥 Erro no serviço otimizado de vendas:', error);
      throw error;
    }
  }

  /**
   * Mapeia dados da query para o formato VendaCompleta
   */
  private static mapToVendaCompleta(vendas: any[]): VendaCompleta[] {
    return vendas.map((venda) => ({
      id: venda.id,
      vendedor_id: venda.vendedor_id,
      curso_id: venda.curso_id,
      observacoes: venda.observacoes || '',
      status: venda.status,
      pontuacao_esperada: venda.pontuacao_esperada || 0,
      pontuacao_validada: venda.pontuacao_validada,
      enviado_em: venda.enviado_em,
      atualizado_em: venda.atualizado_em,
      data_aprovacao: venda.data_aprovacao,
      data_assinatura_contrato: venda.data_assinatura_contrato,
      motivo_pendencia: venda.motivo_pendencia,
      documento_comprobatorio: venda.documento_comprobatorio,
      sdr_id: venda.sdr_id,
      aluno: venda.aluno ? {
        id: venda.aluno.id,
        nome: venda.aluno.nome,
        email: venda.aluno.email,
        telefone: venda.aluno.telefone,
        crmv: venda.aluno.crmv,
      } : null,
      curso: venda.curso ? {
        id: venda.curso.id,
        nome: venda.curso.nome,
      } : null,
      vendedor: venda.vendedor ? {
        id: venda.vendedor.id,
        name: venda.vendedor.name,
        email: venda.vendedor.email,
        photo_url: venda.vendedor.photo_url,
      } : null,
      sdr: venda.sdr ? {
        id: venda.sdr.id,
        name: venda.sdr.name,
        email: venda.sdr.email,
        photo_url: venda.sdr.photo_url,
      } : null,
    }));
  }
}