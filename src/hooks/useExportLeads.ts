import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const useExportLeads = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const extractProfissao = (observacoes?: string) => {
    if (!observacoes) return '';
    const match = observacoes.match(/Profissão\/Área:\s*([^\n]+)/);
    return match ? match[1].trim() : '';
  };

  const exportLeads = async (leadIds: string[]) => {
    try {
      setIsExporting(true);
      console.log('📊 Iniciando exportação de', leadIds.length, 'leads');

      // Buscar dados completos dos leads selecionados
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .in('id', leadIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar leads para exportação:', error);
        throw error;
      }

      if (!leads || leads.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhum lead encontrado para exportar.',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Dados dos leads carregados:', leads.length);

      // Mapear para formato de exportação
      const exportData = leads.map((lead) => ({
        'Nome': lead.nome || '',
        'Email': lead.email || '',
        'WhatsApp': lead.whatsapp || '',
        'Status': lead.status || '',
        'Data de Chegada': lead.created_at ? format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm') : '',
        'Fonte (UTM Source)': lead.utm_source || '',
        'Meio (UTM Medium)': lead.utm_medium || '',
        'Campanha (UTM Campaign)': lead.utm_campaign || '',
        'Conteúdo (UTM Content)': lead.utm_content || '',
        'Termo (UTM Term)': lead.utm_term || '',
        'Página de Captura': lead.pagina_nome || '',
        'Profissão': extractProfissao(lead.observacoes),
        'Região': lead.regiao || '',
        'Dispositivo': lead.dispositivo || '',
        'IP': lead.ip_address || '',
        'Observações': lead.observacoes || '',
        'Vendedor Atribuído': lead.vendedor_atribuido || '',
        'Atualizado em': lead.updated_at ? format(new Date(lead.updated_at), 'dd/MM/yyyy HH:mm') : '',
      }));

      console.log('✅ Dados mapeados para exportação');

      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');

      // Ajustar largura das colunas para melhor visualização
      ws['!cols'] = [
        { wch: 25 }, // Nome
        { wch: 30 }, // Email
        { wch: 18 }, // WhatsApp
        { wch: 15 }, // Status
        { wch: 18 }, // Data de Chegada
        { wch: 20 }, // Fonte
        { wch: 15 }, // Meio
        { wch: 20 }, // Campanha
        { wch: 20 }, // Conteúdo
        { wch: 15 }, // Termo
        { wch: 30 }, // Página de Captura
        { wch: 20 }, // Profissão
        { wch: 15 }, // Região
        { wch: 12 }, // Dispositivo
        { wch: 15 }, // IP
        { wch: 40 }, // Observações
        { wch: 20 }, // Vendedor
        { wch: 18 }, // Atualizado em
      ];

      // Gerar nome do arquivo com data/hora
      const fileName = `leads_export_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;

      console.log('✅ Gerando arquivo:', fileName);

      // Gerar e fazer download do arquivo
      XLSX.writeFile(wb, fileName);

      toast({
        title: '✅ Exportação Concluída',
        description: `${leads.length} ${leads.length === 1 ? 'lead exportado' : 'leads exportados'} com sucesso.`,
      });

      console.log('🎉 Exportação concluída!');
    } catch (error) {
      console.error('❌ Erro ao exportar leads:', error);

      toast({
        title: 'Erro na Exportação',
        description: 'Não foi possível exportar os leads selecionados.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportLeads,
    isExporting,
  };
};
