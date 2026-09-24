import { useRef, useState } from "react"
import { FileSpreadsheet, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { checkFile, formatSize } from "@/lib/file-size"
import { cn } from "@/lib/utils"

/**
 * Drag-and-drop file picker. Validation lives here so every upload screen
 * rejects the same things the same way.
 */
export function FileDropZone({
  file,
  onSelect,
  onProblem,
  extensions,
  maxBytes,
  disabled,
}: {
  file: File | null
  onSelect: (file: File | null) => void
  onProblem: (message: string | null) => void
  extensions: string[]
  maxBytes: number
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function accept(candidate: File | undefined) {
    if (!candidate) return
    const problem = checkFile(candidate, extensions, maxBytes)
    onProblem(problem)
    onSelect(problem ? null : candidate)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        if (!disabled) accept(event.dataTransfer.files[0])
      }}
      className={cn(
        "rounded-lg border border-dashed p-6 text-center transition-colors",
        isDragging ? "border-primary bg-accent" : "border-border",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={extensions.join(",")}
        onChange={(event) => accept(event.target.files?.[0])}
      />

      {file ? (
        <div className="flex items-center gap-3 text-left">
          <FileSpreadsheet className="size-8 shrink-0 text-accent-green" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove file"
            disabled={disabled}
            onClick={() => {
              onSelect(null)
              onProblem(null)
              if (inputRef.current) inputRef.current.value = ""
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <>
          <Upload className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Drag a file here, or choose one</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {extensions.join(", ")} up to {formatSize(maxBytes)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
        </>
      )}
    </div>
  )
}
