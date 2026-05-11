import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

type Payload = {
  fullName?: string
  email?: string
  password?: string
  role?: string
  studentNumber?: string | null
  course?: string | null
  yearLevel?: string | null
  graduationTerm?: string | null
  officeId?: string | null
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header.' }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const token = authHeader.replace('Bearer ', '').trim()
    const {
      data: { user: caller },
      error: callerError,
    } = await adminClient.auth.getUser(token)

    if (callerError || !caller) {
      return jsonResponse({ error: 'Unauthorized request.' }, 401)
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, roles:role_id(name)')
      .eq('id', caller.id)
      .maybeSingle()

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400)
    }

    if (callerProfile?.roles?.name !== 'admin') {
      return jsonResponse({ error: 'Only system administrators can create users.' }, 403)
    }

    const payload = (await request.json()) as Payload
    const fullName = payload.fullName?.trim()
    const email = payload.email?.trim().toLowerCase()
    const password = payload.password
    const role = payload.role?.trim().toLowerCase()

    if (!fullName || !email || !password || !role) {
      return jsonResponse({ error: 'Full name, email, password, and role are required.' }, 400)
    }

    const { data: roleRecord, error: roleError } = await adminClient
      .from('roles')
      .select('id, name, label')
      .eq('name', role)
      .maybeSingle()

    if (roleError || !roleRecord) {
      return jsonResponse({ error: 'Selected role is not configured in Supabase.' }, 400)
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        office_id: payload.officeId || null,
        student_no: payload.studentNumber || null,
        course: payload.course || null,
        year_level: payload.yearLevel || null,
        graduation_term: payload.graduationTerm || null,
      },
    })

    if (createError || !createdUser.user) {
      return jsonResponse({ error: createError?.message || 'Failed to create auth user.' }, 400)
    }

    const profilePayload = {
      id: createdUser.user.id,
      full_name: fullName,
      email,
      student_no: payload.studentNumber || null,
      course: payload.course || null,
      year_level: payload.yearLevel || null,
      graduation_term: payload.graduationTerm || null,
      role_id: roleRecord.id,
      office_id: payload.officeId || null,
      avatar_url: '',
    }

    const { data: profile, error: upsertError } = await adminClient
      .from('profiles')
      .upsert(profilePayload, {
        onConflict: 'id',
      })
      .select(
        `
          id,
          full_name,
          email,
          student_no,
          course,
          year_level,
          graduation_term,
          role_id,
          office_id,
          avatar_url,
          created_at
        `,
      )
      .single()

    if (upsertError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id)
      return jsonResponse({ error: upsertError.message }, 400)
    }

    return jsonResponse({
      profile: {
        ...profile,
        role: roleRecord.name,
        role_label: roleRecord.label,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, 500)
  }
})

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
