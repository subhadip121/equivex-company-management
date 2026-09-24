import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchReportLogs, uploadShareReport } from "@/api/reports"
import { queryKeys } from "@/lib/query-keys"

/** Every cached page of the report log shares this prefix. */
export const REPORT_LOGS_KEY = ["admin", "report-logs"]

export function useReportLogs(page: number, pageSize: number) {
  return useQuery({
    queryKey: queryKeys.reportLogs(page, pageSize),
    queryFn: () => fetchReportLogs(page, pageSize),
    placeholderData: keepPreviousData,
  })
}

export function useUploadShareReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadShareReport,
    onSuccess: () => {
      // Any upload, even a partial one, changes the log.
      void queryClient.invalidateQueries({ queryKey: REPORT_LOGS_KEY })
    },
  })
}
