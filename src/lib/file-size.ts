export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Returns a problem to show, or null when the file is acceptable. */
export function checkFile(file: File, extensions: string[], maxBytes: number) {
  const name = file.name.toLowerCase()
  if (!extensions.some((extension) => name.endsWith(extension))) {
    return `Choose a ${extensions.join(", ")} file.`
  }
  if (file.size > maxBytes) {
    return `That file is ${formatSize(file.size)}. The limit is ${formatSize(maxBytes)}.`
  }
  if (file.size === 0) return "That file is empty."
  return null
}

