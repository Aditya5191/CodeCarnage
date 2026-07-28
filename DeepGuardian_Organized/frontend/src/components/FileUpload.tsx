"use client"

import { useCallback, useState } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface FileUploadProps {
  accept: string
  onFileSelect: (file: File) => void
  preview?: React.ReactNode
  onClear?: () => void
}

export default function FileUpload({ accept, onFileSelect, preview, onClear }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFileSelect(files[0])
      }
    },
    [onFileSelect]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  if (preview) {
    return (
      <Card className="relative p-4">
        <Button
          size="icon"
          variant="destructive"
          className="absolute right-4 top-4 z-10"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
        {preview}
      </Card>
    )
  }

  return (
    <Card
      className={`
        border-2 border-dashed p-12 text-center transition-colors
        ${isDragging ? "border-primary bg-primary/5" : "border-border"}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Drop your file here</h3>
      <p className="mt-2 text-sm text-muted-foreground">or click to browse</p>
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        id="file-input"
      />
      <Button asChild className="mt-6">
        <label htmlFor="file-input" className="cursor-pointer">
          Browse Files
        </label>
      </Button>
    </Card>
  )
}
