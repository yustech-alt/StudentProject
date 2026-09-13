import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Paystack calls this directly (no user session), so verify_jwt is off.
// Trust is instead established by checking the x-paystack-signature header,
// an HMAC-SHA512 of the raw body keyed with your Paystack secret key.

async function hmacSha512Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!paystackSecret) {
    return new Response('Payments not configured', { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected = await hmacSha512Hex(paystackSecret, rawBody)

  if (signature !== expected) {
    console.error('Invalid Paystack signature')
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'charge.success') {
    const reference = event.data.reference as string
    const projectId = event.data.metadata?.project_id as string | undefined

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceKey)

    // Re-verify with Paystack's own API rather than trusting the webhook body alone.
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    })
    const verifyData = await verifyRes.json()

    if (verifyData.status && verifyData.data.status === 'success' && projectId) {
      const { data: tx } = await adminClient
        .from('transactions').select('id, status').eq('gateway_reference', reference).single()

      if (tx && tx.status !== 'success') {
        await adminClient.from('transactions')
          .update({ status: 'success', verified_at: new Date().toISOString() })
          .eq('gateway_reference', reference)

        await adminClient.rpc('activate_project_after_payment', { _project_id: projectId })

        const { data: project } = await adminClient
          .from('projects').select('student_id, title').eq('id', projectId).single()

        if (project) {
          await adminClient.from('notifications').insert({
            user_id: project.student_id,
            type: 'payment',
            title: 'Payment confirmed',
            description: `Your payment for '${project.title}' was confirmed. We are matching you with an expert.`,
          })
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
})
