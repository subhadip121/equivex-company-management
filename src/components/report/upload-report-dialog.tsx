import { useState } from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { FileDropZone } from "@/components/upload/file-drop-zone"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUploadShareReport } from "@/hooks/use-reports"
import type { ReportType, ShareReportResult, UploadAction } from "@/api/reports"

const EXTENSIONS = [".txt", ".csv", ".xlsx", ".xls"]
const MAX_BYTES = 25 * 1024 * 1024

const REPORT_TYPES: Array<{ value: ReportType; label: string }> = [
  { value: "year_ending", label: "Year ending" },
  { value: "AGM", label: "AGM" },
]

export function UploadReportDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="size-4" />
          Upload report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload report</DialogTitle>
          <DialogDescription>
            Upload the NSDL, CDSL and physical share consolidated report.
          </DialogDescription>
        </DialogHeader>
        {/* Remounting on open clears the previous file and result. */}
        {open ? <UploadForm onClose={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function UploadForm({ onClose }: { onClose: () => void }) {
  const uploadReport = useUploadShareReport()

  const [file, setFile] = useState<File | null>(null)
  const [reportType, setReportType] = useState<ReportType>("year_ending")
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ShareReportResult | null>(null)

  function send(uploadAction: UploadAction) {
    if (!file) {
      setError("Choose a report file to upload.")
      return
    }

    setError(null)
    setResult(null)
    setProgress(0)

    uploadReport.mutate(
      { file, reportType, uploadAction, onProgress: setProgress },
      {
        onSuccess: (uploadResult) => {
          setResult(uploadResult)
          if (uploadResult.outcome === "success") {
            toast.success(uploadResult.message ?? "Report uploaded")
            onClose()
          }
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="report-type">Report type</Label>
        <Select
          value={reportType}
          onValueChange={(value) => setReportType(value as ReportType)}
          disabled={uploadReport.isPending}
        >
          <SelectTrigger id="report-type" className="w-full">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Report file</Label>
        <FileDropZone
          file={file}
          onSelect={(next) => {
            setFile(next)
            setResult(null)
            setProgress(0)
          }}
          onProblem={setError}
          extensions={EXTENSIONS}
          maxBytes={MAX_BYTES}
          disabled={uploadReport.isPending}
        />
      </div>

      {uploadReport.isPending ? (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress < 100 ? "Uploading…" : "Processing on the server…"}</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <ResultPanel
          result={result}
          isPending={uploadReport.isPending}
          onChooseAction={send}
          onClose={onClose}
        />
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="gap-2"
            disabled={uploadReport.isPending || !file}
            onClick={() => send("new")}
          >
            {uploadReport.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploadReport.isPending ? "Uploading…" : "Upload report"}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Each outcome has exactly one way forward:
 * a conflict is resolved by re-uploading, a partial upload by continuing.
 */
function ResultPanel({
  result,
  isPending,
  onChooseAction,
  onClose,
}: {
  result: ShareReportResult
  isPending: boolean
  onChooseAction: (action: UploadAction) => void
  onClose: () => void
}) {
  const conflict = result.outcome === "conflict"

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <div className="flex items-start gap-2">
        {result.outcome === "success" ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-green" />
        ) : (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {conflict ? "This report has already been uploaded" : "Part of the report was uploaded"}
          </p>
          <p className="text-sm text-muted-foreground">
            {result.message ??
              (conflict
                ? "Replacing it will overwrite the data already stored."
                : "Continue to upload the rows that have not been processed yet.")}
          </p>
        </div>
      </div>

      {result.processed !== undefined || result.failed !== undefined ? (
        <p className="text-sm text-muted-foreground">
          {result.processed ?? 0} processed, {result.failed ?? result.errors.length} failed
        </p>
      ) : null}

      {result.errors.length > 0 ? (
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
          {result.errors.map((message, index) => (
            <li key={index} className="break-words">
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {conflict ? (
          <Button
            variant="destructive"
            className="gap-2"
            disabled={isPending}
            onClick={() => onChooseAction("reupload")}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isPending ? "Replacing…" : "Replace existing"}
          </Button>
        ) : (
          <Button className="gap-2" disabled={isPending} onClick={() => onChooseAction("continue")}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isPending ? "Continuing…" : "Continue upload"}
          </Button>
        )}
        <Button variant="ghost" disabled={isPending} onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
