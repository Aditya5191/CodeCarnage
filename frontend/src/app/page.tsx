"use client"

import { BarChart3, Video, Mic, Image as ImageIcon, Shield, RefreshCw } from "lucide-react"
import StatCard from "@/components/StatCard"
import AppLayout from "@/components/AppLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const stats = [
    { title: "Total Analyses", value: 1248, trend: 12, icon: BarChart3, color: "#7C3AED" },
    { title: "Deepfake Analyses", value: 342, trend: 8, icon: Video, color: "#7C3AED" },
    { title: "Audio Analyses", value: 456, trend: -5, icon: Mic, color: "#3B82F6" },
    { title: "Image Analyses", value: 289, trend: 15, icon: ImageIcon, color: "#10B981" },
    { title: "Misinformation Analyses", value: 161, trend: 3, icon: Shield, color: "#F59E0B" },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your verification overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Deepfake Analyses */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Recent Deepfake Analyses</h3>
              </div>
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No analysis history yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start analyzing videos to see results here
              </p>
            </div>
            <Button variant="outline" className="w-full">
              View All Analyses
            </Button>
          </Card>

          {/* Recent Audio Analyses */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Recent Audio Analyses</h3>
              </div>
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4">
                <Mic className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No analysis history yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start analyzing audio to see results here
              </p>
            </div>
            <Button variant="outline" className="w-full">
              View All Analyses
            </Button>
          </Card>

          {/* Recent Image Analyses */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Recent Image Analyses</h3>
              </div>
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No analysis history yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start analyzing images to see results here
              </p>
            </div>
            <Button variant="outline" className="w-full">
              View All Analyses
            </Button>
          </Card>

          {/* Recent Misinformation Analyses */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Misinformation Checks</h3>
              </div>
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No analysis history yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start checking content to see results here
              </p>
            </div>
            <Button variant="outline" className="w-full">
              View All Checks
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}