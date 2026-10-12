import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"
import {
  downloadCapitalAnalysisExcel,
  downloadCapitalAnalysisPdf,
  downloadConsolidatedShareholdingExcel,
  downloadConsolidatedShareholdingPdf,
  downloadOnePercentShareholdersExcel,
  downloadOnePercentShareholdersPdf,
  downloadTopShareholdersExcel,
  downloadTopShareholdersPdf,
  fetchCapitalAnalysis,
  fetchConsolidatedShareholding,
  fetchOnePercentShareholders,
  fetchReportCategories,
  fetchReportDates,
  fetchTopShareholders,
  type CapitalAnalysisRequest,
  type ConsolidatedReportRequest,
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
