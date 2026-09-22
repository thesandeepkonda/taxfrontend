// src/constants/enums.ts

// ============================================================
// MUST match backend: com.crm.matrix.enums.Department
// ============================================================
export const DEPARTMENT_ENUM = {
  DOCUMENTATION: 'DOCUMENTATION',
  PREPARATION:   'PREPARATION',
  PAYMENT:       'PAYMENT',
  EFILING:       'EFILING',
} as const;

export type DepartmentEnum = keyof typeof DEPARTMENT_ENUM;

export const DEPARTMENT_OPTIONS = [
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'PREPARATION',   label: 'Preparation'   },
  { value: 'PAYMENT',       label: 'Payment'       },
  { value: 'EFILING',       label: 'E-Filing'      },
] as const;

// ============================================================
// MUST match backend: com.crm.matrix.enums.Role
// ============================================================
export const ROLE_ENUM = {
  ADMIN:     'ADMIN',
  TEAM_LEAD: 'TEAM_LEAD',
  EMPLOYEE:  'EMPLOYEE',
} as const;

export type RoleEnum = keyof typeof ROLE_ENUM;

export const ROLE_OPTIONS = [
  { value: 'ADMIN',     label: 'Admin'     },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'EMPLOYEE',  label: 'Employee'  },
] as const;

// ============================================================
// Display helpers — safely format enum values coming from API
// ============================================================
export const formatDepartment = (d?: string | null): string =>
  DEPARTMENT_OPTIONS.find((o) => o.value === d)?.label ?? (d ?? '—');

export const formatRole = (r?: string | null): string =>
  ROLE_OPTIONS.find((o) => o.value === r)?.label ?? (r ?? '—');

// ============================================================
// Runtime validation guards (useful when receiving API payloads)
// ============================================================
export const isDepartmentEnum = (v: any): v is DepartmentEnum =>
  typeof v === 'string' && v in DEPARTMENT_ENUM;

export const isRoleEnum = (v: any): v is RoleEnum =>
  typeof v === 'string' && v in ROLE_ENUM;