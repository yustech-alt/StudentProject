import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') ?? ''

    // Two clients: one as the caller (to verify who they are), one with
    // the service role (to actually assign the role, bypassing RLS).
    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: existingAdmins, error: checkError } = await adminClient
      .from('user_roles').select('id').eq('role', 'admin').limit(1)

    if (checkError) {
      return new Response(JSON.stringify({ error: 'Failed to check existing admins' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(JSON.stringify({ error: 'An admin already exists. This endpoint only works for initial setup.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: existingRole } = await adminClient
      .from('user_roles').select('role').eq('user_id', user.id).single()

    if (existingRole) {
      const { error: updateError } = await adminClient
        .from('user_roles').update({ role: 'admin' }).eq('user_id', user.id)
      if (updateError) throw updateError
    } else {
      const { error: insertError } = await adminClient
        .from('user_roles').insert({ user_id: user.id, role: 'admin' })
      if (insertError) throw insertError
    }

    return new Response(JSON.stringify({ success: true, message: `Admin role assigned to ${user.email}` }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
