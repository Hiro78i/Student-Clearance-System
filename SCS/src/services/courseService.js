import { supabase, supabaseAnonKey, supabaseUrl } from '@/integrations/supabase/client'

const COURSE_REQUEST_TIMEOUT_MS = 8000

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

    return supabase.from('courses').insert(payload).select().single()
  },

  async updateCourse(courseId, payload) {
    if (!supabase) return { data: null, error: null, demo: true }

    return supabase
      .from('courses')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', courseId)
      .select()
      .single()
  },

  async deleteCourse(courseId) {
    if (!supabase) return { error: null, demo: true }

    return supabase.from('courses').delete().eq('id', courseId)
  },
}
