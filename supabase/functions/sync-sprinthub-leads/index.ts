import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SprintHubLead {
  id: number;
  fullname: string;
  email: string;
  whatsapp?: string;
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const sprintHubApiKey = Deno.env.get('SPRINTHUB_API_KEY');
    const sprintHubInstance = Deno.env.get('SPRINTHUB_INSTANCE');

    console.log('🔍 === DIAGNÓSTICO DETALHADO ===');
    console.log('API Key presente:', !!sprintHubApiKey);
    console.log('API Key length:', sprintHubApiKey?.length);
    console.log('API Key formato (primeiros 8 chars):', sprintHubApiKey?.substring(0, 8));
    console.log('Instância presente:', !!sprintHubInstance);
    console.log('Instância valor:', sprintHubInstance);
    console.log('Instância length:', sprintHubInstance?.length);

    if (!sprintHubApiKey || !sprintHubInstance) {
      const missingVars = [];
      if (!sprintHubApiKey) missingVars.push('SPRINTHUB_API_KEY');
      if (!sprintHubInstance) missingVars.push('SPRINTHUB_INSTANCE');
      
      throw new Error(`Variáveis de ambiente não configuradas: ${missingVars.join(', ')}`);
    }

    console.log('🚀 Fazendo requisição para SprintHub API conforme documentação');

    // URL conforme documentação oficial
    const apiUrl = `https://sprinthub-api-master.sprinthub.app/leads?i=${sprintHubInstance}`;
    
    console.log(`📡 URL: ${apiUrl}`);
    console.log(`🔑 API Token configurado: ${!!sprintHubApiKey}`);

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sprintHubApiKey}`,
        'apitoken': sprintHubApiKey
      }
    };

    console.log('📡 Fazendo requisição...');
    const response = await fetch(apiUrl, requestOptions);

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);

    const responseText = await response.text();
    console.log(`📝 Resposta (primeiros 300 chars): ${responseText.substring(0, 300)}`);

    if (response.status === 401) {
      throw new Error('Erro de autenticação: Verifique sua API Key do SprintHub');
    }

    if (response.status === 403) {
      throw new Error('Acesso negado: Verifique permissões da instância no SprintHub');
    }

    if (response.status === 404) {
      throw new Error('Endpoint não encontrado: Verifique o nome da instância no SprintHub');
    }

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${responseText}`);
    }

    // Parse da resposta JSON
    let sprintHubData;
    try {
      sprintHubData = JSON.parse(responseText);
      console.log(`✅ JSON parseado com sucesso`);
    } catch (parseError) {
      console.log(`❌ ERRO: Parse JSON falhou`, parseError);
      throw new Error('Resposta da API SprintHub não é um JSON válido');
    }

    // Processar os dados recebidos
    console.log('\n✅ === PROCESSAMENTO DOS DADOS ===');
    console.log('🎉 Conexão estabelecida com sucesso!');
    console.log('📊 URL utilizada:', apiUrl.replace(sprintHubApiKey, '***API_KEY***'));

    console.log('📊 Tipo de dados recebidos:', typeof sprintHubData);
    console.log('📊 É array?', Array.isArray(sprintHubData));

    if (!Array.isArray(sprintHubData)) {
      console.log('📊 Estrutura dos dados:', Object.keys(sprintHubData || {}));
      
      // Verificar se os dados estão em uma propriedade específica
      if (sprintHubData?.data && Array.isArray(sprintHubData.data)) {
        sprintHubData = sprintHubData.data;
      } else if (sprintHubData?.leads && Array.isArray(sprintHubData.leads)) {
        sprintHubData = sprintHubData.leads;
      } else if (sprintHubData?.result && Array.isArray(sprintHubData.result)) {
        sprintHubData = sprintHubData.result;
      } else if (sprintHubData?.items && Array.isArray(sprintHubData.items)) {
        sprintHubData = sprintHubData.items;
      } else {
        console.log('📊 Conteúdo completo da resposta:', JSON.stringify(sprintHubData, null, 2));
        throw new Error('Resposta da API SprintHub não contém um array de leads válido');
      }
    }

    console.log(`📊 SprintHub retornou ${sprintHubData.length} leads`);

    // Buscar leads existentes do SprintHub para evitar duplicatas
    const { data: existingLeads } = await supabaseClient
      .from('leads')
      .select('email, observacoes')
      .eq('fonte_referencia', 'SprintHub');

    // Extrair IDs do SprintHub das observações e emails para evitar duplicatas
    const existingSprintHubIds = new Set();
    const existingEmails = new Set();
    
    existingLeads?.forEach(lead => {
      if (lead.email) {
        existingEmails.add(lead.email.toLowerCase());
      }
      // Extrair ID do SprintHub das observações
      const sprintHubIdMatch = lead.observacoes?.match(/ID: (\d+)/);
      if (sprintHubIdMatch) {
        existingSprintHubIds.add(parseInt(sprintHubIdMatch[1]));
      }
    });

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const newLeads: any[] = [];

    for (const sprintLead of sprintHubData) {
      try {
        // Verificar se o lead tem os campos mínimos necessários
        if (!sprintLead.id || (!sprintLead.email && !sprintLead.fullname)) {
          console.warn('⚠️ Lead ignorado por falta de dados mínimos:', sprintLead);
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

        // Preparar dados do lead
        const leadData = {
          nome: sprintLead.fullname || 'Nome não informado',
          email: sprintLead.email || null,
          whatsapp: sprintLead.whatsapp || null,
          fonte_referencia: 'SprintHub',
          status: 'novo',
          observacoes: sprintLead.observacoes || `Lead importado do SprintHub - ID: ${sprintLead.id}`,
          regiao: sprintLead.regiao || null,
          utm_source: sprintLead.utm_source || null,
          utm_medium: sprintLead.utm_medium || null,
          utm_campaign: sprintLead.utm_campaign || null
        };

        newLeads.push(leadData);
        processedCount++;

        // Adicionar email à lista de existentes para evitar duplicatas na mesma execução
        if (sprintLead.email) {
          existingEmails.add(sprintLead.email.toLowerCase());
        }
        existingSprintHubIds.add(sprintLead.id);

      } catch (error) {
        console.error(`❌ Erro processando lead ${sprintLead.id}:`, error);
        errorCount++;
      }
    }

    // Inserir novos leads em lote
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

    console.log('🎯 Sincronização concluída:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.log('\n💥 === ERRO GERAL ===');
    console.error('❌ Erro na função:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      tipo_erro: 'erro_geral',
      sugestoes: [
        'Verifique se as variáveis SPRINTHUB_API_KEY e SPRINTHUB_INSTANCE estão configuradas',
        'Confirme se os valores estão corretos no painel do SprintHub',
        'Entre em contato com o suporte do SprintHub se o problema persistir'
      ]
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
