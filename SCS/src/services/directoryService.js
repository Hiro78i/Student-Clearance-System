import { supabase, supabaseAnonKey, supabaseUrl } from '@/integrations/supabase/client'

import { rolesData } from '@/constants/roles'

const DIRECTORY_REQUEST_TIMEOUT_MS = 8000
const SESSION_REQUEST_TIMEOUT_MS = 3000
const accessTokenStorageKey = 'scs-supabase-access-token'

const PROFILE_SELECT = `
  id,
  full_name,
  email,
  first_name,
  middle_name,
  last_name,
  suffix,
  sex,
  date_of_birth,
  address,
  contact_number,
  student_no,
  course,
  year_level,
  graduation_term,
  department_college,
  section,
  role_id,
  office_id,
  avatar_url,
  created_at,
  roles:roles!profiles_role_id_fkey (
    id,
    name,
    label
  )
`


function mapProfile(profile) {
  if (!profile) return null

  // roles is the embedded join result from PostgREST.
  const roleRecord = Array.isArray(profile.roles)
    ? profile.roles[0] || null
    : profile.roles || null

  // If the join didn't work (e.g. no FK or RLS on roles table),
  // try to find the role name from our local constants using role_id.
  const localRole = rolesData.find((r) => r.id === profile.role_id)

  return {
    ...profile,
    role: roleRecord?.name || localRole?.name || profile.role || '',
    role_label: roleRecord?.label || localRole?.label || '',
  }
}

function mapOffice(office) {
  if (!office) return null

  return {
    ...office,
    is_required: office.is_required !== false,
  }
}

