import { supabase, supabaseAnonKey, supabaseUrl } from '@/integrations/supabase/client'

const LOGIN_REQUEST_TIMEOUT_MS = 8000
const LOGOUT_REQUEST_TIMEOUT_MS = 3000
const SIGNUP_REQUEST_TIMEOUT_MS = 12000
const SIGNUP_BACKGROUND_TIMEOUT_MS = 5000

async function withTimeout(promise, ms, fallbackMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(
        () => reject(new Error(fallbackMessage || 'Request timed out.')),
        ms,
      )
    }),
  ])
}

async function resolveLoginEmail(identifier) {
  const normalizedIdentifier = identifier.trim()

  if (!supabase || !/^\d{6}$/.test(normalizedIdentifier)) {
    return normalizedIdentifier
  }

  const { data, error } = await supabase.rpc('get_email_by_student_no', {
    student_number: normalizedIdentifier,
  })

  if (error) {
    throw error
  }

  return data || normalizedIdentifier
}

function normalizeSignupError(payload, fallbackStatus) {
  const rawMessage =
    payload?.msg ||
    payload?.message ||
    payload?.error_description ||
    payload?.error ||
    `Registration failed with status ${fallbackStatus}.`
  const message = String(rawMessage)

  if (/already registered|already exists|registered/i.test(message)) {
    return {
      message:
        'This email is already registered. Please sign in, or use forgot password if you cannot access it.',
    }
  }

  return { message }
}

async function syncSignupProfile({
  accessToken,
  accountType,
  userId,
  email,
  fullName,
  firstName,
  middleName,
  lastName,
  suffix,
  studentNumber,
  courseProgram,
  yearLevel,
  departmentCollege,
  section,
  address,
  contactNumber,
  dateOfBirth,
  sex,
}) {
  if (!accessToken) return

  try {
    const authHeaders = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    }

    // Look up the role id first so the profile mirrors the selected account type.
    const rolesResponse = await withTimeout(
      fetch(`${supabaseUrl}/rest/v1/roles?name=eq.${encodeURIComponent(accountType)}&select=id`, {
        headers: authHeaders,
      }),
      SIGNUP_BACKGROUND_TIMEOUT_MS,
      'Role lookup timed out during signup.',
    )
    const roles = rolesResponse.ok ? await rolesResponse.json() : []
    const roleId = roles[0]?.id || null

    await withTimeout(
      fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: userId,
          full_name: fullName,
          email,
          first_name: firstName || null,
          middle_name: middleName || null,
          last_name: lastName || null,
          suffix: suffix || null,
          sex: sex || null,
          date_of_birth: dateOfBirth || null,
          address: address || null,
          contact_number: contactNumber || null,
          student_no: studentNumber || null,
          course: courseProgram || null,
          year_level: yearLevel || null,
          graduation_term: null,
          department_college: departmentCollege || null,
          section: section || null,
          role_id: roleId,
          office_id: null,
          avatar_url: null,
        }),
      }),
      SIGNUP_BACKGROUND_TIMEOUT_MS,
      'Profile sync timed out during signup.',
    )
  } catch (error) {
    // Profile creation is best-effort because the database trigger normally
    // creates this row as soon as the auth user exists.
    console.warn(
      '[authService] Background profile sync skipped during signup:',
      error?.message || error,
    )
  }
}

export const authService = {
  async login(identifier, password) {
    if (!supabase) {
      return { data: null, error: null, demo: true, identifier, password }
    }

    const email = await resolveLoginEmail(identifier)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), LOGIN_REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
        signal: controller.signal,
      })

      const payload = await response.json()

      if (!response.ok) {
        return {
          data: null,
          error: {
            message:
              payload?.msg ||
              payload?.error_description ||
              payload?.error ||
              'Unable to sign in.',
          },
        }
      }

      return {
        data: {
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
          user: payload.user,
        },
        error: null,
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          data: null,
          error: {
            message: 'Login request timed out. Please try again.',
          },
        }
      }

      throw error
    } finally {
      window.clearTimeout(timeoutId)
    }
  },

  async setSession(accessToken, refreshToken) {
    if (!supabase) {
      return { data: null, error: null, demo: true }
    }

    return supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  },

  async register({
    accountType = 'student',
    email,
    password,
    fullName,
    firstName,
    middleName,
    lastName,
    suffix,
    studentNumber,
    courseProgram,
    yearLevel,
    departmentCollege,
    section,
    address,
    contactNumber,
    dateOfBirth,
    sex,
  }) {
    if (!supabase) {
      return { data: null, error: null, demo: true, email, fullName }
    }

    const metadata = {
      account_type: accountType,
      role: accountType,
      full_name: fullName,
      first_name: firstName || null,
      middle_name: middleName || null,
      last_name: lastName || null,
      suffix: suffix || null,
      sex: sex || null,
      date_of_birth: dateOfBirth || null,
      address: address || null,
      contact_number: contactNumber || null,
      student_no: studentNumber || null,
      course: courseProgram || null,
      year_level: yearLevel || null,
      department_college: departmentCollege || null,
      section: section || null,
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), SIGNUP_REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          data: metadata,
        }),
        signal: controller.signal,
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        return { data: null, error: normalizeSignupError(payload, response.status) }
      }

      const data = {
        user: payload?.user || null,
        session: payload?.access_token
          ? {
              access_token: payload.access_token,
              refresh_token: payload.refresh_token,
            }
          : payload?.session || null,
      }

      if (!data.user) {
        return {
          data: null,
          error: { message: 'Registration completed without a user record. Please try signing in.' },
        }
      }

      syncSignupProfile({
        accessToken: data.session?.access_token,
        accountType,
        userId: data.user.id,
        email,
        fullName,
        firstName,
        middleName,
        lastName,
        suffix,
        studentNumber,
        courseProgram,
        yearLevel,
        departmentCollege,
        section,
        address,
        contactNumber,
        dateOfBirth,
        sex,
      })

      return { data, error: null }
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          data: null,
          error: {
            message:
              'Registration request timed out. If this email says it is already registered on retry, sign in or reset the password because the account may have been created.',
          },
        }
      }

      return {
        data: null,
        error: { message: error?.message || 'Unable to register account.' },
      }
    } finally {
      window.clearTimeout(timeoutId)
    }
  },


  async logout() {
    if (!supabase) {
      return { error: null }
    }

    try {
      const result = await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => {
          window.setTimeout(
            () => reject(new Error('Logout request timed out.')),
            LOGOUT_REQUEST_TIMEOUT_MS,
          )
        }),
      ])

      return result
    } catch (error) {
      return {
        error,
      }
    }
  },

  async resetPassword(email) {
    if (!supabase) {
      return { data: null, error: null, demo: true, email }
    }

    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }
}
