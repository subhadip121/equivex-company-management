/** Every backend path in one place, so a rename is a single edit. */
export const endpoints = {
  admin: {
    login: "/superadmin/loginView/loginUser/",
    logout: "/superadmin/loginView/logout/",
    profile: "/superadmin/loginView/viewProfileDtls/",
    updateProfile: "/superadmin/loginView/updateProfileDtls/",

    createCompany: "/superadmin/companySettings/createCompany/",
    companyList: "/superadmin/companySettings/viewCompanyList/",
    companyById: (id: number | string) =>
      `/superadmin/companySettings/${id}/viewCompanyDetailsById/`,
    updateCompany: (id: number | string) => `/superadmin/companySettings/${id}/updateCompany/`,
    changeCompanyStatus: (id: number | string) =>
      `/superadmin/companySettings/${id}/changeCompanyStatus/`,
    changeCompanyPassword: (id: number | string) =>
      `/superadmin/companySettings/${id}/changeCompanyPassword/`,
  },
  company: {
    login: "/company/loginView/loginCompany/",
    logout: "/company/loginView/logout/",
    profile: "/company/loginView/viewProfileDtls/",
    changePassword: "/company/loginView/changeCompanyPassword/",
  },
} as const
