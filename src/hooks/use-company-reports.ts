import { useMutation, useQuery } from "@tanstack/react-query"
import {
  downloadConsolidatedShareholdingExcel,
  downloadConsolidatedShareholdingPdf,
  fetchConsolidatedShareholding,
  fetchReportCategories,
  fetchReportDates,
  type ConsolidatedReportRequest,
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
