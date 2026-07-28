"use client"

import { useState } from "react"
import { Shield, Link as LinkIcon, Type } from "lucide-react"
import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MetricProps {
  label: string
  value: string | string[]
}

interface VerificationResult {
  isAuthentic: boolean
  confidence: number
  metrics: MetricProps[]
}

export default function MisinformationDetector(): JSX.Element {
  const [inputType, setInputType] = useState<"text" | "url">("text")
  const [textInput, setTextInput] = useState<string>("")
  const [urlInput, setUrlInput] = useState<string>("")
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [results, setResults] = useState<VerificationResult | null>(null)

  const currentInput = inputType === "text" ? textInput : urlInput

  function handleClear() {
    setTextInput("")
    setUrlInput("")
    setResults(null)
    setProgress(0)
  }

  async function handleVerify() {
    if (!currentInput.trim()) return

    setAnalyzing(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 10))
    }, 250)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MISS_INFO_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      })

      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]

        // Format sources as clickable domains
        const formattedSources: string[] =
          result.sources?.map((src: string) => {
            try {
              const domain = new URL(src).hostname.replace("www.", "")
              return `<a href="${src}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${domain}</a>`
            } catch {
              return `<a href="${src}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${src}</a>`
            }
          }) || []

        setResults({
          isAuthentic: !result.verdict.toLowerCase().includes("misinformation"),
          confidence: result.confidence,
          metrics: [
            { label: "Verdict", value: result.verdict },
            { label: "Reasoning", value: result.reasoning },
            { label: "Sources", value: formattedSources },
          ],
        })
      } else {
        setResults({
          isAuthentic: true,
          confidence: 100,
          metrics: [{ label: "Verdict", value: "No issues detected" }],
        })
      }
    } catch (error) {
      console.error(error)
      setResults({
        isAuthentic: false,
        confidence: 0,
        metrics: [{ label: "Error", value: "Failed to fetch results" }],
      })
    } finally {
      clearInterval(interval)
      setProgress(100)
      setAnalyzing(false)
    }
  }

  function handleDownload() {
    const report = {
      input: currentInput,
      inputType,
      timestamp: new Date().toISOString(),
      results,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `misinformation-check-report-${Date.now()}.json`
    a.click()
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Misinformation Detector</h1>
          <p className="text-muted-foreground">
            Check text content or URLs for misinformation, fake news, and biased information.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Input Content</h2>

              <Tabs value={inputType} onValueChange={(v) => setInputType(v as "text" | "url")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">
                    <Type className="mr-2 h-4 w-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-4">
                  <Textarea
                    placeholder="Paste the text content you want to verify..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={12}
                    className="resize-none"
                  />
                </TabsContent>

                <TabsContent value="url" className="mt-4">
                  <div className="space-y-4">
                    <Input
                      placeholder="https://example.com/article"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      type="url"
                    />
                    {urlInput && (
                      <div className="rounded-lg border p-4">
                        <p className="mb-2 text-sm font-medium">URL Preview</p>
                        <div className="rounded bg-muted p-4 break-all">
                          <LinkIcon className="h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">{urlInput}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {currentInput && !results && (
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" onClick={handleVerify} disabled={analyzing}>
                    {analyzing ? "Checking..." : "Check Content"}
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              )}

              {analyzing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Analyzing content...</span>
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
                <li>• Cross-reference with fact-checking databases</li>
                <li>• Source credibility and authority assessment</li>
                <li>• Bias and sentiment analysis</li>
                <li>• Claim verification against trusted sources</li>
                <li>• Language patterns and manipulation detection</li>
              </ul>
            </Card>
          </div>

          {/* Results Section */}
          <div>
            {results ? (
              <Card className="p-6 space-y-4">
                <h3 className="text-xl font-bold mb-4">Results</h3>

                {/* ✅ Confidence Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Confidence Score</span>
                    <span className="font-semibold">{results.confidence}%</span>
                  </div>
                  <Progress value={results.confidence} className="h-2" />
                </div>

                {/* Metrics */}
                {results.metrics.map((m: any, i: number) => (
                  <div key={i} className="mb-3">
                    <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
                    {m.label === "Sources" ? (
                      <div
                        className="mt-1 text-sm space-x-2"
                        dangerouslySetInnerHTML={{
                          __html: (Array.isArray(m.value) ? m.value.join(", ") : m.value) || "",
                        }}
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold">{m.value}</p>
                    )}
                  </div>
                ))}

                <div className="pt-2">
                  <Button onClick={handleDownload}>Download Report</Button>
                </div>
              </Card>
            ) : (
              <Card className="flex h-full min-h-[400px] flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-muted p-6">
                  <Shield className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">No Results Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter content or a URL and click check to see analysis results here.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
