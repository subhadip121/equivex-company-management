export type UserRole = "admin" | "company"

export type CompanyStatus = "active" | "suspended" | "pending"

/** Mirrors the payload of /superadmin/loginView/viewProfileDtls/ */
export interface AdminProfile {
  id: number
  first_name: string
  middle_name: string
  last_name: string
  mobile: string
  email: string
}

export interface AdminUser {
  id: string
  role: "admin"
  name: string
  username: string
  email: string
  profile?: AdminProfile
}

/** Mirrors the payload of /company/loginView/viewProfileDtls/ */
export interface CompanyProfile {
  id: number
  company_name?: string
  company_isin?: string
  email?: string
  mobile?: string
  address?: string
  registration_number?: string
  status?: string | boolean | number | null
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
}

export interface CompanyUser {
  id: string
  role: "company"
  name: string
  isin: string
  email: string
  status: CompanyStatus
  profile?: CompanyProfile
}

export type AuthUser = AdminUser | CompanyUser

export interface AdminCredentials {
  username: string
  password: string
}

export interface CompanyCredentials {
  isin: string
  password: string
}

/** Payload of /superadmin/companySettings/createCompany/ */
export interface CreateCompanyPayload {
  company_name: string
  company_isin: string
  company_cin: string
  company_code: string
  email: string
  phone_no: string
  fax: string
  website: string
  address: string
}

/** A row from /superadmin/companySettings/viewCompanyList/ */
export interface Company {
  id: number
  company_name: string
  company_isin: string
  company_cin: string
  company_code: string
  email: string
  phone_no: string
  fax: string
  website: string
  address: string
  /** The backend may send a boolean, a 1/0 flag, or a word. */
  status?: string | boolean | number | null
  created_at?: string
}

/**
 * Payload of the update endpoint. Note it carries no company_code:
 * the code is set at creation and is not editable.
 */
export type UpdateCompanyPayload = Omit<CreateCompanyPayload, "company_code">

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Session {
  user: AuthUser
  token: string | null
}
