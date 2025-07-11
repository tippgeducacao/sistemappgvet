import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Meta {
  id: string;
  vendedor_id: string;
  ano: number;
  mes: number;
  meta_vendas: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useMetas = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMetas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('metas_vendedores')
        .select('*')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      if (error) throw error;
      setMetas(data || []);
    } catch (error) {
      console.error('Error fetching metas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar metas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createMeta = async (vendedorId: string, ano: number, mes: number, metaVendas: number) => {
    try {
      const { data, error } = await supabase
        .from('metas_vendedores')
        .insert({
          vendedor_id: vendedorId,
          ano,
          mes,
          meta_vendas: metaVendas,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setMetas(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating meta:', error);
      throw error;
    }
  };

  const updateMeta = async (metaId: string, metaVendas: number) => {
    try {
      const { data, error } = await supabase
        .from('metas_vendedores')
        .update({ meta_vendas: metaVendas })
        .eq('id', metaId)
        .select()
        .single();

      if (error) throw error;
      
      setMetas(prev => prev.map(meta => 
        meta.id === metaId ? { ...meta, meta_vendas: metaVendas } : meta
      ));
      return data;
    } catch (error) {
      console.error('Error updating meta:', error);
      throw error;
    }
  };

  const getMetaVendedor = (vendedorId: string, ano: number, mes: number) => {
    return metas.find(meta => 
      meta.vendedor_id === vendedorId && 
      meta.ano === ano && 
      meta.mes === mes
    );
  };

  useEffect(() => {
    fetchMetas();
  }, []);

  return {
    metas,
    loading,
    fetchMetas,
    createMeta,
    updateMeta,
    getMetaVendedor
  };
};