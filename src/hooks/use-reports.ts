import { useMutation } from "@tanstack/react-query"
import { uploadShareReport } from "@/api/reports"

export function useUploadShareReport() {
  return useMutation({ mutationFn: uploadShareReport })
}
