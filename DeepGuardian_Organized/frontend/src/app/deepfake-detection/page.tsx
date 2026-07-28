"use client"

import { useState } from "react"
import { Video, CheckCircle, AlertTriangle, Download, ExternalLink } from "lucide-react"
import AppLayout from "@/components/AppLayout"
import FileUpload from "@/components/FileUpload"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MetricProps {
  model: string
  label: string
  confidence: string
  reason?: string
}

interface VerificationResult {
  isAuthentic: boolean
  confidence: number
  metrics: MetricProps[]
}

interface VerificationResultsProps extends VerificationResult {
  onDownload: () => void
}

function VerificationResultsInternal({
  isAuthentic,
  confidence,
  metrics,
  onDownload,
}: VerificationResultsProps): JSX.Element {
  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {isAuthentic ? (
          <CheckCircle className="h-8 w-8 text-green-500" />
        ) : (
          <AlertTriangle className="h-8 w-8 text-red-500" />
        )}
        <div>
          <h3 className="text-xl font-bold">
            {isAuthentic ? "Authentic Content" : "Suspicious Content Detected"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Analysis completed with {confidence}% confidence
          </p>
        </div>
      </div>

      {/* Confidence */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Confidence Score</span>
          <span className="text-sm font-bold">{confidence}%</span>
        </div>
        <Progress value={confidence} className="h-2" />
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric, idx) => (
          <div key={idx} className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              {metric.model} - {metric.label}
            </p>
            <p className="mt-1 text-lg font-bold">{metric.confidence}</p>
            {metric.reason && (
              <p className="mt-1 text-xs text-muted-foreground">Reason: {metric.reason}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>
    </Card>
  )
}

export default function DeepfakeDetection(): JSX.Element {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [results, setResults] = useState<VerificationResult | null>(null)

  function handleFileSelect(selectedFile: File) {
    setFile(selectedFile)
    setResults(null)
    setPreview(URL.createObjectURL(selectedFile))
  }

  async function handleVerify() {
    if (!file) return
    setAnalyzing(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + 5
      })
    }, 300)

    try {
      const formData = new FormData()
      formData.append("video", file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video/`, {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      clearInterval(interval)
      setProgress(100)
      setAnalyzing(false)

      const overall = data.overall

      const metrics: MetricProps[] = Object.entries(overall.model_confidences).map(
        ([model, info]: [string, any]) => ({
          model,
          confidence: (info.confidence * 100).toFixed(2) + "%",
          label: info.label,
          reason: info.reason,
        })
      )

      const maxConfidence = Math.max(
        ...Object.values(overall.model_confidences).map((m: any) => m.confidence)
      ) * 100

      setResults({
        isAuthentic: overall.label === "real",
        confidence: parseFloat(maxConfidence.toFixed(2)),
        metrics,
      })
    } catch (err) {
      console.error("Video verification failed:", err)
      clearInterval(interval)
      setProgress(0)
      setAnalyzing(false)
      setResults({
        isAuthentic: false,
        confidence: 0,
        metrics: [{ model: "Error", label: "Failed", confidence: "0%", reason: "Could not connect to backend" }],
      })
    }
  }

  function handleClear() {
    setFile(null)
    setPreview(null)
    setResults(null)
    setProgress(0)
  }

  function handleDownload() {
    const report = {
      file: file?.name,
      timestamp: new Date().toISOString(),
      results,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `deepfake-detection-report-${Date.now()}.json`
    a.click()
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Deepfake Detection</h1>
          <p className="text-muted-foreground">
            Upload a video to detect deepfake content, face swaps, and AI-generated videos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Upload Video</h2>
              <FileUpload
                accept="video/*"
                onFileSelect={handleFileSelect}
                preview={
                  preview ? (
                    <div className="space-y-4">
                      <video
                        src={preview}
                        controls
                        className="w-full rounded-lg"
                        style={{ maxHeight: "400px" }}
                      />
                      <p className="text-sm text-muted-foreground">{file?.name}</p>
                    </div>
                  ) : undefined
                }
                onClear={handleClear}
              />

              {/* Verify / Loading */}
              {preview && !results && (
                <Button
                  className="mt-4 w-full"
                  onClick={handleVerify}
                  disabled={analyzing}
                >
                  {analyzing ? "Analyzing..." : "Detect Deepfake"}
                </Button>
              )}

              {analyzing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Analyzing video frames...</span>
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
                  <span>Face swap and replacement detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>Lip-sync inconsistencies and artifacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>Frame-by-frame consistency analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>AI-generated video detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>Facial expression authenticity</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Results Section */}
          <div>
            {results ? (
              <VerificationResultsInternal
                isAuthentic={results.isAuthentic}
                confidence={results.confidence}
                metrics={results.metrics}
                onDownload={handleDownload}
              />
            ) : (
              <Card className="flex h-full min-h-[400px] flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-muted p-6">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">No Results Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload a video and click detect to see analysis results here.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
