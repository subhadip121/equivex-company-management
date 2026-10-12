import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"
import {
  downloadCapitalAnalysisExcel,
  downloadCapitalAnalysisPdf,
  downloadConsolidatedChangeExcel,
  downloadConsolidatedChangePdf,
  downloadConsolidatedShareholdingExcel,
  downloadDistributionExcel,
  downloadDistributionPdf,
  downloadNotionalValueExcel,
  downloadLockInSharesExcel,
  downloadPledgeSharesExcel,
  downloadPledgeSharesPdf,
  downloadShareHoldingExcel,
  downloadShareHoldingPdf,
  downloadLockInSharesPdf,
  downloadNotionalValuePdf,
  downloadTopHundredExcel,
  downloadTopHundredPdf,
  downloadConsolidatedShareholdingPdf,
  downloadOnePercentShareholdersExcel,
  downloadOnePercentShareholdersPdf,
  downloadTopShareholdersExcel,
  downloadTopShareholdersPdf,
  fetchCapitalAnalysis,
  fetchConsolidatedChange,
  fetchConsolidatedShareholding,
  fetchDistribution,
  fetchLockInShares,
  fetchPledgeShares,
  fetchShareHolding,
  fetchNotionalValue,
  fetchTopHundredComparison,
  fetchOnePercentShareholders,
  fetchReportCategories,
  fetchReportDates,
  fetchTopShareholders,
  type CapitalAnalysisRequest,
  type ConsolidatedChangeRequest,
  type ConsolidatedReportRequest,
  type DistributionRequest,
  type LockInRequest,
  type ShareHoldingRequest,
  type TopHundredRequest,
  type OnePercentShareholdersRequest,
  type TopShareholdersRequest,
} from "@/api/company-reports"
import { queryKeys } from "@/lib/query-keys"

/** Filter options rarely change, so they stay fresh for the session. */
const LOOKUP_STALE_TIME = 30 * 60_000

export function useReportCategories() {
  return useQuery({
    queryKey: queryKeys.reportCategories,
    queryFn: fetchReportCategories,
    staleTime: LOOKUP_STALE_TIME,
  })
}

export function useReportDates() {
  return useQuery({
    queryKey: queryKeys.reportDates,
    queryFn: fetchReportDates,
    staleTime: LOOKUP_STALE_TIME,
  })
}

/**
 * Runs only once filters have been applied, so opening the page does not
 * fire a report request before a date is chosen.
 */
export function useConsolidatedShareholding(request: ConsolidatedReportRequest | null) {
  return useQuery({
    queryKey: queryKeys.consolidatedShareholding(
      request?.date ?? "",
      request?.categories ?? [],
    ),
    queryFn: () => fetchConsolidatedShareholding(request!),
    enabled: request !== null,
  })
}

export function useDownloadConsolidatedShareholding() {
  const excel = useMutation({ mutationFn: downloadConsolidatedShareholdingExcel })
  const pdf = useMutation({ mutationFn: downloadConsolidatedShareholdingPdf })
  return { excel, pdf }
}

export function useConsolidatedChange(request: ConsolidatedChangeRequest | null) {
  return useQuery({
    queryKey: queryKeys.consolidatedChange(
      request?.date1 ?? "",
      request?.date2 ?? "",
      request?.categories ?? [],
      request?.depositoryType ?? "ALL",
      request?.aboveValue ?? "",
    ),
    queryFn: () => fetchConsolidatedChange(request!),
    enabled: request !== null,
  })
}

export function useDownloadConsolidatedChange() {
  const excel = useMutation({ mutationFn: downloadConsolidatedChangeExcel })
  const pdf = useMutation({ mutationFn: downloadConsolidatedChangePdf })
  return { excel, pdf }
}

export function useDistribution(request: DistributionRequest | null) {
  return useQuery({
    queryKey: queryKeys.distribution(request?.date ?? "", request?.ranges ?? []),
    queryFn: () => fetchDistribution(request!),
    enabled: request !== null,
  })
}

export function useDownloadDistribution() {
  const excel = useMutation({ mutationFn: downloadDistributionExcel })
  const pdf = useMutation({ mutationFn: downloadDistributionPdf })
  return { excel, pdf }
}

export function useNotionalValue(request: DistributionRequest | null) {
  return useQuery({
    queryKey: queryKeys.notionalValue(request?.date ?? "", request?.ranges ?? []),
    queryFn: () => fetchNotionalValue(request!),
    enabled: request !== null,
  })
}

