import { useEffect, useState } from 'react'
import { REQUEST_STATUS, ROLES, STEP_STATUS } from '@/constants/roles'
import { ClearanceContext } from '@/context/clearance-context'
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client'
import { requestTrend } from '@/constants/clearance'
import { rolesData as roles } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { nowIso } from '@/lib/utils'
import { adminUserService } from '@/services/adminUserService'
import { adminUserServiceExtended } from '@/services/adminUserService'
import { clearanceService } from '@/services/clearanceService'
import { courseService } from '@/services/courseService'
import { directoryService } from '@/services/directoryService'

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeOfficeOrder(nextOffices) {
  return nextOffices
    .slice()
    .sort((a, b) => a.order_no - b.order_no)
    .map((office, index) => ({
      ...office,
      order_no: index + 1,
    }))
}

function mergeById(currentItems, incomingItems) {
  const merged = new Map(currentItems.map((item) => [item.id, item]))
  incomingItems.forEach((item) => {
    merged.set(item.id, {
      ...merged.get(item.id),
      ...item,
    })
  })
  return Array.from(merged.values())
}

function normalizeRequestRecord(request) {
  if (!request) return request

  return {
    ...request,
    requested_documents: Array.isArray(request.requested_documents)
      ? request.requested_documents
      : [],
  }
}

function normalizeStepRecord(step) {
  if (!step) return step

  return {
    ...step,
    digital_approval_log: Array.isArray(step.digital_approval_log)
      ? step.digital_approval_log
      : [],
  }
}

