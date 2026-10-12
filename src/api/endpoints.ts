/** Every backend path in one place, so a rename is a single edit. */
export const endpoints = {
  admin: {
    login: "/superadmin/loginView/loginUser/",
    logout: "/superadmin/loginView/logout/",
    profile: "/superadmin/loginView/viewProfileDtls/",
    updateProfile: "/superadmin/loginView/updateProfileDtls/",
    changePassword: "/superadmin/loginView/changePassword/",
    forgotPasswordRequest: "/superadmin/loginView/forgetPasswordRequest/",
    verifyOtpAndResetPassword: "/superadmin/loginView/verifyOtpAndResetPassword/",

    createCompany: "/superadmin/companySettings/createCompany/",
    companyList: "/superadmin/companySettings/viewCompanyList/",
    bulkCompanyUpload: "/superadmin/companySettings/bulkCompanyUpload/",
    bulkUploadTemplate: "/superadmin/companySettings/downloadBulkUploadDemoExcel/",
    shareReportUpload:
      "/superadmin/companySettings/uploadNsdlCdslPhysicalShareConsolidatedReport/",
    shareReportLogs:
      "/superadmin/companySettings/viewNsdlCdslPhysicalShareConsolidatedReportLogs/",
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

    reportCategories: "/company/reportView/getAllCategory/",
    reportDates: "/company/reportView/getAllInsertDate/",
    consolidatedShareholding: "/company/reportView/ConsolidatedShareHoldingReport/",
    consolidatedShareholdingExcel: "/company/reportView/ConsolidatedShareHoldingReportexcel/",
    consolidatedShareholdingPdf: "/company/reportView/ConsolidatedShareHoldingReportpdf/",
    consolidatedChange: "/company/reportView/consolidatedChangeInShareHoldingReport/",
    consolidatedChangeExcel: "/company/reportView/consolidatedChangeInShareHoldingExcel/",
    consolidatedChangePdf: "/company/reportView/consolidatedChangeInShareHoldingPdf/",

    distribution: "/company/reportView/distributionOfShareholdersReport/",
    distributionExcel: "/company/reportView/distributionOfShareholdersExcel/",
    distributionPdf: "/company/reportView/distributionOfShareholdersPdf/",

    // Spelled "National" on the wire, though the report is Notional Value.
    notionalValue: "/company/reportView/distributionByNationalValueReport/",
    notionalValueExcel: "/company/reportView/distributionByNationalValueExcel/",
    notionalValuePdf: "/company/reportView/distributionByNationalValuePdf/",

    topHundredComparison: "/company/reportView/topHundredShareholdersReport/",
    topHundredComparisonExcel: "/company/reportView/topHundredShareholdersExcel/",
    topHundredComparisonPdf: "/company/reportView/topHundredShareholdersPdf/",

    shareHolding: "/company/reportView/shareHoldingReport/",
    shareHoldingExcel: "/company/reportView/shareHoldingExcelExport/",
    shareHoldingPdf: "/company/reportView/shareHoldingPdf/",

    pledgeShares: "/company/reportView/pledgeSharesSummaryReport/",
    pledgeSharesExcel: "/company/reportView/pledgeSharesSummaryExcel/",
    pledgeSharesPdf: "/company/reportView/pledgeSharesSummaryPdf/",

    lockInShares: "/company/reportView/lockInSharesSummaryReport/",
    lockInSharesExcel: "/company/reportView/lockInSharesSummaryExcel/",
    lockInSharesPdf: "/company/reportView/lockInSharesSummaryPdf/",

    capitalAnalysis: "/company/reportView/capitalAnalysisReport/",
    capitalAnalysisExcel: "/company/reportView/capitalAnalysisExcel/",
    capitalAnalysisPdf: "/company/reportView/capitalAnalysisPdf/",

    topShareholders: "/company/reportView/topShareHoldersReport/",
    topShareholdersExcel: "/company/reportView/topShareHoldersExcel/",
    topShareholdersPdf: "/company/reportView/topShareHoldersPdf/",

    onePercentShareholders:
      "/company/reportView/shareholdersHoldingOnePercentAndAboveSharesReport/",
    onePercentShareholdersExcel:
      "/company/reportView/shareholdersHoldingOnePercentAndAboveSharesExcel/",
    onePercentShareholdersPdf:
      "/company/reportView/shareholdersHoldingOnePercentAndAboveSharesPdf/",
  },
} as const
