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
    console.log('🚀 Função sync-sprinthub-leads executada com sucesso!');
    
    // Verificar variáveis de ambiente básicas
    const sprintHubApiKey = Deno.env.get('SPRINTHUB_API_KEY');
    const sprintHubInstance = Deno.env.get('SPRINTHUB_INSTANCE');
    
    console.log('🔍 Verificando variáveis de ambiente...');
    console.log('API Key presente:', !!sprintHubApiKey);
    console.log('Instância presente:', !!sprintHubInstance);
    console.log('Instância valor:', sprintHubInstance);

    if (!sprintHubApiKey || !sprintHubInstance) {
      const missingVars = [];
      if (!sprintHubApiKey) missingVars.push('SPRINTHUB_API_KEY');
      if (!sprintHubInstance) missingVars.push('SPRINTHUB_INSTANCE');
      
      throw new Error(`Variáveis de ambiente não configuradas: ${missingVars.join(', ')}`);
    }

    // Teste simples de resposta primeiro
    const result = {
      success: true,
      message: 'Função executada com sucesso (teste)',
      stats: {
        total_sprinthub: 0,
        processed: 0,
        inserted: 0,
        skipped: 0,
        errors: 0
      }
    };

    console.log('✅ Teste de função bem-sucedido:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.log('\n💥 === ERRO ===');
    console.error('❌ Erro na função:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});