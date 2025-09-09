
import { supabase } from '@/integrations/supabase/client';
import type { VendaCompleta } from '@/hooks/useVendas';

export class AdminVendaQueryService {
  static async fetchVendasWithRelations(): Promise<any[]> {
    console.log('📊 ADMIN: Buscando todas as vendas com relacionamentos...');

    const { data: vendas, error } = await supabase
      .from('form_entries')
      .select(`
        *,
        cursos(*)
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

    // Buscar dados de alunos e vendedores separadamente para evitar erros de relacionamento
    const vendasCompletas = await Promise.all(
      vendas.map(async (venda) => {
        let alunoData = null;
        let vendedorData = null;

        // Buscar aluno se houver aluno_id
        if (venda.aluno_id) {
          const { data: aluno } = await supabase
            .from('alunos')
            .select('*')
            .eq('id', venda.aluno_id)
            .single();
          alunoData = aluno;
        }

        // Buscar vendedor se houver vendedor_id
        if (venda.vendedor_id) {
          const { data: vendedor } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('id', venda.vendedor_id)
            .single();
          vendedorData = vendedor;
        }

        // Buscar SDR se houver sdr_id
        let sdrData = null;
        if (venda.sdr_id) {
          const { data: sdr } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('id', venda.sdr_id)
            .single();
          sdrData = sdr;
        }

        return {
          ...venda,
          aluno: alunoData,
          vendedor: vendedorData,
          sdr: sdrData
        };
      })
    );

    return vendasCompletas;
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
        sdr_id
      `)
      .order('enviado_em', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar todas as vendas:', error);
      throw error;
    }

    console.log('✅ Vendas brutas encontradas:', data?.length || 0);

    // Buscar informações relacionadas separadamente
    const vendasComRelacionamentos = await Promise.all(
      (data || []).map(async (venda) => {
        let alunoData = null;
        let cursoData = null;
        let vendedorData = null;
        
        // Buscar aluno
        if (venda.aluno_id) {
          const { data: aluno } = await supabase
            .from('alunos')
            .select('id, nome, email, telefone, crmv')
            .eq('id', venda.aluno_id)
            .single();
          alunoData = aluno;
        }

        // Buscar curso
        if (venda.curso_id) {
          const { data: curso } = await supabase
            .from('cursos')
            .select('id, nome')
            .eq('id', venda.curso_id)
            .single();
          cursoData = curso;
        }

        // Buscar vendedor
        if (venda.vendedor_id) {
          const { data: vendedor } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('id', venda.vendedor_id)
            .single();
          vendedorData = vendedor;
        }

        // Buscar SDR
        let sdrData = null;
        if (venda.sdr_id) {
          const { data: sdr } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('id', venda.sdr_id)
            .single();
          sdrData = sdr;
        }

        // Se não tem aluno vinculado, tentar buscar pelos dados das respostas
        if (!alunoData) {
          console.log(`🔍 Tentando encontrar dados do aluno para venda ${venda.id.substring(0, 8)}`);
          
          const { data: respostas } = await supabase
            .from('respostas_formulario')
            .select('campo_nome, valor_informado')
            .eq('form_entry_id', venda.id);

          if (respostas && respostas.length > 0) {
            const nomeResposta = respostas.find(r => r.campo_nome === 'Nome do Aluno');
            const emailResposta = respostas.find(r => r.campo_nome === 'Email do Aluno');
            
            if (nomeResposta || emailResposta) {
              alunoData = {
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
          aluno: alunoData,
          curso: cursoData,
          vendedor: vendedorData,
          sdr: sdrData
        };
      })
    );

    console.log('✅✅ VENDAS FINAIS PROCESSADAS:', vendasComRelacionamentos.length);
    return vendasComRelacionamentos as unknown as VendaCompleta[];
  }
}
