"use client"

import { useState, useRef } from "react"
import { Mic, Play, Pause } from "lucide-react"
import AppLayout from "@/components/AppLayout"
import FileUpload from "@/components/FileUpload"
import VerificationResults from "@/components/VerificationResults"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"

interface MetricProps {
  label: string
  value: string
}

interface VerificationResult {
  isAuthentic: boolean
  confidence: number
  metrics: MetricProps[]
}

export default function AudioVerification(): JSX.Element {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [results, setResults] = useState<VerificationResult | null>(null)
  const [playing, setPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  function handleFileSelect(selectedFile: File) {
    setFile(selectedFile)
    setResults(null)
    const url = URL.createObjectURL(selectedFile)
    setPreview(url)
    setPlaying(false)
    setCurrentTime(0)
  }

  function togglePlay() {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setPlaying(!playing)
    }
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  function handleLoadedMetadata() {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  function handleSeek(value: number[]) {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  async function handleVerify() {
    if (!file) return
    setAnalyzing(true)
    setProgress(0)

    const formData = new FormData()
    formData.append("audio", file)

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 10 : prev))
    }, 300)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audio/`, {
        method: "POST",
        body: formData,
      })
      clearInterval(interval)
      setProgress(100)

      if (!res.ok) throw new Error(`Server returned ${res.status}`)

      const data = await res.json()

      // Build metrics dynamically
      const metrics: MetricProps[] = [
        { label: "Label", value: data.label },
        { label: "Confidence", value: `${(data.confidence * 100).toFixed(2)}%` },
        { label: "Reason", value: data.reason },
      ]

      setResults({
        isAuthentic: data.label.toLowerCase() === "real",
        confidence: Math.round(data.confidence * 100),
        metrics,
      })
    } catch (error) {
      console.error("Audio verification error:", error)
      setResults({
        isAuthentic: false,
        confidence: 0,
        metrics: [{ label: "Error", value: "Failed to connect to backend" }],
      })
    } finally {
      clearInterval(interval)
      setAnalyzing(false)
      setProgress(100)
    }
  }

  function handleClear() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setFile(null)
    setPreview(null)
    setResults(null)
    setProgress(0)
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }

  function handleDownload() {
    const report = {
      file: file?.name,
      timestamp: new Date().toISOString(),
      results: results,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audio-verification-report-${Date.now()}.json`
    a.click()
  }

  function formatTime(time: number): string {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Audio Verification</h1>
          <p className="text-muted-foreground">
            Upload an audio file to detect voice cloning, deepfake audio, and AI-generated speech.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Upload Audio</h2>
              <FileUpload
                accept="audio/*"
                onFileSelect={handleFileSelect}
                preview={
                  preview ? (
                    <div className="space-y-4">
                      <audio
                        ref={audioRef}
                        src={preview}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setPlaying(false)}
                        className="hidden"
                      />

                      <div className="rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-8">
                        <div className="flex items-center justify-center gap-1">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full bg-blue-500 transition-all"
                              style={{
                                height: `${Math.random() * 60 + 20}px`,
                                opacity: playing ? 1 : 0.5,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Audio Controls */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={togglePlay}
                            className="shrink-0"
                          >
                            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <div className="flex-1">
                            <Slider
                              value={[currentTime]}
                              max={duration || 100}
                              step={0.1}
                              onValueChange={handleSeek}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{formatTime(currentTime)}</span>
                          <span>{file?.name}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>
                  ) : undefined
                }
                onClear={handleClear}
              />

              {preview && !results && (
                <Button className="mt-4 w-full" onClick={handleVerify} disabled={analyzing}>
                  {analyzing ? "Analyzing..." : "Verify Audio"}
                </Button>
              )}

              {analyzing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Analyzing audio...</span>
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
                  <span>Voice cloning and deepfake detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>AI-generated speech patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>Audio splicing and editing artifacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-primary">•</span>
                  <span>Frequency and spectral analysis</span>
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
                  <Mic className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">No Results Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload an audio file and click verify to see analysis results here.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
