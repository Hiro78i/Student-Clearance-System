import {
  supabase,
  supabaseAnonKey,
  supabaseUrl,
} from '@/integrations/supabase/client'

// How long to wait for the ENTIRE create-user flow (session check + edge function).
// If Supabase free-tier is sleeping it can take a long time to cold-start, so we
// bail out early and fall back to local-only creation instead of spinning forever.
const CREATE_USER_TIMEOUT_MS = 12000
const DELETE_USER_TIMEOUT_MS = 30000

/**
 * Race a promise against a timeout. Resolves with { timedOut: true } when the
 * timer fires first.
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise.then((value) => ({ timedOut: false, value })),
    new Promise((resolve) =>
      window.setTimeout(() => resolve({ timedOut: true, value: null }), ms),
    ),
  ])
}

export const adminUserService = {
  async createUser(payload) {
    // ── Supabase not configured ──────────────────────────────────────────────
    if (!supabase) {
      return { data: null, error: null, demo: true, payload }
    }

    // ── Run the whole Supabase flow inside a timeout ─────────────────────────
    const { timedOut, value } = await withTimeout(
      _callEdgeFunction(payload),
      CREATE_USER_TIMEOUT_MS,
    )

    if (timedOut) {
      console.warn(
        '[adminUserService] Supabase did not respond within',
        CREATE_USER_TIMEOUT_MS / 1000,
        'seconds. Falling back to local-only user creation.',
      )
      // Fall back to local mode — the user will appear in the table for this
      // session. The admin can re-create the account once Supabase is reachable.
      return { data: null, error: null, demo: true, payload }
    }

    return value
  },
}

/**
 * Internal helper — calls getSession() then the edge function.
 * Returns { data, error } or { data: null, error: null, demo: true, payload }.
 */
async function _callEdgeFunction(payload) {
  // ── Session check ──────────────────────────────────────────────────────────
  let session
  try {
    const {
      data: { session: s },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !s?.access_token) {
      console.warn(
        '[adminUserService] No active Supabase session — falling back to local mode.',
        sessionError?.message,
      )
      return { data: null, error: null, demo: true, payload }
    }

    session = s
  } catch (err) {
    console.warn('[adminUserService] getSession() threw — falling back to local mode.', err)
    return { data: null, error: null, demo: true, payload }
  }

  // ── Edge function call ─────────────────────────────────────────────────────
  const fetchController = new AbortController()
  const fetchTimeoutId = window.setTimeout(() => fetchController.abort(), 10000)

  try {
    console.log('[adminUserService] Calling admin-create-user edge function…')

    const functionResponse = await fetch(
      `${supabaseUrl}/functions/v1/admin-create-user`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: fetchController.signal,
      },
    )

    const responseBody = await functionResponse.json().catch(() => null)

    console.log(
      '[adminUserService] Edge function responded:',
      functionResponse.status,
      responseBody,
    )

    if (functionResponse.ok) {
      return { data: responseBody, error: null }
    }

    // Map common HTTP errors to friendly messages.
    let message =
      responseBody?.error || responseBody?.message || 'Unable to create user account.'

    if (functionResponse.status === 404) {
      // Function not deployed — fall back to local mode silently.
      console.warn('[adminUserService] Edge function 404 — falling back to local mode.')
      return { data: null, error: null, demo: true, payload }
    } else if (functionResponse.status === 403) {
      message =
        'Your account does not have Administrator privileges in Supabase. ' +
        'Run the SQL migration to set your profile role to "admin".'
    } else if (functionResponse.status === 401) {
      // Expired token — fall back to local mode.
      console.warn('[adminUserService] Edge function 401 — falling back to local mode.')
      return { data: null, error: null, demo: true, payload }
    }

    return { data: null, error: { message } }
  } catch (err) {
    if (err?.name === 'AbortError') {
      // Inner fetch timed out — the outer withTimeout will likely catch this
      // too, but handle it here just in case.
      console.warn('[adminUserService] Fetch aborted (inner timeout).')
      return { data: null, error: null, demo: true, payload }
    }

    // Any network error → fall back to local mode.
    console.warn('[adminUserService] Fetch error — falling back to local mode.', err?.message)
    return { data: null, error: null, demo: true, payload }
  } finally {
    window.clearTimeout(fetchTimeoutId)
  }
}

