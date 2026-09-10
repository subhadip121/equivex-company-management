/**
 * Single source of truth for cache keys. Anything that invalidates data
 * should reference these rather than typing string arrays by hand.
 */
export const queryKeys = {
  session: ["session"] as const,
  adminProfile: ["admin", "profile"] as const,
  companyProfile: ["company", "profile"] as const,

  adminStats: ["admin", "stats"] as const,
  recentCompanies: ["admin", "companies", "recent"] as const,
  companies: (page: number, pageSize: number) =>
    ["admin", "companies", { page, pageSize }] as const,
  company: (id: number | string) => ["admin", "company", String(id)] as const,

  companyStats: (isin: string) => ["company", isin, "stats"] as const,
  companyActivity: (isin: string) => ["company", isin, "activity"] as const,
  companyDeadline: (isin: string) => ["company", isin, "deadline"] as const,
}
