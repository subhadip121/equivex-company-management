import { Plus, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DEFAULT_RANGES,
  isBlankRange,
  MAX_HOLDING,
  type RangeDraft,
} from "@/lib/holding-ranges"
import { normalizeDigits } from "@/lib/validation"

export function HoldingRangeEditor({
  ranges,
  onChange,
  disabled,
}: {
  ranges: RangeDraft[]
  onChange: (ranges: RangeDraft[]) => void
  disabled?: boolean
}) {
  function setField(index: number, field: keyof RangeDraft, value: string) {
    const entered = normalizeDigits(value, 12)
    const next = ranges.map((range, position) =>
      position === index ? { ...range, [field]: entered } : range,
    )

    // Closing one band opens the next: typing 1 to 10000 makes the row
    // below start at 10001 and run to the top of the scale.
    const follower = next[index + 1]
    if (field === "to" && entered && follower) {
      next[index + 1] = {
        from: String(Number(entered) + 1),
        to: follower.to.trim() ? follower.to : MAX_HOLDING,
      }
    }

    onChange(next)
  }

  function addRange() {
    // A new row starts one above the last band that has an upper bound.
    const lastFilled = [...ranges].reverse().find((range) => range.to.trim())
    const nextFrom = lastFilled ? String(Number(lastFilled.to) + 1) : ""
    onChange([...ranges, { from: nextFrom, to: nextFrom ? MAX_HOLDING : "" }])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">
          Share holding ranges
          <span className="ml-1 font-normal text-muted-foreground">
            (leave rows blank to skip them)
          </span>
        </Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={disabled}
            onClick={() => onChange(DEFAULT_RANGES)}
            className="gap-1"
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={disabled}
            onClick={addRange}
            className="gap-1"
          >
            <Plus className="size-3" />
            Add range
          </Button>
        </div>
      </div>

      {/* Pairs flow across the width, so eight rows take two or three
          columns rather than one tall list. */}
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {ranges.map((range, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
            <Input
              aria-label={`Range ${index + 1} from`}
              inputMode="numeric"
              value={range.from}
              onChange={(event) => setField(index, "from", event.target.value)}
              placeholder="From"
              disabled={disabled}
              className="h-9 tabular-nums"
            />
            <Input
              aria-label={`Range ${index + 1} to`}
              inputMode="numeric"
              value={range.to}
              onChange={(event) => setField(index, "to", event.target.value)}
              placeholder="To"
              disabled={disabled}
              className="h-9 tabular-nums"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Clear range ${index + 1}`}
              // A blank row has nothing to clear and is not worth removing.
              disabled={disabled || isBlankRange(range)}
              onClick={() =>
                onChange(
                  ranges.map((entry, position) =>
                    position === index ? { from: "", to: "" } : entry,
                  ),
                )
              }
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
