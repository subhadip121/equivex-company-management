import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Builds a compact page list with gaps, e.g. 1 … 4 5 6 … 20, so the bar
 * stays a fixed width however many pages there are.
 */
function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages: Array<number | "gap"> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push("gap")
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < total - 1) pages.push("gap")
  pages.push(total)

  return pages
}

export function PaginationBar({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  isFetching,
}: {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  isFetching?: boolean
}) {
  if (totalPages <= 1 && total <= pageSize) return null

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {first} to {last} of {total}
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1 || isFetching}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pageWindow(page, totalPages).map((entry, index) =>
          entry === "gap" ? (
            <span
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={entry}
              variant={entry === page ? "default" : "outline"}
              size="icon-sm"
              aria-label={`Page ${entry}`}
              aria-current={entry === page ? "page" : undefined}
              disabled={isFetching}
              onClick={() => onPageChange(entry)}
            >
              {entry}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= totalPages || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  )
}
