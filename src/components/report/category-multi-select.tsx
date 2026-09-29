import { useMemo, useState } from "react"
import { Check, ChevronsUpDown, Minus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { flattenCategories, type CategoryGroup } from "@/api/company-reports"

type CheckState = boolean | "mixed"

/**
 * Checkbox list in a popover, grouped the way the API groups categories.
 * With around a hundred codes, search and per-group toggles matter more
 * than a plain list: a single select cannot express "all but two".
 */
export function CategoryMultiSelect({
  groups,
  selected,
  onChange,
  isLoading,
  disabled,
}: {
  groups: CategoryGroup[]
  selected: string[]
  onChange: (values: string[]) => void
  isLoading?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const allOptions = useMemo(() => flattenCategories(groups), [groups])
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const visibleGroups = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return groups

    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (option) =>
            option.label.toLowerCase().includes(term) ||
            option.value.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.options.length > 0)
  }, [groups, search])

  const allSelected = allOptions.length > 0 && selected.length === allOptions.length

  function toggle(value: string) {
    onChange(
      selectedSet.has(value) ? selected.filter((entry) => entry !== value) : [...selected, value],
    )
  }

  function toggleGroup(group: CategoryGroup, select: boolean) {
    const codes = group.options.map((option) => option.value)
    if (select) {
      onChange([...selected, ...codes.filter((code) => !selectedSet.has(code))])
      return
    }
    const removing = new Set(codes)
    onChange(selected.filter((entry) => !removing.has(entry)))
  }

  if (isLoading) return <Skeleton className="h-10 w-full" />

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || allOptions.length === 0}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{summarise(selected, allOptions.length)}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories"
              className="h-9 pl-8"
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {selected.length} of {allOptions.length} selected
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={allSelected}
                onClick={() => onChange(allOptions.map((option) => option.value))}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={selected.length === 0}
                onClick={() => onChange([])}
              >
                Deselect all
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-1">
          {visibleGroups.length === 0 ? (
            <p className="p-3 text-center text-sm text-muted-foreground">No categories match.</p>
          ) : (
            visibleGroups.map((group) => {
              const codes = group.options.map((option) => option.value)
              const chosen = codes.filter((code) => selectedSet.has(code)).length
              const state: CheckState = chosen === 0 ? false : chosen === codes.length ? true : "mixed"

              return (
                <div key={group.label} className="mb-1 last:mb-0">
                  <Row
                    checked={state}
                    onToggle={() => toggleGroup(group, state !== true)}
                    className="sticky top-0 z-10 bg-popover"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-wide uppercase">
                      {group.label}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {chosen}/{codes.length}
                    </span>
                  </Row>

                  {group.options.map((option) => (
                    <Row
                      key={option.value}
                      checked={selectedSet.has(option.value)}
                      onToggle={() => toggle(option.value)}
                      className="pl-7"
                    >
                      <span className="min-w-0 flex-1 text-pretty">{option.label}</span>
                      <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                        {option.value}
                      </Badge>
                    </Row>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * The whole row is the control, so a click anywhere toggles it. The box is
 * drawn rather than composed from a checkbox component, because nesting a
 * button inside this button would be invalid markup.
 */
function Row({
  checked,
  onToggle,
  className,
  children,
}: {
  checked: CheckState
  onToggle: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked === "mixed" ? "mixed" : checked}
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          checked === false
            ? "border-input"
            : "border-primary bg-primary text-primary-foreground",
        )}
      >
        {checked === true ? <Check className="size-3" strokeWidth={3} /> : null}
        {checked === "mixed" ? <Minus className="size-3" strokeWidth={3} /> : null}
      </span>
      {children}
    </button>
  )
}

function summarise(selected: string[], total: number) {
  if (total === 0) return "No categories available"
  if (selected.length === 0) return "No categories selected"
  if (selected.length === total) return `All categories (${total})`
  return `${selected.length} of ${total} categories`
}
