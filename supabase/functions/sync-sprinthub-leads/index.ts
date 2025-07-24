import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SprintHubLead {
  id: number;
  firstname?: string;
  email: string;
  whatsapp?: string;
  city?: string;
  created_at?: string;
  observacoes?: string;
  regiao?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Iniciando sincronização SprintHub');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const sprintHubApiKey = Deno.env.get('SPRINTHUB_API_KEY');
    const sprintHubInstance = Deno.env.get('SPRINTHUB_INSTANCE');

    console.log('🔍 Verificando configuração...');
    console.log('API Key configurada:', !!sprintHubApiKey);
    console.log('Instância configurada:', !!sprintHubInstance);
    console.log('Instância valor:', sprintHubInstance);

    if (!sprintHubApiKey || !sprintHubInstance) {
      const missing = [];
      if (!sprintHubApiKey) missing.push('SPRINTHUB_API_KEY');
      if (!sprintHubInstance) missing.push('SPRINTHUB_INSTANCE');
      
      throw new Error(`Variáveis não configuradas: ${missing.join(', ')}`);
    }

    // URL da API SprintHub
    const apiUrl = `https://sprinthub-api-master.sprinthub.app/leads?i=${sprintHubInstance}`;
    
    console.log('📡 Fazendo requisição para SprintHub...');
    console.log('📡 URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sprintHubApiKey}`,
        'apitoken': sprintHubApiKey
      }
    });

    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Erro de autenticação: Verifique sua API Key do SprintHub');
      }
      if (response.status === 403) {
        throw new Error('Acesso negado: Verifique permissões da instância no SprintHub');
      }
      if (response.status === 404) {
        throw new Error('Endpoint não encontrado: Verifique o nome da instância no SprintHub');
      }
      
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    console.log(`📝 Resposta recebida (${responseText.length} chars)`);

    let sprintHubData;
    try {
      sprintHubData = JSON.parse(responseText);
      console.log('✅ JSON parseado com sucesso');
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      throw new Error('Resposta da API SprintHub não é um JSON válido');
    }

    // Garantir que temos um array
    if (!Array.isArray(sprintHubData)) {
      if (sprintHubData?.data && Array.isArray(sprintHubData.data)) {
        sprintHubData = sprintHubData.data;
      } else if (sprintHubData?.leads && Array.isArray(sprintHubData.leads)) {
        sprintHubData = sprintHubData.leads;
      } else if (sprintHubData?.result && Array.isArray(sprintHubData.result)) {
        sprintHubData = sprintHubData.result;
      } else {
        console.log('📊 Estrutura da resposta:', Object.keys(sprintHubData || {}));
        throw new Error('Resposta da API SprintHub não contém um array de leads válido');
      }
    }

    console.log(`📊 ${sprintHubData.length} leads encontrados no SprintHub`);

    // Buscar leads existentes para evitar duplicatas
    const { data: existingLeads } = await supabaseClient
      .from('leads')
      .select('email, observacoes')
      .eq('fonte_referencia', 'SprintHub');

    const existingEmails = new Set();
    const existingSprintHubIds = new Set();
    
    existingLeads?.forEach(lead => {
      if (lead.email) {
        existingEmails.add(lead.email.toLowerCase());
      }
      const sprintHubIdMatch = lead.observacoes?.match(/ID: (\d+)/);
      if (sprintHubIdMatch) {
        existingSprintHubIds.add(parseInt(sprintHubIdMatch[1]));
      }
    });

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const newLeads: any[] = [];

    // Processar cada lead
    for (const sprintLead of sprintHubData) {
      try {
        if (!sprintLead.id || (!sprintLead.email && !sprintLead.firstname)) {
          console.warn('⚠️ Lead ignorado por falta de dados:', sprintLead);
          errorCount++;
          continue;
        }

        // Verificar duplicatas
        const isDuplicateById = existingSprintHubIds.has(sprintLead.id);
        const isDuplicateByEmail = sprintLead.email && existingEmails.has(sprintLead.email.toLowerCase());

        if (isDuplicateById || isDuplicateByEmail) {
          skippedCount++;
          continue;
        }

        // Mapear dados do lead
        const leadData = {
          nome: sprintLead.firstname || 'Nome não informado',
          email: sprintLead.email || null,
          whatsapp: sprintLead.whatsapp || null,
          fonte_referencia: 'SprintHub',
          status: 'novo',
          observacoes: sprintLead.observacoes || `Lead importado do SprintHub - ID: ${sprintLead.id}`,
          regiao: sprintLead.city || sprintLead.regiao || null,
          utm_source: sprintLead.utm_source || null,
          utm_medium: sprintLead.utm_medium || null,
          utm_campaign: sprintLead.utm_campaign || null
        };

        newLeads.push(leadData);
        processedCount++;

        // Marcar como processado para evitar duplicatas na mesma execução
        if (sprintLead.email) {
          existingEmails.add(sprintLead.email.toLowerCase());
        }
        existingSprintHubIds.add(sprintLead.id);

      } catch (error) {
        console.error(`❌ Erro processando lead ${sprintLead.id}:`, error);
        errorCount++;
      }
    }

    // Inserir novos leads
    let insertedCount = 0;
    if (newLeads.length > 0) {
      console.log(`📥 Inserindo ${newLeads.length} novos leads...`);
      
      const { data, error } = await supabaseClient
        .from('leads')
        .insert(newLeads)
        .select('id');

      if (error) {
        console.error('❌ Erro ao inserir leads:', error);
        throw error;
      }

      insertedCount = data?.length || 0;
      console.log(`✅ ${insertedCount} leads inseridos com sucesso`);
    }

    const result = {
      success: true,
      message: insertedCount > 0 ? 
        `Sincronização concluída! ${insertedCount} novos leads importados` : 
        'Sincronização concluída - Nenhum lead novo encontrado',
      stats: {
        total_sprinthub: sprintHubData.length,
        processed: processedCount,
        inserted: insertedCount,
        skipped: skippedCount,
        errors: errorCount
      }
    };

    console.log('🎯 Resultado final:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Erro na função:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});