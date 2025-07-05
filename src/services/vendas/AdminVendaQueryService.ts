import { supabase } from '@/integrations/supabase/client';
import type { VendaCompleta } from '@/hooks/useVendas';

export class AdminVendaQueryService {
  static async fetchVendasWithRelations(): Promise<any[]> {
    console.log('📊 ADMIN: Buscando todas as vendas com relacionamentos...');

    const { data: vendas, error } = await supabase
      .from('form_entries')
      .select(`
        *,
        alunos!form_entries_aluno_id_fkey(*),
        cursos(*),
        profiles!form_entries_vendedor_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar vendas:', error);
      throw error;
    }

    if (!vendas || vendas.length === 0) {
      console.log('⚠️ Nenhuma venda encontrada');
      return [];
    }

    console.log(`✅ ${vendas.length} vendas encontradas`);

    // Mapear os dados para o formato correto
    return vendas.map(venda => {
      const aluno = Array.isArray(venda.alunos) ? venda.alunos[0] : venda.alunos;
      
      return {
        ...venda,
        aluno: aluno ? {
          id: aluno.id,
          nome: aluno.nome,
          email: aluno.email,
          telefone: aluno.telefone,
          crmv: aluno.crmv
        } : null,
        vendedor: venda.profiles ? {
          id: venda.profiles.id,
          name: venda.profiles.name,
          email: venda.profiles.email
        } : null
      };
    });
  }

  static async getAllVendasForAdmin(): Promise<VendaCompleta[]> {
    console.log('🔍 AdminVendaQueryService: Buscando todas as vendas para admin...');
    
    const { data, error } = await supabase
      .from('form_entries')
      .select(`
        id,
        vendedor_id,
        curso_id,
        observacoes,
        status,
        pontuacao_esperada,
        pontuacao_validada,
        enviado_em,
        atualizado_em,
        motivo_pendencia,
        aluno_id,
        aluno:alunos!form_entries_aluno_id_fkey(
          id,
          nome,
          email,
          telefone,
          crmv
        ),
        curso:cursos!form_entries_curso_id_fkey(
          id,
          nome
        )
      `)
      .order('enviado_em', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar todas as vendas:', error);
      throw error;
    }

    console.log('✅ Vendas brutas encontradas:', data?.length || 0);

    // Buscar informações dos vendedores separadamente
    const vendasComVendedores = await Promise.all(
      (data || []).map(async (venda) => {
        let vendedorData = null;
        
        if (venda.vendedor_id) {
          const { data: vendedor } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('id', venda.vendedor_id)
            .single();
          vendedorData = vendedor;
        }

        // Se não tem aluno vinculado ou aluno sem nome, tentar buscar pelos dados das respostas
        let alunoFinal = venda.aluno;
        
        if (!alunoFinal || !alunoFinal.nome) {
          console.log(`🔍 Tentando encontrar dados do aluno para venda ${venda.id.substring(0, 8)}`);
          
          const { data: respostas } = await supabase
            .from('respostas_formulario')
            .select('campo_nome, valor_informado')
            .eq('form_entry_id', venda.id);

          if (respostas && respostas.length > 0) {
            const nomeResposta = respostas.find(r => r.campo_nome === 'Nome do Aluno');
            const emailResposta = respostas.find(r => r.campo_nome === 'Email do Aluno');
            
            if (nomeResposta || emailResposta) {
              alunoFinal = {
                id: venda.aluno_id || '',
                nome: nomeResposta?.valor_informado || 'Nome não informado',
                email: emailResposta?.valor_informado || 'Email não informado',
                telefone: null,
                crmv: null
              };
            }
          }
        }

        return {
          ...venda,
          aluno: alunoFinal,
          vendedor: vendedorData
        };
      })
    );

    console.log('✅✅ VENDAS FINAIS PROCESSADAS:', vendasComVendedores.length);
    return vendasComVendedores as unknown as VendaCompleta[];
  }
}
