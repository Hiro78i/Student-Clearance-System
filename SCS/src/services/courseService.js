import { supabase, supabaseAnonKey, supabaseUrl } from '@/integrations/supabase/client'

const COURSE_REQUEST_TIMEOUT_MS = 8000
const SESSION_REQUEST_TIMEOUT_MS = 3000
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
          SESSION_REQUEST_TIMEOUT_MS,
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
        // ignore malformed local storage payload
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

async function fetchCoursesRest(path, options = {}) {
  const { accessToken, error: tokenError } = await getAccessToken()
  if (tokenError || !accessToken) {
    return { data: null, error: tokenError || { message: 'No access token available.' } }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), COURSE_REQUEST_TIMEOUT_MS)
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

    return { data: payload, error: null }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { data: null, error: { message: 'Supabase course request timed out.' } }
    }

    return {
      data: null,
      error: { message: error?.message || 'Supabase course request failed.' },
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const courseService = {
  async listCourses() {
    if (!supabase) return { data: null, error: null, demo: true }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), COURSE_REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/courses?select=*&order=category.asc,title.asc`,
        {
          headers: {
            apikey: supabaseAnonKey,
          },
          signal: controller.signal,
        },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        return {
          data: null,
          error: {
            message:
              payload?.message ||
              payload?.error ||
              `Failed to load courses (status ${response.status}).`,
          },
        }
      }

      return {
        data: Array.isArray(payload) ? payload : [],
        error: null,
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          data: null,
          error: {
            message: 'Loading courses from Supabase timed out.',
          },
        }
      }

      return {
        data: null,
        error: {
          message: error?.message || 'Failed to load courses from Supabase.',
        },
      }
    } finally {
      window.clearTimeout(timeoutId)
    }
  },

  async createCourse(payload) {
    if (!supabase) return { data: null, error: null, demo: true }

    const response = await fetchCoursesRest('courses?select=*', {
      method: 'POST',
      body: payload,
    })

    return {
      ...response,
      data: Array.isArray(response.data) ? response.data[0] || null : response.data,
    }
  },

  async updateCourse(courseId, payload) {
    if (!supabase) return { data: null, error: null, demo: true }

    const response = await fetchCoursesRest(
      `courses?id=eq.${encodeURIComponent(courseId)}&select=*`,
      {
        method: 'PATCH',
        body: { ...payload, updated_at: new Date().toISOString() },
      },
    )

    return {
      ...response,
      data: Array.isArray(response.data) ? response.data[0] || null : response.data,
    }
  },

  async deleteCourse(courseId) {
    if (!supabase) return { error: null, demo: true }

    return fetchCoursesRest(`courses?id=eq.${encodeURIComponent(courseId)}`, {
      method: 'DELETE',
      preferMinimal: true,
    })
  },
}
