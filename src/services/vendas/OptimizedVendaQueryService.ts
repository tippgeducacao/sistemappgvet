import { supabase } from '@/integrations/supabase/client';
import type { VendaCompleta } from '@/hooks/useVendas';

export class OptimizedVendaQueryService {
  /**
   * OTIMIZADA: Busca vendas com single JOIN query para evitar N+1
   */
  static async getAllVendasOptimized(): Promise<VendaCompleta[]> {
    console.log('🚀 OTIMIZADA: Buscando todas as vendas com JOINs');

    const { data, error } = await supabase
      .from('form_entries')
      .select(`
        *,
        aluno:alunos!form_entry_id (
          id,
          nome,
          email,
          telefone,
          crmv
        ),
        curso:cursos!curso_id (
          id,
          nome
        ),
        vendedor:profiles!vendedor_id (
          id,
          name,
          email,
          photo_url
        ),
        sdr:profiles!sdr_id (
          id,
          name,
          email,
          photo_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ OTIMIZADA: Erro ao buscar vendas:', error);
      throw error;
    }

    if (!data) {
      console.log('⚠️ OTIMIZADA: Nenhuma venda encontrada');
      return [];
    }

    console.log(`✅ OTIMIZADA: ${data.length} vendas carregadas com relacionamentos`);

    // Mapear para formato esperado
    const vendas: VendaCompleta[] = data.map(entry => ({
      id: entry.id,
      vendedor_id: entry.vendedor_id,
      curso_id: entry.curso_id,
      observacoes: entry.observacoes || '',
      status: entry.status as 'pendente' | 'matriculado' | 'desistiu',
      pontuacao_esperada: entry.pontuacao_esperada || 0,
      pontuacao_validada: entry.pontuacao_validada,
      enviado_em: entry.enviado_em || entry.created_at,
      atualizado_em: entry.atualizado_em || entry.created_at,
      data_aprovacao: entry.data_aprovacao,
      data_assinatura_contrato: entry.data_assinatura_contrato,
      motivo_pendencia: entry.motivo_pendencia,
      documento_comprobatorio: entry.documento_comprobatorio,
      sdr_id: entry.sdr_id,
      aluno: (() => {
        if (!entry.aluno) return null;
        
        // Handle both array and object cases from Supabase joins
        const alunoData = Array.isArray(entry.aluno) ? entry.aluno[0] : entry.aluno;
        if (!alunoData) return null;
        
        return {
          id: (alunoData as any).id,
          nome: (alunoData as any).nome,
          email: (alunoData as any).email,
          telefone: (alunoData as any).telefone,
          crmv: (alunoData as any).crmv
        };
      })(),
      curso: (() => {
        if (!entry.curso) return null;
        
        // Handle both array and object cases from Supabase joins
        const cursoData = Array.isArray(entry.curso) ? entry.curso[0] : entry.curso;
        if (!cursoData) return null;
        
        return {
          id: (cursoData as any).id,
          nome: (cursoData as any).nome
        };
      })(),
      vendedor: (() => {
        if (!entry.vendedor) return null;
        
        // Handle both array and object cases from Supabase joins
        const vendedorData = Array.isArray(entry.vendedor) ? entry.vendedor[0] : entry.vendedor;
        if (!vendedorData) return null;
        
        return {
          id: (vendedorData as any).id,
          name: (vendedorData as any).name,
          email: (vendedorData as any).email,
          photo_url: (vendedorData as any).photo_url
        };
      })(),
      sdr: (() => {
        if (!entry.sdr) return null;
        
        // Handle both array and object cases from Supabase joins
        const sdrData = Array.isArray(entry.sdr) ? entry.sdr[0] : entry.sdr;
        if (!sdrData) return null;
        
        return {
          id: (sdrData as any).id,
          name: (sdrData as any).name,
          email: (sdrData as any).email,
          photo_url: (sdrData as any).photo_url
        };
      })()
    }));

    return vendas;
  }

  /**
   * OTIMIZADA: Busca vendas de supervisor com filtro direto na query
   */
  static async getSupervisorVendasOptimized(): Promise<VendaCompleta[]> {
    console.log('🚀 OTIMIZADA: Buscando vendas do supervisor com filtros');

    // TODO: Implementar filtro de grupo do supervisor quando necessário
    // Por enquanto, usando a mesma query otimizada
    return this.getAllVendasOptimized();
  }
}