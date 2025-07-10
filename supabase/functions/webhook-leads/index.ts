
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Log CRÍTICO - Toda chamada será registrada
  console.log('🚨🚨🚨 WEBHOOK CHAMADO! 🚨🚨🚨');
  console.log('⏰ Timestamp:', new Date().toISOString());

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Respondendo OPTIONS request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🎯 Iniciando processamento do webhook...');

    if (req.method !== 'POST') {
      console.log('❌ ERRO: Método não é POST:', req.method);
      return new Response(
        JSON.stringify({ 
          error: 'Método não permitido', 
          method: req.method,
          expected: 'POST',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Ler o body da requisição
    console.log('📖 Lendo body da requisição...');
    let rawBody = '';
    let body = {};

    try {
      rawBody = await req.text();
      console.log('✅ Body lido com sucesso!');
      console.log('📏 Tamanho do body:', rawBody.length, 'caracteres');
    } catch (bodyError) {
      console.error('❌ ERRO ao ler body:', bodyError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao ler body da requisição', 
          details: bodyError.message,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!rawBody || rawBody.trim() === '') {
      console.log('⚠️ Body está vazio!');
      return new Response(
        JSON.stringify({ 
          error: 'Body vazio - nenhum dado foi enviado',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parsear dados JSON
    const contentType = req.headers.get('content-type') || '';
    console.log('🔍 Content-Type detectado:', contentType);
    
    try {
      if (contentType.includes('application/json')) {
        console.log('📋 Parseando como JSON...');
        body = JSON.parse(rawBody);
        console.log('✅ JSON parseado com sucesso!');
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        console.log('📋 Parseando como form-urlencoded...');
        const formData = new URLSearchParams(rawBody);
        body = Object.fromEntries(formData.entries());
        console.log('✅ Form-urlencoded parseado com sucesso!');
      } else {
        console.log('⚠️ Content-Type desconhecido, tentando JSON...');
        try {
          body = JSON.parse(rawBody);
          console.log('✅ JSON parseado (fallback)');
        } catch {
          console.log('📋 JSON falhou, tentando form-urlencoded...');
          const formData = new URLSearchParams(rawBody);
          body = Object.fromEntries(formData.entries());
          console.log('✅ Form-urlencoded parseado (fallback)');
        }
      }
    } catch (parseError) {
      console.error('❌ Erro ao parsear dados:', parseError);
      body = { 
        raw_data: rawBody, 
        parse_error: parseError.message,
        content_type: contentType
      };
    }

    console.log('🔍 DADOS RECEBIDOS:');
    console.log('- Número de campos:', Object.keys(body).length);
    console.log('- Campos disponíveis:', Object.keys(body));
    console.log('- Dados completos:', JSON.stringify(body, null, 2));

    // Criar cliente Supabase
    console.log('🔗 Criando cliente Supabase...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      console.error('❌ ERRO: Variáveis de ambiente do Supabase não encontradas!');
      return new Response(
        JSON.stringify({ 
          error: 'Configuração do servidor incompleta',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // MAPEAMENTO APRIMORADO DOS DADOS DO LEAD
    console.log('🗂️ Iniciando mapeamento aprimorado dos dados...');
    
    const leadData = {
      // Nome - múltiplas variações possíveis
      nome: body.Nome || body.nome || body.Name || body.NOME || body.full_name || 
            body.fullName || body.firstName || body.first_name || body.cliente || 
            body.lead_name || body['Nome'] || body['nome'] || 'Nome não informado',
      
      // Email - múltiplas variações possíveis  
      email: body.E_mail || body.email || body.Email || body.EMAIL || body.e_mail || 
             body.mail || body.emailAddress || body.email_address || body['E-mail'] || 
             body['email'] || body['E_mail'] || null,
      
      // WhatsApp/Telefone - múltiplas variações possíveis
      whatsapp: body.Seu_WhatsApp || body.whatsapp || body.phone || body.telefone || 
                body.WhatsApp || body.WHATSAPP || body.celular || body.mobile || 
                body.phoneNumber || body.phone_number || body['Telefone'] || 
                body['WhatsApp'] || body['Seu_WhatsApp'] || null,
      
      // Fonte de referência
      fonte_referencia: body.utm_source || body.source || body.origem || body.referrer || 
                       body.fonte || body.campaign_source || body.Referral_Source || 
                       'GreatPages',
      
      // Dispositivo
      dispositivo: body.Dispositivo || body.device || body.dispositivo || body.user_agent || 
                  body.platform || body.browser || null,
      
      // Região
      regiao: body.Regiao_do_usuario || body.Cidade_do_usuario || body.Pais_do_usuario ||
              body.region || body.regiao || body.location || body.cidade || 
              body.city || body.state || body.estado || null,
      
      // Informações da página
      pagina_id: body.Id_da_pagina || body.page_id || body.pagina_id || body.form_id || 
                 body.formId || body.Id_do_formulario || null,
      pagina_nome: body.page_name || body.pagina_nome || body.page_title || 
                   body.form_name || body.formName || body.URL || null,
      
      // UTM Parameters
      utm_source: body.utm_source || 'GreatPages',
      utm_medium: body.utm_medium || 'form',
      utm_campaign: body.utm_campaign || body.campaign || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,
      
      // Fonte de captura para filtros (baseado no utm_source)
      fonte_captura: body.utm_source || 'GreatPages',
      
      // Informações técnicas
      ip_address: body.IP_do_usuario || body.ip || body.ip_address || body.client_ip || 
                 req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || null,
      user_agent: body.user_agent || req.headers.get('user-agent') || null,
      
      // Status padrão
      status: 'novo'
    }

    // Adicionar campos personalizados extras às observações
    const camposExtras = [];
    
    // Campo "Eu sou"
    if (body.Eu_sou) {
      camposExtras.push(`Profissão/Área: ${body.Eu_sou}`);
    }
    
    // Políticas de privacidade
    if (body.Politicas_de_privacidade !== undefined) {
      camposExtras.push(`Aceitou Políticas: ${body.Politicas_de_privacidade ? 'Sim' : 'Não'}`);
    }
    
    // Data da conversão
    if (body.Data_da_conversao) {
      camposExtras.push(`Data Conversão: ${body.Data_da_conversao}`);
    }
    
    // IDs de tracking
    if (body.fbclid && body.fbclid !== '{fbclid}') {
      camposExtras.push(`Facebook Click ID: ${body.fbclid}`);
    }
    
    if (body.gclid && body.gclid !== '{gclid}') {
      camposExtras.push(`Google Click ID: ${body.gclid}`);
    }
    
    // Adicionar campos extras às observações se existirem
    if (camposExtras.length > 0) {
      leadData.observacoes = camposExtras.join('\n');
    }

    console.log('📋 DADOS DO LEAD PREPARADOS:');
    console.log(JSON.stringify(leadData, null, 2));

    // Validações críticas
    console.log('🔍 Validando dados essenciais...');
    
    if (!leadData.nome || leadData.nome === 'Nome não informado') {
      console.log('⚠️ TENTANDO ENCONTRAR NOME em qualquer campo...');
      
      // Buscar qualquer campo que possa ser um nome
      const possibleNames = Object.entries(body)
        .filter(([key, value]) => 
          typeof value === 'string' && 
          value.length > 1 && 
          value.length < 100 &&
          !key.toLowerCase().includes('email') &&
          !key.toLowerCase().includes('phone') &&
          !key.toLowerCase().includes('utm') &&
          !key.toLowerCase().includes('id') &&
          !key.toLowerCase().includes('ip')
        );
      
      console.log('🔍 Possíveis nomes encontrados:', possibleNames);
      
      if (possibleNames.length > 0) {
        leadData.nome = possibleNames[0][1];
        console.log('✅ Nome definido como:', leadData.nome);
      } else {
        console.log('⚠️ Nenhum nome válido encontrado, usando fallback');
        leadData.nome = `Lead ${new Date().toISOString()}`;
      }
    }

    console.log('💾 Tentando inserir lead na base de dados...');

    // Inserir lead na base de dados
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()

    if (error) {
      console.error('❌ ERRO ao inserir lead:', error);
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
      console.log('📋 Dados que tentamos inserir:', JSON.stringify(leadData, null, 2));
      
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao salvar lead no banco de dados', 
          details: error.message,
          error_code: error.code,
          error_hint: error.hint,
          leadData: leadData,
          receivedData: body,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🎉 SUCESSO! Lead inserido com sucesso!');
    console.log('📋 Dados inseridos:', JSON.stringify(data, null, 2));
    console.log('🆔 ID do lead:', data[0]?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead capturado com SUCESSO!',
        lead_id: data[0]?.id,
        processed_data: leadData,
        received_data: body,
        stats: {
          body_size: rawBody.length,
          fields_count: Object.keys(body).length,
          content_type: contentType
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥💥💥 ERRO CRÍTICO GERAL:', error);
    console.error('💥 Stack trace completo:', error.stack);
    console.error('💥 Nome do erro:', error.name);
    console.error('💥 Mensagem do erro:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno crítico do servidor', 
        details: error.message,
        error_name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