async function withTimeout(promise, timeoutMs, message) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function recalculateRequestStatus(requestId, steps, officeList) {
  const requestSteps = steps.filter((step) => step.request_id === requestId)

  // A rejection/return on ANY step (required or optional) flags the request.
  if (
    requestSteps.some((step) =>
      [STEP_STATUS.REJECTED, STEP_STATUS.RETURNED].includes(step.status),
    )
  ) {
    return REQUEST_STATUS.REJECTED
  }

  // Determine which steps belong to required offices.
  // Fall back to treating all steps as required when office data is unavailable.
  const requiredSteps = officeList
    ? requestSteps.filter((step) => {
        const office = officeList.find((o) => o.id === step.office_id)
        // If the office record doesn't carry is_required, default to true.
        return office ? office.is_required !== false : true
      })
    : requestSteps

  // Clearance is complete when every REQUIRED step is approved/not-applicable.
  if (
    requiredSteps.length > 0 &&
    requiredSteps.every((step) =>
      [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
    )
  ) {
    return REQUEST_STATUS.COMPLETED
  }

  return REQUEST_STATUS.IN_REVIEW
}

export function ClearanceProvider({ children }) {
  const { loading: authLoading, profile: authProfile } = useAuth()
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(isSupabaseConfigured)
  const [coursesError, setCoursesError] = useState('')
  const [loadingDirectory, setLoadingDirectory] = useState(isSupabaseConfigured)
  const [offices, setOffices] = useState([])
  const [profiles, setProfiles] = useState([])
  const [requests, setRequests] = useState([])
  const [steps, setSteps] = useState([])
  const [remarks, setRemarks] = useState([])
  const [notifications, setNotifications] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [syncDebug, setSyncDebug] = useState({ status: 'pending' })

  useEffect(() => {
    let alive = true

    async function loadCourses() {
      if (!isSupabaseConfigured) {
        setCoursesLoading(false)
        setCoursesError('')
        return
      }

      const { data, error } = await courseService.listCourses()
      if (!alive) return

      if (error) {
        console.error('Failed to load courses from Supabase:', error)
        setCoursesError(error.message || 'Failed to load courses from Supabase.')
        setCoursesLoading(false)
        return
      }

      if (Array.isArray(data)) {
        setCourses(
          data.map((course) => ({
            ...course,
            majors: Array.isArray(course.majors) ? course.majors : [],
          })),
        )
      }

      setCoursesError('')
      setCoursesLoading(false)
    }

    loadCourses()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoadingDirectory(false)
      return undefined
    }

    if (authLoading) {
      setLoadingDirectory(true)
      return undefined
    }

    if (!authProfile?.id) {
      setProfiles([])
      setOffices([])
      setLoadingDirectory(false)
      setSyncDebug({ status: 'no-auth-profile' })
      return undefined
    }

    let alive = true

    async function syncDirectory() {
      try {
        console.log('[DEBUG syncDirectory] Started')
        setSyncDebug({ status: 'started' })
        setLoadingDirectory(true)

        if (!alive) {
          console.log('[DEBUG syncDirectory] Aborting because not alive')
          setSyncDebug((prev) => ({ ...prev, status: 'aborted-not-alive' }))
          return
        }

        console.log('[DEBUG syncDirectory] Fetching from Supabase...')
        const [
          { data: officeData, error: officeError },
          { data: profileData, error: profileError },
        ] = await Promise.all([
          directoryService.listOffices(),
          directoryService.listProfiles(),
        ])

        setSyncDebug((prev) => ({
          ...prev,
          officeDataLength: officeData?.length,
          officeError,
          profileDataLength: profileData?.length,
          profileError,
        }))

        if (!alive) {
          setSyncDebug((prev) => ({ ...prev, status: 'aborted-not-alive-2' }))
          return
        }

        console.log('[DEBUG syncDirectory] officeData:', officeData)
        console.log('[DEBUG syncDirectory] officeError:', officeError)
        console.log('[DEBUG syncDirectory] profileData:', profileData)
        console.log('[DEBUG syncDirectory] profileError:', profileError)

        if (officeError) {
          console.error('Failed to load offices from Supabase:', officeError)
        } else if (Array.isArray(officeData)) {
          if (officeData.length === 0) {
            console.log('[DEBUG syncDirectory] Offices table is empty. Auto-seeding default offices...')
            const defaultOffices = [
              { office_name: 'Guidance', description: 'Reviews student conduct, counseling records, and guidance clearances.', order_no: 1, is_required: true },
              { office_name: 'College Library', description: 'Validates borrowed college library materials and library obligations.', order_no: 2, is_required: true },
              { office_name: 'Property Custodian', description: 'Checks returned school property, equipment, and issued materials.', order_no: 3, is_required: true },
              { office_name: 'Dean/Principal', description: 'Confirms department or school-level requirements and endorsements.', order_no: 4, is_required: true },
              { office_name: 'Accounting Section', description: 'Checks balances, fees, assessments, and financial obligations.', order_no: 5, is_required: true },
              { office_name: 'High School Library', description: 'Marks high school library clearance when applicable.', order_no: 6, is_required: false },
              { office_name: 'MA Library', description: 'Marks graduate school library clearance when applicable.', order_no: 7, is_required: false },
              { office_name: 'College Laboratory', description: 'Reviews laboratory equipment, tools, and facility obligations.', order_no: 8, is_required: false },
              { office_name: 'Registrar', description: 'Performs final academic verification and completion release.', order_no: 9, is_required: false },
              { office_name: 'Student Council', description: 'Confirms student organization and council obligations when required.', order_no: 10, is_required: false },
            ]
            for (const office of defaultOffices) {
              const res = await directoryService.createOffice(office)
              if (res.error) console.error('[DEBUG syncDirectory] Auto-seed error for', office.office_name, ':', res.error)
            }
            const { data, error: refetchError } = await directoryService.listOffices()
            if (refetchError) console.error('[DEBUG syncDirectory] Refetch error:', refetchError)
            if (data) setOffices(normalizeOfficeOrder(data))
          } else {
            setOffices(normalizeOfficeOrder(officeData))
          }
        }

        if (profileError) {
          console.error('Failed to load profiles from Supabase:', profileError)
        } else if (Array.isArray(profileData)) {
          console.log('[ClearanceContext] Setting profiles state with:', profileData.length, 'records')
          // Replace entirely — seed profiles is now empty when Supabase is configured.
          setProfiles(profileData)
        } else {
          console.warn('[ClearanceContext] profileData is not an array:', profileData)
        }

        setLoadingDirectory(false)
        setSyncDebug((prev) => ({ ...prev, status: 'success' }))
      } catch (err) {
        console.error('[DEBUG syncDirectory] UNCAUGHT ERROR:', err)
        setSyncDebug((prev) => ({ ...prev, status: 'crashed', error: String(err) }))
        setLoadingDirectory(false)
      }
    }

    syncDirectory()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (alive) {
        syncDirectory()
      }
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [authLoading, authProfile?.id])

  useEffect(() => {
    let alive = true

    async function syncClearanceData() {
      if (!isSupabaseConfigured || authLoading) return

      if (!authProfile?.id) {
        setRequests([])
        setSteps([])
        setRemarks([])
        return
      }

      const [
        { data: requestData, error: requestError },
        { data: stepData, error: stepError },
      ] = await Promise.all([
        clearanceService.listRequests(),
        clearanceService.listSteps(),
      ])

      if (!alive) return

      if (requestError) {
        console.error('Failed to load clearance requests from Supabase:', requestError)
      } else {
        setRequests(Array.isArray(requestData) ? requestData.map(normalizeRequestRecord) : [])
      }

      if (stepError) {
        console.error('Failed to load clearance steps from Supabase:', stepError)
      } else {
        setSteps(Array.isArray(stepData) ? stepData.map(normalizeStepRecord) : [])
      }
    }

    syncClearanceData()

    return () => {
      alive = false
    }
  }, [authLoading, authProfile?.id])

  function getProfile(profileId) {
    return profiles.find((profile) => profile.id === profileId)
  }

  function getOffice(officeId) {
    return offices.find((office) => office.id === officeId)
  }

  function getRequest(requestId) {
    return requests.find((request) => request.id === requestId)
  }

  function getRequestSteps(requestId) {
    return steps
      .filter((step) => step.request_id === requestId)
      .sort((a, b) => a.order_no - b.order_no)
  }

  function getStudentRequests(profileId) {
    return requests.filter((request) => request.student_id === profileId)
  }

  function getOfficeSteps(officeId) {
    return steps.filter((step) => step.office_id === officeId)
  }

  function getUserNotifications(userId) {
    return notifications
      .filter((notification) => notification.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  function getUnreadNotificationCount(userId) {
    return getUserNotifications(userId).filter((notification) => !notification.is_read)
      .length
  }

  async function createManagedUser(payload) {
    const response = await adminUserService.createUser(payload)

    if (response.error) {
      throw response.error
    }

    if (response.data?.profile) {
      // Edge function returned a real Supabase profile – use it.
      setProfiles((current) => mergeById(current, [response.data.profile]))
      addAuditLog({
        userId: 'profile-admin',
        action: 'Created user account',
        module: 'User Management',
        details: `${response.data.profile.full_name} was added as ${
          response.data.profile.role_label || response.data.profile.role
        }.`,
      })
      return response.data.profile
    }

    // Demo / local-only mode: Supabase is not configured or the edge function
    // hasn't been deployed yet. Build a local profile from the submitted payload
    // so the new user immediately appears in the table.
    if (response.demo) {
      const { fullName, email, role, studentNumber, course, yearLevel, graduationTerm, officeId } =
        response.payload || payload

      const localProfile = {
        id: makeId('profile'),
        full_name: fullName,
        email,
        student_no: studentNumber || '',
        course: course || '',
        year_level: yearLevel || '',
        graduation_term: graduationTerm || '',
        role,
        role_id: null,
        office_id: officeId || null,
        avatar_url: '',
        created_at: nowIso(),
      }

      setProfiles((current) => mergeById(current, [localProfile]))
      addAuditLog({
        userId: 'profile-admin',
        action: 'Created user account (local)',
        module: 'User Management',
        details: `${fullName} was added as ${role} (demo mode – not persisted to Supabase).`,
      })
      return localProfile
    }

    return null
  }

  function addAuditLog({ userId, action, module, details }) {
    setAuditLogs((current) => [
      {
        id: makeId('LOG'),
        user_id: userId,
        action,
        module,
        details,
        created_at: nowIso(),
      },
      ...current,
    ])
  }

  function notify({ userId, title, message, type = 'info' }) {
    setNotifications((current) => [
      {
        id: makeId('NOT'),
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        created_at: nowIso(),
      },
      ...current,
    ])
  }

  function notifyMany(recipients, payload) {
    recipients
      .filter(Boolean)
      .forEach((userId) => {
        notify({ userId, ...payload })
      })
  }

  async function updateOfficeDetails({
    officeId,
    officeName,
    description,
    orderNo,
    accountId,
    assignedProfileId,
    accountName,
    accountEmail,
    accountRole = ROLES.OFFICE,
  }) {
    const office = offices.find((item) => item.id === officeId)
    const currentAccount = profiles.find((profile) => profile.id === accountId)
    const reassignedAccount = profiles.find(
      (profile) => profile.id === assignedProfileId,
    )
    const nextRoleId =
      accountRole === ROLES.REGISTRAR ? 'role-registrar' : 'role-office'

    const updatedData = {
      office_name: officeName,
      description,
      order_no: Number(orderNo),
    }

    if (isSupabaseConfigured) {
      await directoryService.updateOffice(officeId, updatedData)
    }

    setOffices((current) =>
      normalizeOfficeOrder(
        current.map((item) =>
          item.id === officeId ? { ...item, ...updatedData } : item,
        ),
      ),
    )

    if (isSupabaseConfigured && assignedProfileId) {
      if (accountId && accountId !== assignedProfileId) {
        const { error: clearCurrentError } = await directoryService.updateProfile(accountId, {
          office_id: null,
        })
        if (clearCurrentError) throw clearCurrentError
      }

      const { error: assignNextError } = await directoryService.updateProfile(
        assignedProfileId,
        {
          office_id: officeId,
        },
      )
      if (assignNextError) throw assignNextError
    } else if (isSupabaseConfigured && accountId) {
      const { error: unassignError } = await directoryService.updateProfile(accountId, {
        office_id: null,
      })
      if (unassignError) throw unassignError
    }

    if (assignedProfileId) {
      setProfiles((current) =>
        current.map((profile) =>
          profile.id === accountId && accountId !== assignedProfileId
            ? {
                ...profile,
                office_id: null,
              }
            : profile.id === assignedProfileId
            ? {
                ...profile,
                office_id: officeId,
                role: accountRole,
                role_id: nextRoleId,
              }
            : profile,
        ),
      )
    } else if (accountId) {
      setProfiles((current) =>
        current.map((profile) =>
          profile.id === accountId
            ? {
                ...profile,
                office_id: null,
              }
            : profile,
        ),
      )
    } else if (accountName && accountEmail) {
      setProfiles((current) => [
        ...current,
        {
          id: makeId('profile-office'),
          full_name: accountName,
          email: accountEmail,
          student_no: '',
          course: '',
          year_level: '',
          graduation_term: '',
          role: accountRole,
          role_id: nextRoleId,
          office_id: officeId,
          avatar_url: '',
          created_at: nowIso(),
        },
      ])
    }

    addAuditLog({
      userId: 'profile-admin',
      action: 'Updated office details',
      module: 'Office Management',
      details: `${office?.office_name || officeName} details were updated${
        reassignedAccount
          ? ` for ${reassignedAccount.full_name}`
          : currentAccount
            ? ' and the assigned account was removed'
            : ''
      }.`,
    })
  }

  function updateProfileRole({ profileId, roleName }) {
    const targetProfile = profiles.find((profile) => profile.id === profileId)
    const targetRole = roles.find((role) => role.name === roleName)

    if (!targetProfile) {
      return { error: 'User profile not found.' }
    }

    if (!targetRole) {
      return { error: 'Role not found.' }
    }

    setProfiles((current) =>
      current.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              role: roleName,
              role_id: targetRole.id,
              office_id:
                [ROLES.OFFICE, ROLES.REGISTRAR].includes(roleName)
                  ? profile.office_id
                  : null,
              student_no: roleName === ROLES.STUDENT ? profile.student_no : '',
              course: roleName === ROLES.STUDENT ? profile.course : '',
              year_level: roleName === ROLES.STUDENT ? profile.year_level : '',
              graduation_term:
                roleName === ROLES.STUDENT ? profile.graduation_term : '',
            }
          : profile,
      ),
    )

    addAuditLog({
      userId: 'profile-admin',
      action: 'Updated user role',
      module: 'Role Management',
      details: `${targetProfile.full_name} was assigned the ${targetRole.label} role.`,
    })

    return { error: null }
  }

  async function addOffice({
    officeName,
    description,
    orderNo,
    assignedProfileId,
    accountName,
    accountEmail,
    accountRole = ROLES.OFFICE,
    isRequired = true,
  }) {
    const nextRoleId =
      accountRole === ROLES.REGISTRAR ? 'role-registrar' : 'role-office'
    const payload = {
      office_name: officeName,
      description,
      order_no: Number(orderNo) || offices.length + 1,
      is_required: isRequired,
    }

    let createdOffice = payload

    if (isSupabaseConfigured) {
      const { data, error } = await directoryService.createOffice(payload)
      if (!error && data) {
        createdOffice = data
      }
    } else {
      createdOffice.id = makeId(`office-${slugify(officeName) || 'custom'}`)
    }

    const nextOffices = normalizeOfficeOrder([...offices, createdOffice])

    setOffices(nextOffices)
    const officeId = createdOffice.id

    if (assignedProfileId) {
      setProfiles((current) =>
        current.map((profile) =>
          profile.id === assignedProfileId
            ? {
                ...profile,
                office_id: officeId,
                role: accountRole,
                role_id: nextRoleId,
              }
            : profile,
        ),
      )
    } else if (accountName && accountEmail) {
      setProfiles((current) => [
        ...current,
        {
          id: makeId('profile-office'),
          full_name: accountName,
          email: accountEmail,
          student_no: '',
          course: '',
          year_level: '',
          graduation_term: '',
          role: accountRole,
          role_id: nextRoleId,
          office_id: officeId,
          avatar_url: '',
          created_at: nowIso(),
        },
      ])
    }

    addAuditLog({
      userId: 'profile-admin',
      action: 'Added workflow office',
      module: 'Clearance Workflow',
      details: `${officeName} was added to the clearance workflow.`,
    })

    return createdOffice
  }

  async function updateWorkflowSettings(workflowOffices) {
    const updatedOffices = workflowOffices.map((office, index) => ({
      ...office,
      order_no: index + 1,
      is_required: office.is_required !== false,
    }))

    setOffices(updatedOffices)

    if (isSupabaseConfigured) {
      for (const office of updatedOffices) {
        await directoryService.updateOffice(office.id, {
          order_no: office.order_no,
          is_required: office.is_required,
        })
      }
    }

    addAuditLog({
      userId: 'profile-admin',
      action: 'Updated workflow settings',
      module: 'Clearance Workflow',
      details: 'Workflow order and office requirements were updated.',
    })
  }

  async function resetWorkflowDefaults() {
    setOffices([])
    setProfiles([])

    if (isSupabaseConfigured) {
      // Clear existing offices
      for (const office of offices) {
        await directoryService.deleteOffice(office.id)
      }
      // Note: Auto-seeding will kick in next time listOffices is fetched,
      // or we could manually seed here. But for now, returning empty is safer.
    }

    addAuditLog({
      userId: 'profile-admin',
      action: 'Reset workflow defaults',
      module: 'Clearance Workflow',
      details: 'Clearance workflow offices and assigned accounts were cleared.',
    })

    return []
  }

  async function deleteOffice(officeId) {
    const office = offices.find((item) => item.id === officeId)
    const assignedAccounts = profiles.filter((profile) => profile.office_id === officeId)

    if (isSupabaseConfigured) {
      await directoryService.deleteOffice(officeId)
    }

    setOffices((current) => current.filter((item) => item.id !== officeId))
    setProfiles((current) =>
      current.filter((profile) => profile.office_id !== officeId),
    )
    setSteps((current) => current.filter((step) => step.office_id !== officeId))
    setRemarks((current) =>
      current.filter((remark) => remark.office_id !== officeId),
    )
    setNotifications((current) =>
      current.filter(
        (notification) =>
          !assignedAccounts.some((account) => account.id === notification.user_id),
      ),
    )

    addAuditLog({
      userId: 'profile-admin',
      action: 'Deleted office',
      module: 'Office Management',
      details: `${office?.office_name || 'Office'} and ${
        assignedAccounts.length
      } assigned account(s) were removed from the clearance workflow.`,
    })
  }

  async function addCourse({
    title,
    abbreviation,
    category,
    durationLabel,
    department,
    majors = [],
  }) {
    const nextCourse = {
      title,
      abbreviation,
      category,
      duration_label: durationLabel,
      department,
      majors,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await courseService.createCourse(nextCourse)
      if (error) return { error: error.message, data: null }

      setCourses((current) => [
        ...current,
        {
          ...data,
          majors: Array.isArray(data.majors) ? data.majors : [],
        },
      ])
    } else {
      setCourses((current) => [
        ...current,
        {
          id: makeId(`course-${slugify(title) || 'custom'}`),
          ...nextCourse,
        },
      ])
    }

    addAuditLog({
      userId: 'profile-admin',
      action: 'Added course',
      module: 'Course Management',
      details: `${title} was added to the academic course catalog.`,
    })

    return { error: null }
  }

  async function updateCourseDetails({
    courseId,
    title,
    abbreviation,
    category,
    durationLabel,
    department,
    majors = [],
  }) {
    const existingCourse = courses.find((course) => course.id === courseId)
    if (!existingCourse) return null

    const previousLabel = `${existingCourse.title} (${existingCourse.abbreviation})`
    const nextLabel = `${title} (${abbreviation})`

    const nextCourse = {
      title,
      abbreviation,
      category,
      duration_label: durationLabel,
      department,
      majors,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await courseService.updateCourse(courseId, nextCourse)
      if (error) return { error: error.message }

      setCourses((current) =>
        current.map((course) =>
          course.id === courseId
            ? {
                ...data,
                majors: Array.isArray(data.majors) ? data.majors : [],
              }
            : course,
        ),
      )
    } else {
      setCourses((current) =>
        current.map((course) =>
          course.id === courseId
            ? {
                ...course,
                ...nextCourse,
              }
            : course,
        ),
      )
    }

    setProfiles((current) =>
      current.map((profile) => {
        if (!profile.course?.startsWith(previousLabel)) return profile

        const suffix = profile.course.slice(previousLabel.length)
        return { ...profile, course: `${nextLabel}${suffix}` }
      }),
    )

    addAuditLog({
      userId: 'profile-admin',
      action: 'Updated course',
      module: 'Course Management',
      details: `${existingCourse.title} was updated in the academic course catalog.`,
    })

    return { error: null, label: nextLabel }
  }

  async function deleteCourse(courseId) {
    const course = courses.find((item) => item.id === courseId)
    if (!course) return { error: 'Course not found.' }

    const courseLabel = `${course.title} (${course.abbreviation})`
    const linkedProfiles = profiles.filter((profile) =>
      profile.course?.startsWith(courseLabel),
    )

    if (linkedProfiles.length) {
      return {
        error: `${course.title} cannot be deleted while ${linkedProfiles.length} student profile(s) still use it.`,
      }
    }

    if (isSupabaseConfigured) {
      const { error } = await courseService.deleteCourse(courseId)
      if (error) return { error: error.message }
    }

    setCourses((current) => current.filter((item) => item.id !== courseId))
    addAuditLog({
      userId: 'profile-admin',
      action: 'Deleted course',
      module: 'Course Management',
      details: `${course.title} was removed from the academic course catalog.`,
    })

    return { error: null }
  }

  async function createClearanceRequest({
    studentId,
    purpose,
    requestDate,
    address,
    contactNumber,
    semester,
    schoolYear,
    requestedDocuments,
    otherDocument,
    status = REQUEST_STATUS.SUBMITTED,
  }) {
    const now = nowIso()
    const isDraft = status === REQUEST_STATUS.DRAFT
    const student = profiles.find((profile) => profile.id === studentId)
    const requestId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : makeId('CLR')
    const requestPayload = {
      id: requestId,
      student_id: studentId,
      clearance_type: 'Mabini Colleges Clearance Request',
      purpose,
      request_date: requestDate,
      address,
      contact_number: contactNumber,
      semester,
      school_year: schoolYear,
      requested_documents: requestedDocuments,
      other_document: otherDocument,
      status,
      submitted_at: isDraft ? null : now,
      updated_at: now,
    }
    let request = null
    let nextSteps = []

    if (isSupabaseConfigured) {
      const { error } = await withTimeout(
        clearanceService.createRequest(requestPayload),
        15000,
        'Creating clearance request timed out. Please try again.',
      )
      if (error) {
        return { error: error.message || 'Failed to create clearance request.', data: null }
      }

      request = normalizeRequestRecord(requestPayload)

      if (!isDraft) {
        const stepPayload = offices.map((office) => ({
          id:
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : makeId('STEP'),
          request_id: request.id,
          office_id: office.id,
          status: STEP_STATUS.PENDING,
          remarks: 'Submitted for office review.',
          reviewed_by: null,
          reviewed_at: null,
          digital_approval_log: [],
          order_no: office.order_no,
        }))

        const { error: stepError } = await withTimeout(
          clearanceService.createSteps(stepPayload),
          15000,
          'Creating workflow steps timed out. Please try again.',
        )

        if (stepError) {
          await withTimeout(
            clearanceService.deleteRequest(request.id),
            10000,
            'Rollback delete timed out.',
          )
          return {
            error: stepError.message || 'Failed to create workflow steps.',
            data: null,
          }
        }

        nextSteps = stepPayload.map(normalizeStepRecord)
      }
    } else {
      request = normalizeRequestRecord({
        ...requestPayload,
      })

      nextSteps = isDraft
        ? []
        : offices.map((office) =>
            normalizeStepRecord({
              id: makeId('STEP'),
              request_id: request.id,
              office_id: office.id,
              status: STEP_STATUS.PENDING,
              remarks: 'Submitted for office review.',
              reviewed_by: '',
              reviewed_at: '',
              digital_approval_log: [],
              order_no: office.order_no,
            }),
          )
    }

    setRequests((current) => [request, ...current.filter((item) => item.id !== request.id)])
    if (nextSteps.length) {
      setSteps((current) => [...nextSteps, ...current.filter((step) => step.request_id !== request.id)])
    }

    if (isDraft) {
      notify({
        userId: studentId,
        title: 'Draft saved',
        message: `${request.id} was saved in your clearance status list.`,
        type: 'info',
      })
    } else {
      notify({
        userId: studentId,
        title: 'Clearance request submitted',
        message: `${request.id} has been forwarded to all required offices.`,
        type: 'success',
      })
      notifyMany(
        profiles
          .filter(
            (profile) =>
              profile.role === ROLES.OFFICE &&
              offices.some((office) => office.id === profile.office_id),
          )
          .map((profile) => profile.id),
        {
          title: 'New clearance request assigned',
          message: `${student?.full_name || 'A student'} submitted ${request.id} for office review.`,
          type: 'action',
        },
      )
      notify({
        userId: 'profile-admin',
        title: 'New clearance request submitted',
        message: `${student?.full_name || 'A student'} submitted ${request.id} for workflow processing.`,
        type: 'info',
      })
    }

    addAuditLog({
      userId: studentId,
      action: isDraft ? 'Saved clearance draft' : 'Submitted clearance request',
      module: 'Clearance Requests',
      details: isDraft
        ? `${request.id} was saved as a draft clearance request.`
        : `${request.id} was submitted for Mabini Colleges document clearance.`,
    })

    return { error: null, data: request }
  }

  async function updateClearanceRequest({
    requestId,
    studentId,
    purpose,
    requestDate,
    address,
    contactNumber,
    semester,
    schoolYear,
    requestedDocuments,
    otherDocument,
    submit = false,
  }) {
    const targetRequest = requests.find((request) => request.id === requestId)
    if (!targetRequest) {
      return { error: 'Clearance request not found.', data: null }
    }

    if (targetRequest.student_id !== studentId) {
      return { error: 'You can only edit your own clearance request.', data: null }
    }

    if (targetRequest.status !== REQUEST_STATUS.DRAFT) {
      return {
        error: 'Only draft clearance requests can be edited.',
        data: null,
      }
    }

    const now = nowIso()
    const nextStatus = submit ? REQUEST_STATUS.SUBMITTED : REQUEST_STATUS.DRAFT
    const nextSubmittedAt = submit ? targetRequest.submitted_at || now : ''
    const nextRequest = {
      ...targetRequest,
      purpose,
      request_date: requestDate,
      address,
      contact_number: contactNumber,
      semester,
      school_year: schoolYear,
      requested_documents: requestedDocuments,
      other_document: otherDocument,
      status: nextStatus,
      submitted_at: nextSubmittedAt,
      updated_at: now,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await withTimeout(
        clearanceService.updateRequest(requestId, {
        purpose,
        request_date: requestDate,
        address,
        contact_number: contactNumber,
        semester,
        school_year: schoolYear,
        requested_documents: requestedDocuments,
        other_document: otherDocument,
        status: nextStatus,
        submitted_at: nextSubmittedAt || null,
        updated_at: now,
        }),
        15000,
        'Updating clearance request timed out. Please try again.',
      )

      if (error) {
        return { error: error.message || 'Failed to update clearance request.', data: null }
      }

      Object.assign(nextRequest, normalizeRequestRecord(data))
    }

    setRequests((current) =>
      current.map((request) => (request.id === requestId ? nextRequest : request)),
    )

    if (submit && !steps.some((step) => step.request_id === requestId)) {
      let nextSteps = offices.map((office) =>
        normalizeStepRecord({
          id: makeId('STEP'),
          request_id: requestId,
          office_id: office.id,
          status: STEP_STATUS.PENDING,
          remarks: 'Submitted for office review.',
          reviewed_by: '',
          reviewed_at: '',
          digital_approval_log: [],
          order_no: office.order_no,
        }),
      )

      if (isSupabaseConfigured) {
        const supabaseStepPayload = offices.map((office) => ({
          id:
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : makeId('STEP'),
          request_id: requestId,
          office_id: office.id,
          status: STEP_STATUS.PENDING,
          remarks: 'Submitted for office review.',
          reviewed_by: null,
          reviewed_at: null,
          digital_approval_log: [],
          order_no: office.order_no,
        }))

        const { error } = await withTimeout(
          clearanceService.createSteps(
            supabaseStepPayload,
          ),
          15000,
          'Creating workflow steps timed out. Please try again.',
        )

        if (error) {
          return { error: error.message || 'Failed to create workflow steps.', data: null }
        }

        nextSteps = supabaseStepPayload.map(normalizeStepRecord)
      }

      setSteps((current) => [
        ...nextSteps,
        ...current.filter((step) => step.request_id !== requestId),
      ])
      notify({
        userId: studentId,
        title: 'Clearance request submitted',
        message: `${requestId} has been forwarded to all required offices.`,
        type: 'success',
      })
      notifyMany(
        profiles
          .filter(
            (profile) =>
              profile.role === ROLES.OFFICE &&
              offices.some((office) => office.id === profile.office_id),
          )
          .map((profile) => profile.id),
        {
          title: 'New clearance request assigned',
          message: `${
            getProfile(studentId)?.full_name || 'A student'
          } submitted ${requestId} for office review.`,
          type: 'action',
        },
      )
      notify({
        userId: 'profile-admin',
        title: 'New clearance request submitted',
        message: `${
          getProfile(studentId)?.full_name || 'A student'
        } submitted ${requestId} for workflow processing.`,
        type: 'info',
      })
    } else {
      notify({
        userId: studentId,
        title: 'Draft updated',
        message: `${requestId} was updated in your clearance status list.`,
        type: 'info',
      })
    }

    addAuditLog({
      userId: studentId,
      action: submit ? 'Submitted clearance request' : 'Updated clearance draft',
      module: 'Clearance Requests',
      details: submit
        ? `${requestId} draft was updated and submitted for office review.`
        : `${requestId} draft details were updated by the student.`,
    })

    return { error: null, data: nextRequest }
  }

  async function deleteClearanceRequest({ requestId, studentId }) {
    const targetRequest = requests.find((request) => request.id === requestId)
    if (!targetRequest) {
      return { error: 'Clearance request not found.' }
    }

    if (targetRequest.student_id !== studentId) {
      return { error: 'You can only delete your own clearance request.' }
    }

    if (targetRequest.status !== REQUEST_STATUS.DRAFT) {
      return { error: 'Only draft clearance requests can be deleted.' }
    }

    if (isSupabaseConfigured) {
      const { error } = await withTimeout(
        clearanceService.deleteRequest(requestId),
        15000,
        'Deleting draft request timed out. Please try again.',
      )
      if (error) {
        return { error: error.message || 'Failed to delete draft clearance request.' }
      }
    }

    setRequests((current) => current.filter((request) => request.id !== requestId))
    setSteps((current) => current.filter((step) => step.request_id !== requestId))
    setRemarks((current) =>
      current.filter((remark) => remark.request_id !== requestId),
    )

    addAuditLog({
      userId: studentId,
      action: 'Deleted clearance draft',
      module: 'Clearance Requests',
      details: `${requestId} draft was deleted by the student.`,
    })

    return { error: null }
  }

  async function adminCompleteClearance({ requestId, reviewerId }) {
    const request = requests.find((item) => item.id === requestId)
    if (!request) {
      return { error: 'Clearance request not found.' }
    }

    const requestSteps = steps.filter((step) => step.request_id === requestId)
    if (!requestSteps.length) {
      return { error: 'This request has no workflow steps to complete.' }
    }

    const reviewedAt = nowIso()
    const modifiedSteps = requestSteps.filter(
      (step) => step.status !== STEP_STATUS.NOT_APPLICABLE && step.status !== STEP_STATUS.APPROVED,
    )
    const nextSteps = steps.map((step) => {
      if (step.request_id !== requestId) return step
      if (step.status === STEP_STATUS.NOT_APPLICABLE) return step

      return {
        ...step,
        status: STEP_STATUS.APPROVED,
        remarks: 'Completed directly by the System Administrator.',
        reviewed_by: reviewerId,
        reviewed_at: reviewedAt,
        digital_approval_log: [
          ...(step.digital_approval_log || []),
          {
            status: STEP_STATUS.APPROVED,
            remarks: 'Completed directly by the System Administrator.',
            reviewed_by: reviewerId,
            reviewed_at: reviewedAt,
          },
        ],
      }
    })

    if (isSupabaseConfigured) {
      for (const step of requestSteps) {
        if (step.status === STEP_STATUS.NOT_APPLICABLE) continue

        const { error } = await withTimeout(
          clearanceService.updateStepDecision(step.id, {
          status: STEP_STATUS.APPROVED,
          remarks: 'Completed directly by the System Administrator.',
          reviewed_by: reviewerId,
          reviewed_at: reviewedAt,
          digital_approval_log: [
            ...(step.digital_approval_log || []),
            {
              status: STEP_STATUS.APPROVED,
              remarks: 'Completed directly by the System Administrator.',
              reviewed_by: reviewerId,
              reviewed_at: reviewedAt,
            },
          ],
          }),
          15000,
          'Updating clearance steps timed out. Please try again.',
        )

        if (error) {
          return { error: error.message || 'Failed to complete clearance steps.' }
        }
      }

      const { error: requestError } = await withTimeout(
        clearanceService.updateRequest(requestId, {
          status: REQUEST_STATUS.COMPLETED,
          updated_at: reviewedAt,
          finalized_by: reviewerId,
          finalized_at: reviewedAt,
        }),
        15000,
        'Completing clearance request timed out. Please try again.',
      )

      if (requestError) {
        return { error: requestError.message || 'Failed to update clearance request.' }
      }
    }

    setSteps(nextSteps)
    setRequests((current) =>
      current.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: REQUEST_STATUS.COMPLETED,
              updated_at: reviewedAt,
            }
          : item,
      ),
    )

    if (modifiedSteps.length) {
      setRemarks((current) => [
        ...modifiedSteps.map((step) => ({
          id: makeId('REM'),
          request_id: requestId,
          office_id: step.office_id,
          remarks: 'Completed directly by the System Administrator.',
          created_by: reviewerId,
          created_at: reviewedAt,
        })),
        ...current,
      ])
    }

    notify({
      userId: request.student_id,
      title: 'Clearance request completed',
      message: `${requestId} was approved and marked complete by the System Administrator.`,
      type: 'success',
    })
    addAuditLog({
      userId: reviewerId,
      action: 'Completed clearance request',
      module: 'Admin Clearances',
      details: `${requestId} was fully approved by the System Administrator.`,
    })

    return { error: null, data: { requestId, status: REQUEST_STATUS.COMPLETED } }
  }

  async function adminDeleteClearance({ requestId, reviewerId }) {
    const request = requests.find((item) => item.id === requestId)
    if (!request) {
      return { error: 'Clearance request not found.' }
    }

    if (isSupabaseConfigured) {
      const { error } = await withTimeout(
        clearanceService.deleteRequest(requestId),
        15000,
        'Deleting clearance request timed out. Please try again.',
      )
      if (error) {
        return { error: error.message || 'Failed to delete clearance request.' }
      }
    }

    setRequests((current) => current.filter((item) => item.id !== requestId))
    setSteps((current) => current.filter((step) => step.request_id !== requestId))
    setRemarks((current) =>
      current.filter((remark) => remark.request_id !== requestId),
    )

    notify({
      userId: request.student_id,
      title: 'Clearance request deleted',
      message: `${requestId} was removed by the System Administrator.`,
      type: 'warning',
    })
    addAuditLog({
      userId: reviewerId,
      action: 'Deleted clearance request',
      module: 'Admin Clearances',
      details: `${requestId} was deleted by the System Administrator.`,
    })

    return { error: null }
  }

  async function decideStep({ stepId, reviewerId, decision, reviewRemarks }) {
    const reviewedAt = nowIso()
    const remarksText = reviewRemarks?.trim() || 'No remarks provided.'
    const targetStep = steps.find((step) => step.id === stepId)
    if (!targetStep) return null

    const nextSteps = steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            status: decision,
            remarks: remarksText,
            reviewed_by: reviewerId,
            reviewed_at: reviewedAt,
            digital_approval_log: [
              ...(step.digital_approval_log || []),
              {
                status: decision,
                remarks: remarksText,
                reviewed_by: reviewerId,
                reviewed_at: reviewedAt,
              },
            ],
          }
        : step,
    )
    const nextStatus = recalculateRequestStatus(targetStep.request_id, nextSteps, offices)
    const request = requests.find((item) => item.id === targetStep.request_id)
    const office = getOffice(targetStep.office_id)
    const sortedRequestSteps = nextSteps
      .filter((step) => step.request_id === targetStep.request_id)
      .sort((a, b) => a.order_no - b.order_no)
    const nextPendingStep = sortedRequestSteps.find(
      (step) => step.order_no > targetStep.order_no && step.status === STEP_STATUS.PENDING,
    )
    const nextOfficeAssignees = nextPendingStep
      ? profiles
          .filter(
            (profile) =>
              profile.role === ROLES.OFFICE && profile.office_id === nextPendingStep.office_id,
          )
          .map((profile) => profile.id)
      : []

    if (isSupabaseConfigured) {
      const updatedStep = nextSteps.find((step) => step.id === stepId)
      const { error: stepError } = await withTimeout(
        clearanceService.updateStepDecision(stepId, {
          status: decision,
          remarks: remarksText,
          reviewed_by: reviewerId,
          reviewed_at: reviewedAt,
          digital_approval_log: updatedStep.digital_approval_log,
        }),
        15000,
        'Updating clearance step timed out. Please try again.',
      )

      if (stepError) {
        return { error: stepError.message || 'Failed to update clearance step.' }
      }

      const { error: requestError } = await withTimeout(
        clearanceService.updateRequest(targetStep.request_id, {
          status: nextStatus,
          updated_at: reviewedAt,
        }),
        15000,
        'Updating request status timed out. Please try again.',
      )

      if (requestError) {
        return { error: requestError.message || 'Failed to update clearance request.' }
      }
    }

    setSteps(nextSteps)
    setRequests((current) =>
      current.map((item) =>
        item.id === targetStep.request_id
          ? { ...item, status: nextStatus, updated_at: reviewedAt }
          : item,
      ),
    )
    setRemarks((current) => [
      {
        id: makeId('REM'),
        request_id: targetStep.request_id,
        office_id: targetStep.office_id,
        remarks: remarksText,
        created_by: reviewerId,
        created_at: reviewedAt,
      },
      ...current,
    ])
    notify({
      userId: request.student_id,
      title: `${office.office_name} clearance ${decision.toLowerCase()}`,
      message: remarksText,
      type: decision === STEP_STATUS.APPROVED ? 'success' : 'warning',
    })
    if (
      [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(decision) &&
      nextOfficeAssignees.length
    ) {
      notifyMany(nextOfficeAssignees, {
        title: 'Request moved to your office',
        message: `${targetStep.request_id} is ready for review in your office queue.`,
        type: 'action',
      })
    }
    if (nextStatus === REQUEST_STATUS.COMPLETED) {
      notify({
        userId: 'profile-admin',
        title: 'Clearance request completed',
        message: `${targetStep.request_id} completed all workflow offices.`,
        type: 'success',
      })
    }
    addAuditLog({
      userId: reviewerId,
      action: `${decision} clearance step`,
      module: office.office_name,
      details: `${targetStep.request_id} was marked ${decision}.`,
    })

    return { error: null, data: { requestId: targetStep.request_id, status: nextStatus } }
  }

  function markNotificationRead(notificationId) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification,
      ),
    )
  }

  function markAllNotificationsRead(userId) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.user_id === userId
          ? { ...notification, is_read: true }
          : notification,
      ),
    )
  }

  async function updateManagedUser(userId, payload) {
    const targetRole = roles.find((role) => role.name === payload.role)
    const dbPayload = {
      full_name: payload.fullName ?? null,
      email: payload.email ?? null,
      role_id: targetRole?.id ?? null,
      student_no: payload.studentNumber ?? null,
      course: payload.course ?? null,
      year_level: payload.yearLevel ?? null,
      graduation_term: payload.graduationTerm ?? null,
      office_id: payload.officeId ?? null,
    }

    if (isSupabaseConfigured) {
      const { error } = await directoryService.updateProfile(userId, dbPayload)
      if (error) {
        throw error
      }
    }

    // Update local state immediately for instant feedback.
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === userId
          ? {
              ...profile,
              full_name: payload.fullName ?? profile.full_name,
              email: payload.email ?? profile.email,
              role: payload.role ?? profile.role,
              role_id: targetRole?.id ?? profile.role_id,
              student_no: payload.studentNumber ?? profile.student_no,
              course: payload.course ?? profile.course,
              year_level: payload.yearLevel ?? profile.year_level,
              graduation_term: payload.graduationTerm ?? profile.graduation_term,
              office_id: payload.officeId ?? profile.office_id,
            }
          : profile,
      ),
    )

    addAuditLog({
      userId: 'profile-admin',
      action: 'Updated user account',
      module: 'User Management',
      details: `${payload.fullName} was updated.`,
    })
  }

  async function changeManagedUserPassword(userId, newPassword) {
    // In local/demo mode there is no password state to update.
    // In Supabase mode, the edge function handles it.
    const response = await adminUserServiceExtended.changePassword(userId, newPassword)

    if (response?.error) {
      throw response.error
    }

    addAuditLog({
      userId: 'profile-admin',
      action: 'Changed user password',
      module: 'User Management',
      details: `Password was updated for user ${userId}.`,
    })
  }

  const value = {
    courses,
    coursesLoading,
    coursesError,
    loadingDirectory,
    roles,
    offices,
    profiles,
    requests,
    steps,
    remarks,
    notifications,
    auditLogs,
    requestTrend,
    getProfile,
    getOffice,
    syncDebug,
    getRequest,
    getRequestSteps,
    getStudentRequests,
    getOfficeSteps,
    getUserNotifications,
    getUnreadNotificationCount,
    createManagedUser,
    updateManagedUser,
    changeManagedUserPassword,
    updateProfileRole,
    updateOfficeDetails,
    addOffice,
    addCourse,
    updateWorkflowSettings,
    resetWorkflowDefaults,
    deleteOffice,
    updateCourseDetails,
    deleteCourse,
    createClearanceRequest,
    updateClearanceRequest,
    deleteClearanceRequest,
    adminCompleteClearance,
    adminDeleteClearance,
    decideStep,
    markNotificationRead,
    markAllNotificationsRead,
    notify,
    addAuditLog,
  }

  return (
    <ClearanceContext.Provider value={value}>
      {children}
    </ClearanceContext.Provider>
  )
}
