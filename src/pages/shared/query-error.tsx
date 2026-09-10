import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function QueryError({
  message = "Something went wrong while loading this data.",
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>Could not load</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>{message}</span>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