/** Update a user's profile fields (name, email, role, student/office data). */
async function _callUpdateUser(userId, payload) {
  let session
  try {
    const { data: { session: s }, error } = await supabase.auth.getSession()
    if (error || !s?.access_token) return { data: null, error: null, demo: true, payload }
    session = s
  } catch {
    return { data: null, error: null, demo: true, payload }
  }

  const controller = new AbortController()
  const tid = window.setTimeout(() => controller.abort(), DELETE_USER_TIMEOUT_MS)
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ...payload }),
      signal: controller.signal,
    })
    const body = await res.json().catch(() => null)
    if (res.ok) return { data: body, error: null }
    if (res.status === 404) return { data: null, error: null, demo: true, payload }
    return { data: null, error: { message: body?.error || 'Failed to update user.' } }
  } catch {
    return { data: null, error: null, demo: true, payload }
  } finally {
    window.clearTimeout(tid)
  }
}

/** Change a user's Supabase auth password. */
async function _callChangePassword(userId, newPassword) {
  let session
  try {
    const { data: { session: s }, error } = await supabase.auth.getSession()
    if (error || !s?.access_token) return { data: null, error: null, demo: true }
    session = s
  } catch {
    return { data: null, error: null, demo: true }
  }

  const controller = new AbortController()
  const tid = window.setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
      method: 'PUT',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, newPassword }),
      signal: controller.signal,
    })
    const body = await res.json().catch(() => null)
    if (res.ok) return { data: body, error: null }
    if (res.status === 404) return { data: null, error: null, demo: true }
    return { data: null, error: { message: body?.error || 'Failed to change password.' } }
  } catch {
    return { data: null, error: null, demo: true }
  } finally {
    window.clearTimeout(tid)
  }
}

/** Delete a user's Supabase auth account and profile. */
async function _callDeleteUser(userId) {
  let session
  try {
    const { data: { session: s }, error } = await supabase.auth.getSession()
    if (error || !s?.access_token) {
      return { data: null, error: { message: 'No active admin session.' } }
    }
    session = s
  } catch {
    return { data: null, error: { message: 'Unable to verify admin session.' } }
  }

  const controller = new AbortController()
  const tid = window.setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
      method: 'DELETE',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
      signal: controller.signal,
    })
    const body = await res.json().catch(() => null)
    if (res.ok) return { data: body, error: null }
    if (res.status === 404) {
      return {
        data: null,
        error: {
          message:
            'Admin delete function is not deployed in Supabase. Deploy the admin-create-user function first.',
        },
      }
    }
    return { data: null, error: { message: body?.error || 'Failed to delete user.' } }
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error?.name === 'AbortError'
            ? 'Deleting user is taking too long. Please try again, or redeploy the admin edge function if this keeps happening.'
            : 'Unable to delete user account.',
      },
    }
  } finally {
    window.clearTimeout(tid)
  }
}

export const adminUserServiceExtended = {
  async updateUser(userId, payload) {
    if (!supabase) return { data: null, error: null, demo: true, payload }
    const { timedOut, value } = await withTimeout(_callUpdateUser(userId, payload), 12000)
    if (timedOut) return { data: null, error: null, demo: true, payload }
    return value
  },

  async changePassword(userId, newPassword) {
    if (!supabase) return { data: null, error: null, demo: true }
    const { timedOut, value } = await withTimeout(_callChangePassword(userId, newPassword), 12000)
    if (timedOut) return { data: null, error: null, demo: true }
    return value
  },

  async deleteUser(userId) {
    if (!supabase) return { data: null, error: null, demo: true }
    const { timedOut, value } = await withTimeout(_callDeleteUser(userId), DELETE_USER_TIMEOUT_MS + 2000)
    if (timedOut) {
      return {
        data: { profileOnly: true, reason: 'edge-timeout' },
        error: null,
      }
    }
    return value
  },
}
