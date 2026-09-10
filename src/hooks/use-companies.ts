import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  changeCompanyPassword,
  changeCompanyStatus,
  createCompany,
  fetchCompanyById,
  fetchCompanyList,
  updateCompany,
} from "@/api/companies"
import { queryKeys } from "@/lib/query-keys"
import type { UpdateCompanyPayload } from "@/types"

/** Every cached page of the company list shares this prefix. */
const COMPANY_LIST_KEY = ["admin", "companies"]

export function useCompanyList(page: number, pageSize: number) {
  return useQuery({
    queryKey: queryKeys.companies(page, pageSize),
    queryFn: () => fetchCompanyList(page, pageSize),
    // Keeps the current page on screen while the next one loads, so the
    // table never collapses into a spinner between pages.
    placeholderData: keepPreviousData,
  })
}

export function useCompany(id: number | string | null) {
  return useQuery({
    queryKey: queryKeys.company(id ?? ""),
    queryFn: () => fetchCompanyById(id!),
    enabled: id !== null && id !== "",
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMPANY_LIST_KEY })
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminStats })
    },
  })
}

export function useUpdateCompany(id: number | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateCompanyPayload) => updateCompany(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMPANY_LIST_KEY })
      void queryClient.invalidateQueries({ queryKey: queryKeys.company(id) })
    },
  })
}

export function useChangeCompanyStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: number | string; active: boolean }) =>
      changeCompanyStatus(id, active),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: COMPANY_LIST_KEY })
      void queryClient.invalidateQueries({ queryKey: queryKeys.company(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminStats })
    },
  })
}

export function useChangeCompanyPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number | string; newPassword: string }) =>
      changeCompanyPassword(id, newPassword),
  })
}
