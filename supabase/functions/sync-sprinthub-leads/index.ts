import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SprintHubLead {
  id: string;
  email: string;
  nome: string;
  whatsapp?: string;
  created_at: string;
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

    console.log('🚀 Iniciando teste de conectividade com SprintHub');

    // Vamos testar primeiro a conectividade básica com o SprintHub
    const testUrls = [
      // Teste 1: URL principal da API (mais provável)
      `https://api.sprinthub.com.br/v1/leads?client=${sprintHubInstance}&api_key=${sprintHubApiKey}`,
      
      // Teste 2: URL com dominio que vimos nos logs
      `https://sprinthub-api-master.sprinthub.app/api/v1/leads?client=${sprintHubInstance}&api_key=${sprintHubApiKey}`,
      
      // Teste 3: Formato REST padrão
      `https://api.sprinthub.com.br/leads?tenant=${sprintHubInstance}&key=${sprintHubApiKey}`,
      
      // Teste 4: Formato com autenticação no header
      `https://api.sprinthub.com.br/v1/leads`,
    ];

    let sprintHubData;
    let successfulUrl = '';
    let allErrors: string[] = [];

    for (let i = 0; i < testUrls.length; i++) {
      const testUrl = testUrls[i];
      
      try {
        console.log(`\n🧪 === TESTE ${i + 1}/${testUrls.length} ===`);
        console.log(`URL: ${testUrl.replace(sprintHubApiKey, '***API_KEY***')}`);
        
        let requestOptions: RequestInit = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'PPG-Education-CRM/1.0'
          }
        };

        // Para o teste 4, usar autenticação no header
        if (i === 3) {
          requestOptions.headers = {
            ...requestOptions.headers,
            'Authorization': `Bearer ${sprintHubApiKey}`,
            'X-API-Key': sprintHubApiKey,
            'X-Client': sprintHubInstance,
            'X-Tenant': sprintHubInstance
          };
          console.log('🔑 Usando autenticação via headers');
        }

        console.log('📡 Fazendo requisição...');
        const response = await fetch(testUrl, requestOptions);

        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);

        const responseText = await response.text();
        console.log(`📝 Resposta (primeiros 200 chars): ${responseText.substring(0, 200)}`);

        if (response.status === 401) {
          allErrors.push(`Teste ${i + 1}: Erro de autenticação (401) - API Key pode estar incorreta`);
          console.log('❌ ERRO: Problema de autenticação - verifique a API Key');
          continue;
        }

        if (response.status === 403) {
          allErrors.push(`Teste ${i + 1}: Acesso negado (403) - Cliente pode não ter permissão`);
          console.log('❌ ERRO: Acesso negado - verifique permissões no SprintHub');
          continue;
        }

        if (response.status === 404) {
          allErrors.push(`Teste ${i + 1}: Endpoint não encontrado (404) - URL pode estar incorreta`);
          console.log('❌ ERRO: Endpoint não encontrado');
          continue;
        }

        if (!response.ok) {
          allErrors.push(`Teste ${i + 1}: Status ${response.status} - ${responseText}`);
          console.log(`❌ ERRO: Status ${response.status}`);
          continue;
        }

        // Tentar fazer parse do JSON
        try {
          const data = JSON.parse(responseText);
          sprintHubData = data;
          successfulUrl = testUrl;
          console.log(`✅ SUCESSO! Dados recebidos:`, typeof data);
          console.log(`✅ Estrutura:`, Array.isArray(data) ? `Array com ${data.length} items` : Object.keys(data || {}));
          break;
        } catch (parseError) {
          allErrors.push(`Teste ${i + 1}: Erro de parse JSON - Resposta não é JSON válido`);
          console.log(`❌ ERRO: Parse JSON falhou`, parseError);
          continue;
        }

      } catch (fetchError) {
        allErrors.push(`Teste ${i + 1}: Erro de rede - ${fetchError.message}`);
        console.log(`❌ ERRO: Falha na requisição`, fetchError);
        continue;
      }
    }

    // Se nenhum teste funcionou, retornar diagnóstico detalhado
    if (!sprintHubData || !successfulUrl) {
      console.log('\n💥 === DIAGNÓSTICO FINAL ===');
      console.log('❌ Todos os testes falharam');
      
      const diagnosticInfo = {
        success: false,
        error: 'Não foi possível conectar com a API do SprintHub',
        diagnostico: {
          api_key_configurada: !!sprintHubApiKey,
          api_key_formato_valido: sprintHubApiKey ? sprintHubApiKey.length > 10 : false,
          instancia_configurada: !!sprintHubInstance,
          instancia_valor: sprintHubInstance,
          testes_realizados: testUrls.length,
          erros_por_teste: allErrors
        },
        proximos_passos: [
          '1. Verifique se a API Key está correta no painel do SprintHub',
          '2. Confirme se o nome da instância "grupoppgeducacao" está correto',
          '3. Verifique se o acesso à API está habilitado nas configurações do SprintHub',
          '4. Entre em contato com o suporte do SprintHub para confirmar a URL correta da API',
          '5. Verifique se existe alguma configuração de IP whitelist no SprintHub'
        ],
        contato_suporte: 'Entre em contato com o suporte do SprintHub e informe que está tentando acessar a API de leads via webhook/integração'
      };

      return new Response(JSON.stringify(diagnosticInfo, null, 2), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se chegou até aqui, conseguiu conectar - processar os dados
    console.log('\n✅ === PROCESSAMENTO DOS DADOS ===');
    console.log('🎉 Conexão estabelecida com sucesso!');
    console.log('📊 URL que funcionou:', successfulUrl.replace(sprintHubApiKey, '***API_KEY***'));

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
      .select('sprinthub_id, email')
      .eq('fonte_captura', 'SprintHub');

    const existingSprintHubIds = new Set(existingLeads?.map(l => l.sprinthub_id) || []);
    const existingEmails = new Set(existingLeads?.map(l => l.email?.toLowerCase()) || []);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const newLeads: any[] = [];

    for (const sprintLead of sprintHubData) {
      try {
        // Verificar se o lead tem os campos mínimos necessários
        if (!sprintLead.id || (!sprintLead.email && !sprintLead.nome)) {
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
          nome: sprintLead.nome || 'Nome não informado',
          email: sprintLead.email || null,
          whatsapp: sprintLead.whatsapp || null,
          data_captura: sprintLead.created_at || new Date().toISOString(),
          fonte_captura: 'SprintHub',
          sprinthub_id: sprintLead.id,
          status: 'novo',
          observacoes: sprintLead.observacoes || null,
          regiao: sprintLead.regiao || null,
          utm_source: sprintLead.utm_source || null,
          utm_medium: sprintLead.utm_medium || null,
          utm_campaign: sprintLead.utm_campaign || null,
          convertido_em_venda: false
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
      message: 'Teste de conectividade realizado com sucesso',
      url_utilizada: successfulUrl.replace(sprintHubApiKey, '***API_KEY***'),
      dados_recebidos: {
        tipo: typeof sprintHubData,
        eh_array: Array.isArray(sprintHubData),
        propriedades: Array.isArray(sprintHubData) ? `Array com ${sprintHubData.length} items` : Object.keys(sprintHubData || {})
      }
    };

    console.log('🎯 Teste concluído:', result);

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
