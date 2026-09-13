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
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')
    const authHeader = req.headers.get('Authorization') ?? ''

    if (!paystackSecret) {
      return new Response(JSON.stringify({ error: 'Payments are not configured yet. Set PAYSTACK_SECRET_KEY as an edge function secret.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    const { project_id } = await req.json()
    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load the project and confirm this caller owns it and it's actually unpaid.
    // The price comes from the server-side packages table, never from the client.
    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select('id, student_id, payment_status, package_id, packages(price_ngn)')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (project.student_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not your project' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (project.payment_status === 'paid') {
      return new Response(JSON.stringify({ error: 'Project is already paid' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const priceNgn = (project as any).packages.price_ngn as number
    const reference = `ps_${project_id}_${Date.now()}`

    const { error: txError } = await adminClient.from('transactions').insert({
      project_id, user_id: user.id, amount_ngn: priceNgn,
      gateway: 'paystack', gateway_reference: reference, status: 'pending',
    })
    if (txError) throw txError

    const origin = req.headers.get('origin') ?? ''
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: priceNgn * 100, // Paystack expects kobo
        reference,
        callback_url: `${origin}/payment/success?project_id=${project_id}`,
        metadata: { project_id, user_id: user.id },
      }),
    })

    const paystackData = await paystackRes.json()
    if (!paystackRes.ok || !paystackData.status) {
      return new Response(JSON.stringify({ error: paystackData.message ?? 'Paystack initialization failed' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