async function getAccessToken() {
  const appStoredAccessToken = window.localStorage.getItem(accessTokenStorageKey)
  if (appStoredAccessToken) {
    return {
      accessToken: appStoredAccessToken,
      error: null,
    }
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
          console.warn('[directoryService] Using stored access token fallback.')
          return {
            accessToken: storedAccessToken,
            error: null,
          }
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

  return {
    accessToken: session.access_token,
    error: null,
  }
}

async function fetchRest(path, accessToken, options = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), DIRECTORY_REQUEST_TIMEOUT_MS)
  const { method = 'GET', body } = options

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}),
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
      return {
        data: null,
        error: { message: 'Supabase REST request timed out.' },
      }
    }

    return {
      data: null,
      error: { message: error?.message || 'Supabase REST request failed.' },
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const directoryService = {
  async listProfiles() {
    if (!supabase) return { data: null, error: null, demo: true }

    console.log('[directoryService] Fetching profiles...')
    const { accessToken, error: sessionError } = await getAccessToken()
    if (sessionError || !accessToken) {
      console.error('[directoryService] Could not resolve session for profiles:', sessionError)
      return { data: null, error: sessionError || { message: 'No access token available.' } }
    }

    const response = await fetchRest(
      `profiles?select=${encodeURIComponent(PROFILE_SELECT)}&order=created_at.desc`,
      accessToken,
    )

    console.log('[directoryService] RAW RESPONSE:', response)

    if (response.error) {
      console.error('[directoryService] Error fetching profiles:', response.error)
      return { ...response, data: null }
    }

    console.log('[directoryService] Profiles fetched successfully, count:', response.data?.length)

    let mappedProfiles = Array.isArray(response.data)
      ? response.data.map(mapProfile)
      : response.data

    // Fallback: when the embedded roles join is missing, resolve role names
    // by role_id so admin tables and dashboard metrics stay accurate.
    const needsRoleLookup =
      Array.isArray(mappedProfiles) &&
      mappedProfiles.some((profile) => profile?.role_id && !profile?.role)

    if (needsRoleLookup) {
      const rolesResponse = await fetchRest('roles?select=id,name,label', accessToken)
      if (!rolesResponse.error && Array.isArray(rolesResponse.data)) {
        const roleById = new Map(
          rolesResponse.data
            .filter((role) => role?.id && role?.name)
            .map((role) => [role.id, role]),
        )

        mappedProfiles = mappedProfiles.map((profile) => {
          if (!profile?.role_id || profile?.role) return profile
          const matchedRole = roleById.get(profile.role_id)
          if (!matchedRole) return profile

          return {
            ...profile,
            role: matchedRole.name,
            role_label: matchedRole.label || profile.role_label || '',
          }
        })
      }
    }

    return {
      ...response,
      data: mappedProfiles,
    }
  },

  async getProfile(profileId) {
    if (!supabase) return { data: null, error: null, demo: true }

    const response = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', profileId)
      .maybeSingle()

    return {
      ...response,
      data: mapProfile(response.data),
    }
  },

  async getProfileByAccessToken(profileId, accessToken) {
    if (!supabase) return { data: null, error: null, demo: true }

    // Use the REST API directly with the access token so we can
    // authenticate immediately after sign-in (before the Supabase
    // client session is fully set).
    const response = await fetchRest(
      `profiles?id=eq.${encodeURIComponent(profileId)}&select=${encodeURIComponent(PROFILE_SELECT)}`,
      accessToken,
    )

    if (response.error) {
      return { data: null, error: response.error }
    }

    let raw = Array.isArray(response.data) ? response.data[0] || null : null

    // If the join didn't resolve a role (no FK or role_id is null),
    // try a separate roles lookup by role_id.
    const roleRecord = Array.isArray(raw?.roles) ? raw.roles[0] : raw?.roles
    if (raw && !roleRecord?.name && raw.role_id) {
      try {
        const roleRes = await fetch(
          `${supabaseUrl}/rest/v1/roles?id=eq.${encodeURIComponent(raw.role_id)}&select=id,name,label`,
          {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        if (roleRes.ok) {
          const roles = await roleRes.json()
          raw = { ...raw, roles: roles || [] }
        }
      } catch {
        // ignore — mapProfile will still try user metadata fallback
      }
    }

    return {
      data: mapProfile(raw),
      error: null,
    }
  },


  async listOffices() {
    if (!supabase) return { data: null, error: null, demo: true }

    console.log('[directoryService] Fetching offices...')
    const { accessToken, error: sessionError } = await getAccessToken()
    if (sessionError || !accessToken) {
      console.error('[directoryService] Could not resolve session for offices:', sessionError)
      return { data: null, error: sessionError || { message: 'No access token available.' } }
    }

    const response = await fetchRest('offices?select=*&order=order_no.asc', accessToken)

    console.log('[directoryService] OFFICES RESPONSE:', response)

    return {
      ...response,
      data: Array.isArray(response.data) ? response.data.map(mapOffice) : response.data,
    }
  },

  async createOffice(payload) {
    if (!supabase) return { data: null, error: null, demo: true }
    const { accessToken, error: sessionError } = await getAccessToken()
    if (sessionError || !accessToken) {
      return { data: null, error: sessionError || { message: 'No access token available.' } }
    }
    const response = await fetchRest('offices?select=*', accessToken, {
      method: 'POST',
      body: payload,
    })
    return {
      ...response,
      data: Array.isArray(response.data) ? response.data[0] || null : response.data,
    }
  },

  async updateOffice(officeId, payload) {
    if (!supabase) return { data: null, error: null, demo: true }
    const { accessToken, error: sessionError } = await getAccessToken()
    if (sessionError || !accessToken) {
      return { data: null, error: sessionError || { message: 'No access token available.' } }
    }
    const response = await fetchRest(
      `offices?id=eq.${encodeURIComponent(officeId)}&select=*`,
      accessToken,
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

  async deleteOffice(officeId) {
    if (!supabase) return { error: null, demo: true }
    const { accessToken, error: sessionError } = await getAccessToken()
    if (sessionError || !accessToken) {
      return { data: null, error: sessionError || { message: 'No access token available.' } }
    }
    return fetchRest(`offices?id=eq.${encodeURIComponent(officeId)}`, accessToken, {
      method: 'DELETE',
    })
  },

  async updateProfile(profileId, payload) {
    if (!supabase) return { data: null, error: null, demo: true }
    const { accessToken, error: sessionError } = await getAccessToken()
    if (sessionError || !accessToken) {
      return { data: null, error: sessionError || { message: 'No access token available.' } }
    }
    const response = await fetchRest(
      `profiles?id=eq.${encodeURIComponent(profileId)}&select=${encodeURIComponent(PROFILE_SELECT)}`,
      accessToken,
      {
        method: 'PATCH',
        body: payload,
      },
    )
    const raw = Array.isArray(response.data) ? response.data[0] || null : response.data
    return {
      ...response,
      data: mapProfile(raw),
    }
  },
}
