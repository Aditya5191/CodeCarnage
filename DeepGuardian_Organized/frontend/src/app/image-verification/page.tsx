"use client"

import { useState } from "react"
import { Image as ImageIcon, ZoomIn, ZoomOut } from "lucide-react"
import AppLayout from "@/components/AppLayout"
import FileUpload from "@/components/FileUpload"
import VerificationResults from "@/components/VerificationResults"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MetricProps {
  label: string
  value: string | number
}

interface VerificationResult {
  isAuthentic: boolean
  confidence: number
  metrics: MetricProps[]
}

export default function ImageVerification(): JSX.Element {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [results, setResults] = useState<VerificationResult | null>(null)
  const [zoom, setZoom] = useState<number>(1)

  function handleFileSelect(selectedFile: File) {
    setFile(selectedFile)
    setResults(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  async function handleVerify() {
    if (!file) return
    setAnalyzing(true)
    setProgress(0)

    const formData = new FormData()
    formData.append("image", file)

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 10 : prev))
    }, 300)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/image/`, {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!res.ok) throw new Error(`Server returned ${res.status}`)

      const data = await res.json()
      const { cnn, zeroshot } = data.image_models

      // Determine authenticity using only cnn and zeroshot labels
      const isAuthentic =
        cnn.label.toLowerCase() === "real" && zeroshot.label.toLowerCase() === "real"

      // Build metrics array
      const metrics: MetricProps[] = [
        { label: "CNN Label", value: cnn.label },
        { label: "CNN Confidence", value: `${(cnn.confidence * 100).toFixed(2)}%` },
        { label: "Zeroshot Label", value: zeroshot.label },
        { label: "Zeroshot Confidence", value: `${(zeroshot.confidence * 100).toFixed(2)}%` },
      ]

      // Add all zeroshot classification scores
      const scores = zeroshot.reason.classification_scores as Record<string, number>
      for (const [label, score] of Object.entries(scores)) {
        metrics.push({
          label,
          value: `${(score * 100).toFixed(2)}%`,
        })
      }

      setResults({
        isAuthentic,
        confidence: Math.round(((cnn.confidence + zeroshot.confidence) / 2) * 100),
        metrics,
      })
    } catch (error) {
      console.error("Upload error:", error)
      setResults({
        isAuthentic: false,
        confidence: 0,
        metrics: [{ label: "Error", value: "Failed to connect to backend" }],
      })
    } finally {
      clearInterval(progressInterval)
      setAnalyzing(false)
      setProgress(100)
    }
  }

  function handleClear() {
    setFile(null)
    setPreview(null)
    setResults(null)
    setProgress(0)
    setZoom(1)
  }

  function handleDownload() {
    const report = {
      file: file?.name,
      timestamp: new Date().toISOString(),
      results: results,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `image-verification-report-${Date.now()}.json`
    a.click()
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Image Verification</h1>
          <p className="text-muted-foreground">
            Upload an image to verify its authenticity and detect AI-generated or manipulated content.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Upload Image</h2>
              <FileUpload
                accept="image/*"
                onFileSelect={handleFileSelect}
                preview={
                  preview ? (
                    <div className="space-y-4">
                      <div className="relative overflow-hidden rounded-lg bg-muted">
                        <img
                          src={preview}
                          alt="Preview"
                          className="mx-auto max-h-[400px] object-contain transition-transform"
                          style={{ transform: `scale(${zoom})` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{file?.name}</p>
                      </div>
                    </div>
                  ) : undefined
                }
                onClear={handleClear}
              />

              {preview && !results && (
                <Button
                  className="mt-4 w-full"
                  onClick={handleVerify}
                  disabled={analyzing}
                >
                  {analyzing ? "Analyzing..." : "Verify Image"}
                </Button>
              )}

              {analyzing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Analyzing image...</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </Card>

            {/* Info Card */}
            <Card className="p-6">
              <h3 className="mb-3 font-semibold">What we check:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>AI-generated image detection using advanced neural networks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>Digital manipulation and editing artifacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>Metadata analysis for tampering signs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>Noise pattern analysis and inconsistencies</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Results Section */}
          <div>
            {results ? (
              <VerificationResults {...results} onDownload={handleDownload} />
            ) : (
              <Card className="flex h-full min-h-[400px] flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-muted p-6">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">No Results Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload an image and click verify to see analysis results here.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
