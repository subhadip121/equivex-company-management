import logoUrl from "@/assets/logo.svg"
import markUrl from "@/assets/mark.svg"
import { cn } from "@/lib/utils"

/**
 * The supplied artwork is dark navy on transparent, so in dark mode it is
 * inverted and hue-rotated back, which keeps the brand hues readable.
 */
const DARK_MODE_FIX = "dark:invert dark:hue-rotate-180"

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="Equivex"
      className={cn("h-9 w-auto select-none", DARK_MODE_FIX, className)}
      draggable={false}
    />
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={markUrl}
      alt=""
      aria-hidden="true"
      className={cn("size-6 w-auto select-none", className)}
      draggable={false}
    />
  )
}
