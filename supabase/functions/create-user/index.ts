import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { email, password, name, userType, nivel } = await req.json()

    // Validate required fields
    if (!email || !password || !name || !userType) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client for user verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Verify that the current user is a director
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is director
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isDiretor = roles?.some(r => r.role === 'diretor') || profile?.user_type === 'diretor'
    
    if (!isDiretor) {
      return new Response(
        JSON.stringify({ error: 'Apenas diretores podem criar usuários' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase Admin client
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    // Create user using Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // Skip email confirmation for admin-created users
      user_metadata: {
        name: name.trim(),
        user_type: userType,
        nivel: userType === 'admin' ? undefined : (nivel || 'junior')
      }
    })

    if (createError) {
      console.error('Erro ao criar usuário:', createError)
      let friendlyMessage = 'Erro ao criar usuário'
      
      if (createError.message.includes('User already registered')) {
        friendlyMessage = 'Este email já está cadastrado no sistema.'
      } else if (createError.message.includes('Invalid email')) {
        friendlyMessage = 'Email inválido.'
      } else {
        friendlyMessage = createError.message
      }
      
      return new Response(
        JSON.stringify({ error: friendlyMessage }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Falha ao criar usuário' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userId = newUser.user.id

    // Create profile directly in the database
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        user_type: userType,
        ativo: true,
        nivel: userType === 'admin' ? 'admin' : userType === 'supervisor' ? 'supervisor' : (nivel || 'junior')
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      // Try to clean up the created user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar perfil do usuário' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user role if it's admin (SDR and vendedor use user_type only)
    if (userType === 'admin') {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin',
          created_by: user.id
        })

      if (roleError) {
        console.error('Erro ao criar role:', roleError)
        // Role creation failed, but user and profile were created successfully
        // Log the error but don't fail the entire operation
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        message: 'Usuário criado com sucesso' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})