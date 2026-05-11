import { ROLES } from '@/constants/roles'

export const roles = [
  { id: 'role-student', name: ROLES.STUDENT, label: 'Student' },
  { id: 'role-office', name: ROLES.OFFICE, label: 'College Office Staff' },
  { id: 'role-registrar', name: ROLES.REGISTRAR, label: 'Registrar Office' },
  { id: 'role-admin', name: ROLES.ADMIN, label: 'System Administrator' },
]

export const offices = [
  {
    id: 'office-guidance',
    office_name: 'Guidance',
    description: 'Reviews student conduct, counseling records, and guidance clearances.',
    order_no: 1,
    is_required: true,
  },
  {
    id: 'office-college-library',
    office_name: 'College Library',
    description: 'Validates borrowed college library materials and library obligations.',
    order_no: 2,
    is_required: true,
  },
  {
    id: 'office-property-custodian',
    office_name: 'Property Custodian',
    description: 'Checks returned school property, equipment, and issued materials.',
    order_no: 3,
    is_required: true,
  },
  {
    id: 'office-dean-principal',
    office_name: 'Dean/Principal',
    description: 'Confirms department or school-level requirements and endorsements.',
    order_no: 4,
    is_required: true,
  },
  {
    id: 'office-accounting',
    office_name: 'Accounting Section',
    description: 'Checks balances, fees, assessments, and financial obligations.',
    order_no: 5,
    is_required: true,
  },
  {
    id: 'office-high-school-library',
    office_name: 'High School Library',
    description: 'Marks high school library clearance when applicable.',
    order_no: 6,
    is_required: false,
  },
  {
    id: 'office-ma-library',
    office_name: 'MA Library',
    description: 'Marks graduate school library clearance when applicable.',
    order_no: 7,
    is_required: false,
  },
  {
    id: 'office-college-laboratory',
    office_name: 'College Laboratory',
    description: 'Reviews laboratory equipment, tools, and facility obligations.',
    order_no: 8,
    is_required: false,
  },
  {
    id: 'office-registrar',
    office_name: 'Registrar',
    description: 'Performs final academic verification and completion release.',
    order_no: 9,
    is_required: false,
  },
  {
    id: 'office-student-council',
    office_name: 'Student Council',
    description: 'Confirms student organization and council obligations when required.',
    order_no: 10,
    is_required: false,
  },
]

export const requestedDocumentOptions = [
  'Diploma',
  'Transcript of Records',
  'F137-A',
  'Cross Registration',
  'Permit to Study',
  'Certificate of Grades',
  'Certificate of Enrollment',
  'Certificate of Units Earned',
  'General Weighted Average',
  'Others',
]

export const courseCatalog = [
  {
    id: 'course-bsa',
    title: 'BS in Accountancy',
   },
  {
    id: 'course-bsed',
    title: 'Bachelor in Secondary Education',
    abbreviation: 'B.S.Ed.',
    category: '4-year',
    duration_label: '4 Years',
    department: 'College of Education',
    majors: ['English', 'Mathematics', 'Filipino', 'MAPEH', 'Social Studies'],
  },
  {
    id: 'course-bscs',
    title: 'Bachelor of Science in Computer Science',
    abbreviation: 'B.S.C.S.',
    category: '4-year',
    duration_label: '4 Years',
    department: 'College of Computer Studies',
    majors: [],
  },
  {
    id: 'course-beed',
    title: 'Bachelor in Elementary Education',
    abbreviation: 'B.E.Ed.',
    category: '4-year',
    duration_label: '4 Years',
    department: 'College of Education',
    majors: ['Content Course', 'Special Education', 'Pre-School Education'],
  },
  {
    id: 'course-beced',
    title: 'Bachelor of Early Childhood Education',
    abbreviation: 'B.E.C.Ed',
    category: '4-year',
    duration_label: '4 Years',
    department: 'College of Education',
    majors: [],
  },
  {
    id: 'course-bsned',
    title: 'Bachelor of Special Needs Education',
    abbreviation: 'B.S.N.Ed',
    category: '4-year',
    duration_label: '4 Years',
    department: 'College of Education',
    majors: [],
  },
  {
    id: 'course-bcaed',
    title: 'Bachelor of Culture and Arts Education',
    abbreviation: 'B.C.A.Ed',
    category: '4-year',
    duration_label: '4 Years',
    department: 'College of Education',
    majors: [],
  },
  {
    id: 'course-bped',
    title: 'Bachelor of Physical Education',
    abbreviation: 'B.P.Ed.',
    category: '4-year',
    duration_label: '4 Years',
    department: 'College of Education',
    majors: [],
  },
  {
    id: 'course-dm',
    title: 'Diploma in Midwifery',
    abbreviation: 'DM',
    category: '2-year',
    duration_label: '2 Years',
    department: 'College of Allied Health',
    majors: [],
  },
  {
    id: 'course-maed',
    title: 'Master of Arts in Education',
    abbreviation: 'M.A.Ed.',
    category: 'graduate',
    duration_label: 'Graduate Program',
    department: 'Graduate School',
    majors: ['Educational Leadership', 'Special Education'],
  },
]

// Profiles are loaded from Supabase. No mock accounts.
export const profiles = []

// Clearance requests are loaded from Supabase.
export const clearanceRequests = []

// Clearance steps are loaded from Supabase.
export const clearanceSteps = []

// Remarks are loaded from Supabase.
export const requestRemarks = []

// Notifications are loaded from Supabase.
export const notifications = []

// Audit logs are loaded from Supabase.
export const auditLogs = []

export const requestTrend = [
  { month: 'Jan', submitted: 42, approved: 35, rejected: 5 },
  { month: 'Feb', submitted: 58, approved: 49, rejected: 6 },
  { month: 'Mar', submitted: 76, approved: 63, rejected: 8 },
  { month: 'Apr', submitted: 94, approved: 72, rejected: 11 },
]
