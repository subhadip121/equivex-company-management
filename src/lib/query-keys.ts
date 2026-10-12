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
  reportLogs: (page: number, pageSize: number) =>
    ["admin", "report-logs", { page, pageSize }] as const,

  reportCategories: ["company", "report-categories"] as const,
  reportDates: ["company", "report-dates"] as const,
  consolidatedShareholding: (date: string, categories: string[]) =>
    ["company", "consolidated-shareholding", { date, categories }] as const,
  consolidatedChange: (
    date1: string,
    date2: string,
    categories: string[],
    depositoryType: string,
    aboveValue: string,
  ) =>
    [
      "company",
      "consolidated-change",
      { date1, date2, categories, depositoryType, aboveValue },
    ] as const,
  distribution: (date: string, ranges: Array<{ from: number; to: number }>) =>
    ["company", "distribution", { date, ranges }] as const,
  notionalValue: (date: string, ranges: Array<{ from: number; to: number }>) =>
    ["company", "notional-value", { date, ranges }] as const,
  topHundredComparison: (date1: string, date2: string, categories: string[]) =>
    ["company", "top-hundred-comparison", { date1, date2, categories }] as const,
  shareHolding: (
    dates: string[],
    categories: string[],
    range: number,
    keys: string[],
    page: number,
    pageSize: number,
  ) =>
    ["company", "share-holding", { dates, categories, range, keys, page, pageSize }] as const,
  pledgeShares: (date: string, categories: string[]) =>
    ["company", "pledge-shares", { date, categories }] as const,
  lockInShares: (date: string, categories: string[]) =>
    ["company", "lock-in-shares", { date, categories }] as const,
  capitalAnalysis: (date: string) => ["company", "capital-analysis", { date }] as const,
  topShareholders: (date: string, range: number, page: number, pageSize: number) =>
    ["company", "top-shareholders", { date, range, page, pageSize }] as const,
  onePercentShareholders: (date: string, page: number, pageSize: number) =>
    ["company", "one-percent-shareholders", { date, page, pageSize }] as const,

  companyStats: (isin: string) => ["company", isin, "stats"] as const,
  companyActivity: (isin: string) => ["company", isin, "activity"] as const,
  companyDeadline: (isin: string) => ["company", isin, "deadline"] as const,
}