export function useDownloadNotionalValue() {
  const excel = useMutation({ mutationFn: downloadNotionalValueExcel })
  const pdf = useMutation({ mutationFn: downloadNotionalValuePdf })
  return { excel, pdf }
}

export function useTopHundredComparison(request: TopHundredRequest | null) {
  return useQuery({
    queryKey: queryKeys.topHundredComparison(
      request?.date1 ?? "",
      request?.date2 ?? "",
      request?.categories ?? [],
    ),
    queryFn: () => fetchTopHundredComparison(request!),
    enabled: request !== null,
  })
}

export function useDownloadTopHundredComparison() {
  const excel = useMutation({ mutationFn: downloadTopHundredExcel })
  const pdf = useMutation({ mutationFn: downloadTopHundredPdf })
  return { excel, pdf }
}

export function useLockInShares(request: LockInRequest | null) {
  return useQuery({
    queryKey: queryKeys.lockInShares(request?.date ?? "", request?.categories ?? []),
    queryFn: () => fetchLockInShares(request!),
    enabled: request !== null,
  })
}

export function useDownloadLockInShares() {
  const excel = useMutation({ mutationFn: downloadLockInSharesExcel })
  const pdf = useMutation({ mutationFn: downloadLockInSharesPdf })
  return { excel, pdf }
}

export function useShareHolding(request: ShareHoldingRequest | null) {
  return useQuery({
    queryKey: queryKeys.shareHolding(
      request?.dates ?? [],
      request?.categories ?? [],
      request?.range ?? 0,
      request?.keys ?? [],
      request?.page ?? 1,
      request?.pageSize ?? 0,
    ),
    queryFn: () => fetchShareHolding(request!),
    enabled: request !== null,
    placeholderData: keepPreviousData,
  })
}

export function useDownloadShareHolding() {
  const excel = useMutation({ mutationFn: downloadShareHoldingExcel })
  const pdf = useMutation({ mutationFn: downloadShareHoldingPdf })
  return { excel, pdf }
}

export function usePledgeShares(request: LockInRequest | null) {
  return useQuery({
    queryKey: queryKeys.pledgeShares(request?.date ?? "", request?.categories ?? []),
    queryFn: () => fetchPledgeShares(request!),
    enabled: request !== null,
  })
}

export function useDownloadPledgeShares() {
  const excel = useMutation({ mutationFn: downloadPledgeSharesExcel })
  const pdf = useMutation({ mutationFn: downloadPledgeSharesPdf })
  return { excel, pdf }
}

export function useCapitalAnalysis(request: CapitalAnalysisRequest | null) {
  return useQuery({
    queryKey: queryKeys.capitalAnalysis(request?.date ?? ""),
    queryFn: () => fetchCapitalAnalysis(request!),
    enabled: request !== null,
  })
}

export function useDownloadCapitalAnalysis() {
  const excel = useMutation({ mutationFn: downloadCapitalAnalysisExcel })
  const pdf = useMutation({ mutationFn: downloadCapitalAnalysisPdf })
  return { excel, pdf }
}

export function useTopShareholders(request: TopShareholdersRequest | null) {
  return useQuery({
    queryKey: queryKeys.topShareholders(
      request?.date ?? "",
      request?.range ?? 100,
      request?.page ?? 1,
      request?.pageSize ?? 200,
    ),
    queryFn: () => fetchTopShareholders(request!),
    enabled: request !== null,
    placeholderData: keepPreviousData,
  })
}

export function useDownloadTopShareholders() {
  const excel = useMutation({ mutationFn: downloadTopShareholdersExcel })
  const pdf = useMutation({ mutationFn: downloadTopShareholdersPdf })
  return { excel, pdf }
}

export function useOnePercentShareholders(
  request: OnePercentShareholdersRequest | null,
) {
  return useQuery({
    queryKey: queryKeys.onePercentShareholders(
      request?.date ?? "",
      request?.page ?? 1,
      request?.pageSize ?? 200,
    ),
    queryFn: () => fetchOnePercentShareholders(request!),
    enabled: request !== null,
    placeholderData: keepPreviousData,
  })
}

export function useDownloadOnePercentShareholders() {
  const excel = useMutation({ mutationFn: downloadOnePercentShareholdersExcel })
  const pdf = useMutation({ mutationFn: downloadOnePercentShareholdersPdf })
  return { excel, pdf }
}
