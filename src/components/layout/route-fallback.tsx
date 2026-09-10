import { Loader2 } from "lucide-react"

export function RouteFallback() {
  return (
    <div className="flex min-h-64 flex-1 items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}
