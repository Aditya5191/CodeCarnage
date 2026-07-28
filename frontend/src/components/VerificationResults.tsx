"use client"

import { CheckCircle, AlertTriangle, Download, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface MetricProps {
  label: string
  value: string | number
  type?: "success" | "danger" | "warning" | "info"
}

interface VerificationResultsProps {
  isAuthentic: boolean
  confidence: number
  metrics: MetricProps[]
  sources?: string[]
  onDownload: () => void
}

export default function VerificationResults({
  isAuthentic,
  confidence,
  metrics,
  sources = [],
  onDownload,
}: VerificationResultsProps) {
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
        {metrics.map((metric, index) => (
          <div key={index} className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-lg font-bold">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Sources Full Width */}
      {sources.length > 0 && (
        <Card className="w-full border p-4">
          <h4 className="text-sm font-semibold mb-2">Sources:</h4>
          <ul className="list-disc list-inside space-y-1">
            {sources.map((src, idx) => (
              <li key={idx}>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 break-all"
                >
                  <ExternalLink className="h-4 w-4" />
                  {src}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
        <Button variant="outline">View Details</Button>
      </div>
    </Card>
  )
}
