import type { Paginated } from "@/types"

/**
 * Pagination metadata, wherever the backend chose to put it. Django REST
 * Framework's default is { count, next, previous, results }; custom
 * paginators often add total_pages/current_page, or nest the lot under
 * `pagination` or `meta`.
 */
interface PageMeta<T> {
  count?: number
  total?: number
  total_records?: number
  total_count?: number
  total_pages?: number
  num_pages?: number
  last_page?: number
  current_page?: number
  page?: number
  page_size?: number
  per_page?: number
  next?: unknown
  previous?: unknown
  results?: T[]
  data?: T[]
  items?: T[]
}

interface PageEnvelope<T> extends Omit<PageMeta<T>, "data"> {
  data?: T[] | (PageMeta<T> & { results?: T[] })
  pagination?: PageMeta<T>
  meta?: PageMeta<T>
}

function firstNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number" && Number.isFinite(value))
}

/** Reads a paginated list out of whichever envelope the backend used. */
export function normalizePage<T>(
  response: unknown,
  page: number,
  pageSize: number,
): Paginated<T> {
  if (Array.isArray(response)) {
    // No envelope: the whole set arrived, so page it here.
    const start = (page - 1) * pageSize
    return {
      items: response.slice(start, start + pageSize) as T[],
      total: response.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(response.length / pageSize)),
    }
  }

  const envelope = (response ?? {}) as PageEnvelope<T>
  const nested = Array.isArray(envelope.data) ? undefined : envelope.data

  // Metadata may sit at the top level or in any of these wrappers.
  const sources = [envelope, envelope.pagination, envelope.meta, nested].filter(
    Boolean,
  ) as PageMeta<T>[]

  const items =
    envelope.results ??
    (Array.isArray(envelope.data) ? envelope.data : undefined) ??
    nested?.results ??
    nested?.data ??
    envelope.items ??
    nested?.items ??
    []

  const total =
    firstNumber(
      ...sources.flatMap((source) => [
        source.count,
        source.total,
        source.total_records,
        source.total_count,
      ]),
    ) ?? items.length

  const effectivePageSize =
    firstNumber(...sources.flatMap((source) => [source.page_size, source.per_page])) || pageSize

  const currentPage =
    firstNumber(...sources.flatMap((source) => [source.current_page, source.page])) ?? page

  const reportedPages = firstNumber(
    ...sources.flatMap((source) => [source.total_pages, source.num_pages, source.last_page]),
  )

  // With no count and no page total, a `next` link is the only proof that
  // another page exists.
  const hasNext = sources.some((source) => Boolean(source.next))
  const derivedPages = Math.max(1, Math.ceil(total / effectivePageSize))

  return {
    items,
    total,
    page: currentPage,
    pageSize: effectivePageSize,
    totalPages: reportedPages ?? (hasNext ? Math.max(derivedPages, currentPage + 1) : derivedPages),
  }
}
