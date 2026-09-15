import { TableCell, TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * Pins a table's action column to the right edge of its scroll area, so the
 * actions stay reachable when a wide table scrolls sideways on small screens.
 *
 * A sticky cell needs a solid background or scrolled content shows through
 * it. Rows tint to muted/50 on hover and while their menu is open, so the
 * cell mixes the same tint in as an opaque colour instead.
 */
const STICKY_ACTION = cn(
  "sticky right-0 z-10 w-px bg-card",
  "[tr:hover>&]:bg-[color-mix(in_oklab,var(--card),var(--muted)_50%)]",
  "[tr:has([aria-expanded=true])>&]:bg-[color-mix(in_oklab,var(--card),var(--muted)_50%)]",
  // Edge shadow marks where scrolled columns slide underneath. Below lg is
  // where tables overflow; wider screens show every column.
  "max-lg:shadow-[-6px_0_8px_-6px_rgb(0_0_0/0.35)]",
)

export function TableActionHead({
  className,
  children = "Action",
  ...props
}: React.ComponentProps<typeof TableHead>) {
  return (
    <TableHead className={cn(STICKY_ACTION, "text-center", className)} {...props}>
      {children}
    </TableHead>
  )
}

export function TableActionCell({ className, ...props }: React.ComponentProps<typeof TableCell>) {
  return <TableCell className={cn(STICKY_ACTION, "text-center", className)} {...props} />
}
