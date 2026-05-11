import { useCallback, useEffect, useMemo, useState } from 'react'
import { ROLE_LABELS, resolveHomePath } from '@/constants/roles'
import { AuthContext } from '@/context/auth-context'
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client'
import { authService } from '@/services/authService'
import { directoryService } from '@/services/directoryService'

const storageKey = 'scs-active-profile-id'
const profileCacheStorageKey = 'scs-auth-profile-cache'
const accessTokenStorageKey = 'scs-supabase-access-token'
const refreshTokenStorageKey = 'scs-supabase-refresh-token'
const AUTH_TIMEOUT_MS = 10000      // login
const REGISTER_TIMEOUT_MS = 30000  // signup — Supabase free tier cold-start can be slow
const SESSION_LOOKUP_TIMEOUT_MS = 1500
const PROFILE_LOOKUP_TIMEOUT_MS = 3000

function withTimeout(promise, message, ms = AUTH_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

function getStoredProfile() {
  try {
    const raw = window.localStorage.getItem(profileCacheStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function buildProfileFallback(user) {
  if (!user) return null

  const metadata = user.user_metadata || user.raw_user_meta_data || {}
  const role = metadata.role || metadata.account_type || ''

  return {
    id: user.id,
    full_name: metadata.full_name || user.email || 'User',
    email: user.email || '',
    student_no: metadata.student_no || '',
    course: metadata.course || '',
    year_level: metadata.year_level || '',
    graduation_term: metadata.graduation_term || '',
    role,
    role_id: null,
    role_label: ROLE_LABELS[role] || '',
    office_id: metadata.office_id || metadata.officeId || null,
    avatar_url: '',
    created_at: user.created_at || '',
  }
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(getStoredProfile)
  const [loading, setLoading] = useState(Boolean(supabase))

  const clearStoredSession = useCallback(() => {
    window.localStorage.removeItem(accessTokenStorageKey)
    window.localStorage.removeItem(refreshTokenStorageKey)
  }, [])

  const storeSessionTokens = useCallback((session) => {
    if (session?.access_token) {
      window.localStorage.setItem(accessTokenStorageKey, session.access_token)
    }
    if (session?.refresh_token) {
      window.localStorage.setItem(refreshTokenStorageKey, session.refresh_token)
    }
  }, [])

  useEffect(() => {
    if (profile?.id) {
      window.localStorage.setItem(storageKey, profile.id)
      window.localStorage.setItem(profileCacheStorageKey, JSON.stringify(profile))
    } else {
      window.localStorage.removeItem(storageKey)
      window.localStorage.removeItem(profileCacheStorageKey)
    }
  }, [profile])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }

    let alive = true

    async function loadSessionProfile() {
      setLoading(true)
      try {
        let session = null
        const cachedProfile = getStoredProfile()
        const storedAccessToken = window.localStorage.getItem(accessTokenStorageKey)
        const storedRefreshToken = window.localStorage.getItem(refreshTokenStorageKey)

        try {
          const {
            data: { session: currentSession },
          } = await withTimeout(
            supabase.auth.getSession(),
            'Supabase session lookup timed out.',
            SESSION_LOOKUP_TIMEOUT_MS,
          )
          session = currentSession
        } catch (error) {
          console.warn('Failed to read Supabase session directly:', error)
        }

        // Keep UI responsive during refresh: if we have cached auth/profile,
        // don't block rendering while waiting for a slow setSession call.
        if (!session && cachedProfile?.id && storedAccessToken) {
          setProfile(cachedProfile)
          setLoading(false)
        }

        if (!session && storedAccessToken && storedRefreshToken) {
          authService
            .setSession(storedAccessToken, storedRefreshToken)
            .then(({ data: restoredSession }) => {
              if (!alive) return
              const restored = restoredSession?.session || null
              if (restored?.user) {
                storeSessionTokens(restored)
              }
            })
            .catch((error) => {
              console.warn('Background session restore failed:', error)
            })
        }

        if (!alive) return

        if (!session?.user) {
          if (cachedProfile?.id) {
            setProfile(cachedProfile)
          } else {
            setProfile(null)
            clearStoredSession()
          }
          return
        }

        storeSessionTokens(session)

        const { data, error } = await withTimeout(
          directoryService.getProfile(session.user.id),
          'Profile bootstrap timed out.',
          PROFILE_LOOKUP_TIMEOUT_MS,
        )
        if (!alive) return

        const resolvedProfile = data || buildProfileFallback(session.user)
        if (!resolvedProfile?.role && error) {
          console.warn('Profile lookup failed after restoring session:', error)
        }

        setProfile(resolvedProfile || null)
      } catch (error) {
        console.warn('Auth bootstrap failed:', error)
        if (alive) {
          const cachedProfile = getStoredProfile()
          setProfile(cachedProfile || null)
        }
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    loadSessionProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!alive) return

      if (!session?.user) {
        const hasStoredTokens = Boolean(
          window.localStorage.getItem(accessTokenStorageKey) &&
            window.localStorage.getItem(refreshTokenStorageKey),
        )
        const cachedProfile = getStoredProfile()

        // During refresh/bootstrap Supabase can emit a temporary null session.
        // Ignore that transient state if we still have tokens/cached profile.
        if (event !== 'SIGNED_OUT' && (hasStoredTokens || cachedProfile?.id)) {
          setLoading(false)
          return
        }

        setProfile(null)
        clearStoredSession()
        setLoading(false)
        return
      }

      storeSessionTokens(session)

      const { data, error } = await directoryService.getProfile(session.user.id)
      if (alive) {
        const resolvedProfile = data || buildProfileFallback(session.user)
        if (!resolvedProfile?.role && error) {
          console.warn('Profile lookup failed after auth state change:', error)
        }
        setProfile(resolvedProfile || null)
        setLoading(false)
      }
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [clearStoredSession, storeSessionTokens])

  const login = useCallback(async ({ identifier, password }) => {
    setLoading(true)
    try {
      const response = await withTimeout(
        authService.login(identifier, password),
        'Login request timed out. Please try again.',
      )

      if (response.error) {
        throw response.error
      }

      if (supabase && response.data?.user) {
        window.localStorage.setItem(accessTokenStorageKey, response.data.access_token)
        window.localStorage.setItem(refreshTokenStorageKey, response.data.refresh_token)

        const setSessionPromise = authService.setSession(
          response.data.access_token,
          response.data.refresh_token,
        )

        const profileResponse = await withTimeout(
          directoryService.getProfileByAccessToken(
            response.data.user.id,
            response.data.access_token,
          ),
          'Profile lookup timed out after sign in. Please try again.',
          PROFILE_LOOKUP_TIMEOUT_MS,
        )

        const resolvedProfile = profileResponse.error
          ? buildProfileFallback(response.data.user)
          : profileResponse.data || buildProfileFallback(response.data.user)

        if (!resolvedProfile?.role) {
          throw (
            profileResponse.error ||
            new Error(
              'Your account was authenticated, but no profile record was found. Please contact the administrator.',
            )
          )
        }

        setProfile(resolvedProfile)
        setSessionPromise.then((sessionResult) => {
          if (sessionResult?.error) {
            console.warn('Session persistence returned an error after sign in:', sessionResult.error)
          }
        })
        return resolvedProfile
      }

      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const response = await withTimeout(
        authService.register(payload),
        'Registration is taking too long. Please check your internet and try again.',
        REGISTER_TIMEOUT_MS,
      )

      if (response.error) {
        throw response.error
      }

      if (supabase) {
        await authService.logout()
        setProfile(null)
        clearStoredSession()
        return response.data?.user || null
      }

      setProfile(null)
      return { email: payload.email }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setProfile(null)
    window.localStorage.removeItem(storageKey)
    window.localStorage.removeItem(profileCacheStorageKey)
    clearStoredSession()

    const response = await authService.logout()

    if (response.error) {
      console.warn('Sign out completed locally, but Supabase cleanup returned an error:', response.error)
    }
  }, [clearStoredSession])

  const switchProfile = useCallback((profileId) => {
    console.warn('switchProfile is not supported when using Supabase.')
  }, [])

  const value = useMemo(
    () => ({
      profile,
      profiles: supabase && profile ? [profile] : [],
      loading,
      login,
      register,
      logout,
      switchProfile,
      roleLabel: profile ? ROLE_LABELS[profile.role] : '',
      homePath: profile ? resolveHomePath(profile) : '/login',
      isAuthenticated: Boolean(profile),
    }),
    [loading, login, logout, profile, register, switchProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
