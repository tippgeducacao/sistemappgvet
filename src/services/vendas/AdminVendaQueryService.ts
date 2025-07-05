
import { supabase } from '@/integrations/supabase/client';
import type { VendaCompleta } from '@/hooks/useVendas';

export class AdminVendaQueryService {
  static async getAllVendas(): Promise<VendaCompleta[]> {
    console.log('🔍 AdminVendaQueryService: Buscando todas as vendas...');
    
    try {
      const { data, error } = await supabase
        .from('form_entries')
        .select(`
          *,
          aluno:alunos!form_entries_aluno_id_fkey(*),
          curso:cursos(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }

      if (!data) {
        console.log('⚠️ Nenhum dado retornado');
        return [];
      }

      console.log('✅ Dados brutos recebidos:', data.length, 'registros');

      // Buscar informações dos vendedores separadamente
      const vendedorIds = [...new Set(data.map(v => v.vendedor_id).filter(Boolean))];
      console.log('🔍 IDs dos vendedores:', vendedorIds.length);

      const { data: vendedores } = await supabase
        .from('profiles')
        .select('id, name, email, photo_url')
        .in('id', vendedorIds);

      console.log('👥 Vendedores encontrados:', vendedores?.length || 0);

      // Mapear vendas
      const vendasMapeadas: VendaCompleta[] = data.map(venda => {
        const vendedor = vendedores?.find(v => v.id === venda.vendedor_id);
        
        return {
          id: venda.id,
          vendedor_id: venda.vendedor_id || '',
          curso_id: venda.curso_id || '',
          observacoes: venda.observacoes || '',
          status: (venda.status as 'pendente' | 'matriculado' | 'desistiu') || 'pendente',
          pontuacao_esperada: venda.pontuacao_esperada || 0,
          pontuacao_validada: venda.pontuacao_validada,
          enviado_em: venda.enviado_em || venda.created_at || '',
          atualizado_em: venda.atualizado_em || '',
          motivo_pendencia: venda.motivo_pendencia,
          documento_comprobatorio: venda.documento_comprobatorio,
          aluno: venda.aluno && typeof venda.aluno === 'object' && venda.aluno !== null && 'id' in venda.aluno ? {
            id: venda.aluno.id,
            nome: venda.aluno.nome || '',
            email: venda.aluno.email || '',
            telefone: venda.aluno.telefone || '',
            crmv: venda.aluno.crmv || ''
          } : null,
          curso: venda.curso && typeof venda.curso === 'object' && venda.curso !== null && 'id' in venda.curso ? {
            id: venda.curso.id,
            nome: venda.curso.nome || ''
          } : null,
          vendedor: vendedor ? {
            id: vendedor.id,
            name: vendedor.name,
            email: vendedor.email,
            photo_url: vendedor.photo_url || undefined
          } : undefined
        };
      });

      console.log('🎯 Vendas processadas:', vendasMapeadas.length);
      return vendasMapeadas;

    } catch (error) {
      console.error('💥 Erro crítico na busca:', error);
      throw error;
    }
  }
}
