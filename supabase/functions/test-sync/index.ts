import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🎯 Função de teste executada!');
  
  return new Response(JSON.stringify({ 
    success: true,
    message: 'Função de teste funcionando!'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});