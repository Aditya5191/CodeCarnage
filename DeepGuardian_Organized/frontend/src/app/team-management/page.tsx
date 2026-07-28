"use client"

import { useState } from "react"
import { Users, Plus, Trash2, Clock } from "lucide-react"
import AppLayout from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "Admin" | "Analyst"
  avatar: string
  lastActivity: string
}

interface Activity {
  id: string
  user: string
  action: string
  timestamp: string
}

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@Parallax.com",
      role: "Admin",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      lastActivity: "2 hours ago",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@Parallax.com",
      role: "Analyst",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      lastActivity: "5 hours ago",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike.johnson@Parallax.com",
      role: "Analyst",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      lastActivity: "1 day ago",
    },
  ])

  const [activities, setActivities] = useState<Activity[]>([
    { id: "1", user: "John Doe", action: "Verified 3 images", timestamp: "2 hours ago" },
    { id: "2", user: "Jane Smith", action: "Detected deepfake in video", timestamp: "5 hours ago" },
    { id: "3", user: "Mike Johnson", action: "Analyzed audio file", timestamp: "1 day ago" },
    { id: "4", user: "John Doe", action: "Added new team member", timestamp: "2 days ago" },
    { id: "5", user: "Jane Smith", action: "Checked misinformation content", timestamp: "3 days ago" },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "Analyst" as "Admin" | "Analyst",
  })

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) return

    const member: TeamMember = {
      id: Date.now().toString(),
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMember.name}`,
      lastActivity: "Just now",
    }

    setMembers([...members, member])
    setActivities([
      {
        id: Date.now().toString(),
        user: "John Doe",
        action: `Added ${newMember.name} to the team`,
        timestamp: "Just now",
      },
      ...activities,
    ])

    setNewMember({ name: "", email: "", role: "Analyst" })
    setIsDialogOpen(false)
  }

  const handleRemoveMember = (id: string) => {
    const member = members.find((m) => m.id === id)
    if (member) {
      setMembers(members.filter((m) => m.id !== id))
      setActivities([
        {
          id: Date.now().toString(),
          user: "John Doe",
          action: `Removed ${member.name} from the team`,
          timestamp: "Just now",
        },
        ...activities,
      ])
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">
              Manage team members, assign roles, and track activity.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Add a new member to your Parallax team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newMember.role}
                    onValueChange={(value: "Admin" | "Analyst") =>
                      setNewMember({ ...newMember, role: value })
                    }
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Analyst">Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember}>Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Team Members Table */}
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Team Members</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === "Admin" ? "default" : "secondary"}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.lastActivity}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={member.id === "1"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Role Information */}
            <Card className="mt-6 p-6">
              <h3 className="mb-3 font-semibold">Role Permissions</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">Administrator</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Full access to all modules</li>
                    <li>• Manage team members</li>
                    <li>• Assign roles and permissions</li>
                    <li>• View all activity logs</li>
                  </ul>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">Analyst</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Access to all verification modules</li>
                    <li>• Run analyses and verifications</li>
                    <li>• Download reports</li>
                    <li>• View own activity history</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Log */}
          <div>
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Activity Log</h2>
              </div>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full">
                View All Activity
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
