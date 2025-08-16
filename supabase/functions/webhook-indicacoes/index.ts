import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface IndicacaoWebhookData {
  cadastrado_por?: string;
  nome_aluno?: string;
  whatsapp_aluno?: string;
  nome_indicado?: string;
  whatsapp_indicado?: string;
  formacao?: string;
  area_interesse?: string;
  observacoes?: string;
  [key: string]: any;
}

serve(async (req) => {
  console.log(`🚨🚨🚨 WEBHOOK INDICAÇÕES CHAMADO! 🚨🚨🚨`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🎯 Iniciando processamento do webhook de indicações...`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Ensure this is a POST request
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log(`📖 Lendo body da requisição...`);
    
    // Read the request body
    const body = await req.text();
    console.log(`✅ Body lido com sucesso!`);
    console.log(`📏 Tamanho do body: ${body.length} caracteres`);

    let requestData: IndicacaoWebhookData;

    // Parse the request body
    const contentType = req.headers.get('content-type')?.toLowerCase() || '';
    console.log(`🔍 Content-Type detectado: ${contentType}`);

    if (contentType.includes('application/json')) {
      console.log(`📋 Parseando como JSON...`);
      requestData = JSON.parse(body);
      console.log(`✅ JSON parseado com sucesso!`);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      console.log(`📋 Parseando como form-urlencoded...`);
      const params = new URLSearchParams(body);
      requestData = Object.fromEntries(params.entries());
      console.log(`✅ Form-urlencoded parseado com sucesso!`);
    } else {
      console.log(`📋 Tentando parsear como JSON (fallback)...`);
      try {
        requestData = JSON.parse(body);
        console.log(`✅ JSON parseado com sucesso no fallback!`);
      } catch {
        console.log(`⚠️ Fallback para texto simples`);
        requestData = { observacoes: body };
      }
    }

    console.log(`🔍 DADOS RECEBIDOS:`);
    console.log(`- Dados completos:`, requestData);
    console.log(`- Número de campos: ${Object.keys(requestData).length}`);

    // Initialize Supabase client
    console.log(`🔗 Criando cliente Supabase...`);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ Variáveis de ambiente do Supabase não configuradas');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log(`🗂️ Iniciando mapeamento dos dados da indicação...`);

    // Map the incoming data to our indicacoes table structure
    const indicacaoData = {
      cadastrado_por: requestData.cadastrado_por || requestData['Cadastrado por'] || requestData['Nome do Indicador'] || '',
      nome_aluno: requestData.nome_aluno || requestData['Nome do Aluno'] || requestData['Nome do Indicador'] || '',
      whatsapp_aluno: requestData.whatsapp_aluno || requestData['WhatsApp do Aluno (Indicador)'] || requestData['WhatsApp do Indicador'] || '',
      nome_indicado: requestData.nome_indicado || requestData['Nome do Indicado'] || '',
      whatsapp_indicado: requestData.whatsapp_indicado || requestData['Whatsapp do Indicado'] || requestData['WhatsApp do Indicado'] || '',
      formacao: requestData.formacao || requestData['Formação'] || requestData['Profissão/Área do Indicador'] || '',
      area_interesse: requestData.area_interesse || requestData['Área de Interesse'] || requestData['Área de Interesse do Indicado'] || '',
      observacoes: requestData.observacoes || requestData['Observações'] || '',
      status: 'novo'
    };

    console.log(`🔍 Validando dados essenciais...`);
    
    if (!indicacaoData.nome_aluno || !indicacaoData.nome_indicado) {
      console.error('❌ Dados essenciais faltando: nome_aluno ou nome_indicado');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: nome_aluno and nome_indicado are required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`📋 DADOS DA INDICAÇÃO PREPARADOS:`);
    console.log(indicacaoData);

    console.log(`💾 Tentando inserir indicação na base de dados...`);

    // Insert the indicacao into the database
    const { data, error } = await supabase
      .from('indicacoes')
      .insert([indicacaoData])
      .select();

    if (error) {
      console.error('❌ Erro ao inserir indicação:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert indicacao', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🎉 SUCESSO! Indicação inserida com sucesso!`);
    console.log(`🆔 ID da indicação: ${data[0]?.id}`);
    console.log(`📋 Dados inseridos:`, data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Indicacao received and stored successfully',
        id: data[0]?.id,
        data: data[0] 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('💥 Erro geral no processamento:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});