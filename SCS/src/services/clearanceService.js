import { supabase, supabaseAnonKey, supabaseUrl } from '@/integrations/supabase/client'

const REQUEST_TIMEOUT_MS = 15000
const SESSION_TIMEOUT_MS = 3000
const accessTokenStorageKey = 'scs-supabase-access-token'

async function getAccessToken() {
  const appStoredAccessToken = window.localStorage.getItem(accessTokenStorageKey)
  if (appStoredAccessToken) {
    return { accessToken: appStoredAccessToken, error: null }
  }

  let sessionResult
  try {
    sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => {
        window.setTimeout(
          () => reject(new Error('Timed out while resolving Supabase session.')),
          SESSION_TIMEOUT_MS,
        )
      }),
    ])
  } catch (error) {
    const projectRef = (() => {
      try {
        return new URL(supabaseUrl).hostname.split('.')[0]
      } catch {
        return ''
      }
    })()

    const storageKey = projectRef ? `sb-${projectRef}-auth-token` : ''
    const storedRaw = storageKey ? window.localStorage.getItem(storageKey) : null
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw)
        const storedAccessToken =
          parsed?.access_token ||
          parsed?.currentSession?.access_token ||
          parsed?.session?.access_token
        if (storedAccessToken) {
          return { accessToken: storedAccessToken, error: null }
        }
      } catch {
        // ignore malformed storage value
      }
    }

    return {
      accessToken: null,
      error: { message: error?.message || 'Failed to resolve Supabase session.' },
    }
  }

  const {
    data: { session },
    error,
  } = sessionResult

  if (error || !session?.access_token) {
    return {
      accessToken: null,
      error: error || { message: 'No active Supabase session.' },
    }
  }

  return { accessToken: session.access_token, error: null }
}

async function fetchRest(path, options = {}) {
  const { accessToken, error: tokenError } = await getAccessToken()
  if (tokenError || !accessToken) {
    return { data: null, error: tokenError || { message: 'No access token available.' } }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const { method = 'GET', body, preferMinimal = false } = options

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        Prefer: preferMinimal ? 'return=minimal' : 'return=representation',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return {
        data: null,
        error: {
          message:
            payload?.message ||
            payload?.error ||
            `Supabase REST request failed with status ${response.status}.`,
          status: response.status,
          payload,
        },
      }
    }

    return { data: payload, error: null, accessToken }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { data: null, error: { message: 'Supabase REST request timed out.' } }
    }
    return { data: null, error: { message: error?.message || 'Supabase REST request failed.' } }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const clearanceService = {
  async listRequests() {
    if (!supabase) return { data: null, error: null, demo: true }
    return fetchRest('clearance_requests?select=*&order=updated_at.desc')
  },

  async listSteps() {
    if (!supabase) return { data: null, error: null, demo: true }
    return fetchRest('clearance_request_steps?select=*&order=order_no.asc')
  },

  async createRequest(payload) {
    if (!supabase) return { data: null, error: null, demo: true }
    return fetchRest('clearance_requests', {
      method: 'POST',
      body: payload,
      preferMinimal: true,
    })
  },

  async updateRequest(requestId, payload) {
    if (!supabase) return { data: null, error: null, demo: true }
    const response = await fetchRest(`clearance_requests?id=eq.${encodeURIComponent(requestId)}&select=*`, {
      method: 'PATCH',
      body: payload,
    })
    return {
      ...response,
      data: Array.isArray(response.data) ? response.data[0] || null : response.data,
    }
  },

  async deleteRequest(requestId) {
    if (!supabase) return { error: null, demo: true }
    return fetchRest(`clearance_requests?id=eq.${encodeURIComponent(requestId)}`, {
      method: 'DELETE',
      preferMinimal: true,
    })
  },

  async createSteps(payload) {
    if (!supabase) return { data: null, error: null, demo: true }
    return fetchRest('clearance_request_steps', {
      method: 'POST',
      body: payload,
      preferMinimal: true,
    })
  },

  async updateStepDecision(stepId, payload) {
    if (!supabase) return { data: null, error: null, demo: true }
    const response = await fetchRest(
      `clearance_request_steps?id=eq.${encodeURIComponent(stepId)}&select=*`,
      {
        method: 'PATCH',
        body: payload,
      },
    )
    return {
      ...response,
      data: Array.isArray(response.data) ? response.data[0] || null : response.data,
    }
  },

  async updateStepsForRequest(requestId, payload) {
    if (!supabase) return { data: null, error: null, demo: true }
    return fetchRest(
      `clearance_request_steps?request_id=eq.${encodeURIComponent(requestId)}&select=*`,
      {
        method: 'PATCH',
        body: payload,
      },
    )
  },

  async createNotification(payload) {
    if (!supabase) return { data: null, error: null, demo: true }

    return supabase.from('notifications').insert(payload).select().single()
  },
}
