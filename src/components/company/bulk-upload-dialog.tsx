import { useState } from "react"
import { AlertCircle, CheckCircle2, Download, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileDropZone } from "@/components/upload/file-drop-zone"
import { useBulkUploadCompanies, useDownloadBulkUploadTemplate } from "@/hooks/use-companies"
import { bulkUploadErrorList } from "@/api/companies"
import type { BulkUploadResult } from "@/api/companies"

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"]
const MAX_FILE_BYTES = 5 * 1024 * 1024

export function BulkUploadDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="size-4" />
          Bulk upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk upload companies</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet to create several company accounts at once. Start from the sample
            file so the columns match.
          </DialogDescription>
        </DialogHeader>

        <SampleDownloadButton />
        {/* Remounting on open clears the previous file and result. */}
        {open ? <UploadForm onClose={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function SampleDownloadButton() {
  const downloadSample = useDownloadBulkUploadTemplate()

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      disabled={downloadSample.isPending}
      onClick={() =>
        downloadSample.mutate(undefined, {
          onError: (error) => toast.error(error.message),
        })
      }
    >
      {downloadSample.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {downloadSample.isPending ? "Preparing sample…" : "Download sample file"}
    </Button>
  )
}

function UploadForm({ onClose }: { onClose: () => void }) {
  const upload = useBulkUploadCompanies()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkUploadResult | null>(null)
  const [errorRows, setErrorRows] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!file) {
      setError("Choose a file to upload.")
      return
    }

    setProgress(0)
    setErrorRows([])
    upload.mutate(
      { file, onProgress: setProgress },
      {
        onSuccess: (uploadResult) => {
          setResult(uploadResult)
          setError(null)
          setErrorRows([])
          // Stay open when rows failed, so the reasons can be read.
          if (!uploadResult.failed && uploadResult.errors?.length === 0) {
            toast.success(uploadResult.message ?? "Companies uploaded")
            onClose()
          }
        },
        onError: (mutationError) => {
          setResult(null)
          setError(mutationError.message)
          // A rejected upload carries the per-row reasons in its body.
          setErrorRows(bulkUploadErrorList(mutationError))
        },
      },
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FileDropZone
        file={file}
        onSelect={(next) => {
          setFile(next)
          setResult(null)
          setErrorRows([])
          setProgress(0)
        }}
        onProblem={setError}
        extensions={ACCEPTED_EXTENSIONS}
        maxBytes={MAX_FILE_BYTES}
        disabled={upload.isPending}
      />

      {upload.isPending ? (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {/* Once every byte is sent the server is still parsing rows,
                so the label stops claiming to measure anything. */}
            <span>{progress < 100 ? "Uploading…" : "Processing on the server…"}</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription className="space-y-2">
            <span>{error}</span>
            {errorRows.length > 0 ? (
              <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-4">
                {errorRows.map((row, index) => (
                  <li key={index} className="break-words">
                    {row}
                  </li>
                ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {result ? <UploadSummary result={result} /> : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {result ? "Close" : "Cancel"}
        </Button>
        <Button type="submit" className="gap-2" disabled={upload.isPending || !file}>
          {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {upload.isPending ? "Uploading…" : "Upload"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function UploadSummary({ result }: { result: BulkUploadResult }) {
  const errors = result.errors ?? []
  const clean = !result.failed && errors.length === 0

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start gap-2">
        {clean ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-green" />
        ) : (
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        )}
        <p className="text-sm font-medium">{result.message ?? "Upload processed"}</p>
      </div>

      {result.created !== undefined || result.failed !== undefined ? (
        <p className="text-sm text-muted-foreground">
          {result.created ?? 0} created, {result.failed ?? errors.length} failed
        </p>
      ) : null}

      {errors.length > 0 ? (
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
          {errors.map((message, index) => (
            <li key={index} className="break-words">
              {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
