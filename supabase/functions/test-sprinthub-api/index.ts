import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 TESTE DIRETO DA API SPRINTHUB');
    
    const sprintHubApiKey = Deno.env.get('SPRINTHUB_API_KEY');
    const sprintHubInstance = Deno.env.get('SPRINTHUB_INSTANCE');

    console.log('🔑 API Key:', sprintHubApiKey?.substring(0, 8) + '...');
    console.log('🏢 Instância:', sprintHubInstance);

    if (!sprintHubApiKey || !sprintHubInstance) {
      throw new Error('Variáveis não configuradas');
    }

    // TESTE 1: URL que você mostrou na documentação
    const testUrl = `https://sprinthub-api-master.sprinthub.app/leads?i=${sprintHubInstance}`;
    console.log('📡 URL de teste:', testUrl);

    console.log('🌐 Fazendo requisição...');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sprintHubApiKey}`,
        'apitoken': sprintHubApiKey,
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    console.log(`📊 STATUS: ${response.status}`);
    console.log(`📊 STATUS TEXT: ${response.statusText}`);
    console.log('📊 HEADERS DA RESPOSTA:');
    
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const responseText = await response.text();
    console.log(`📝 RESPOSTA (primeiros 500 chars):`);
    console.log(responseText.substring(0, 500));
    
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
      console.log('✅ JSON válido');
      console.log('📊 Tipo:', typeof jsonData);
      console.log('📊 É array:', Array.isArray(jsonData));
      if (typeof jsonData === 'object') {
        console.log('📊 Keys:', Object.keys(jsonData));
      }
    } catch (e) {
      console.log('❌ Não é JSON válido');
      console.log('❌ Erro:', e.message);
    }

    const result = {
      success: true,
      test_results: {
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        responseLength: responseText.length,
        isJson: !!jsonData,
        dataType: typeof jsonData,
        isArray: Array.isArray(jsonData),
        responsePreview: responseText.substring(0, 200)
      }
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 ERRO:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});