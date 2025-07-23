"use client"

import type React from "react"

import { use, useState } from "react"
import Link from "next/link"
import { Bell, User, BarChart3, LogOut, Check, X, Trash2, Clock, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

interface DynamicFormField {
  name: string
  label: string
  type: string
  required: boolean
}

interface NotificationRequest {
  id: string
  sender: string
  senderLogo: string
  description: string
  organization: string
  purpose: string
  timestamp: string
  usecase: string
  email: string
  status: string
  type: string
  dynamicFields: DynamicFormField[]
  requestId: string
  // Optionally, add more fields if needed
}

// API endpoint for notifications
const NOTIFICATIONS_API_URL = "http://localhost:8081/thirdparty/all/pending"

import { useEffect, useCallback } from "react"

export default function HomePage() {
  const [requests, setRequests] = useState<NotificationRequest[]>([])
  const [showConsentForm, setShowConsentForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<NotificationRequest | null>(null)
  const [showDynamicForm, setShowDynamicForm] = useState(false)
  const [dynamicFormValues, setDynamicFormValues] = useState<{ [key: string]: string }>({})
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState("")
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true)
    setNotificationError("")
    try {
      const token = localStorage.getItem("authToken") || ""
      const refreshToken = localStorage.getItem("refreshToken") || ""
      const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
      if (refreshToken) headers["Authorization-Refresh"] = `Bearer ${refreshToken}`;
      const res = await fetch(NOTIFICATIONS_API_URL, {
        credentials: "include",
        headers,
      })
      // Handle new access token if present
      const newAccessToken = res.headers.get("X-New-Access-Token")
      if (newAccessToken) {
        localStorage.setItem("authToken", newAccessToken)
      }
      if (!res.ok) throw new Error("Failed to fetch notifications")
      const data = await res.json()
      const mapped = (Array.isArray(data) ? data : []).map((item: any) => {
        return {
          id: item.requestId || "",
          requestId: item.requestId || "",
          sender: item.thirdPartyName || "Unknown",
          organization: item.organization || "Unknown",
          senderLogo: "/placeholder.svg?height=40&width=40", // Or use item.logo if available
          description: item.description ||  "",
          purpose: item.purpose || "",
          type: item.useCase || item.usecase || "data",
          email: item.email || "",
          usecase: item.useCase || item.usecase || "",
          timestamp: item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
          status : item.status || "pending",
          dynamicFields: Array.isArray(item.dynamicFields)
            ? item.dynamicFields.map((f: any) => ({
                name: f.key,
                label: f.value,
                type: f.type || "text",
                required: !!f.required
              }))
            : [],
        }
      })
      setRequests(mapped)
    } catch (err: any) {
      setNotificationError(err.message || "Failed to fetch notifications")
    } finally {
      setLoadingNotifications(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const pendingCount = requests.filter((req) => req.status === "PENDING" || req.status === "pending").length // je krna hai


  const handleAccept = (request: NotificationRequest) => {
    setSelectedRequest(request)
    setShowConsentForm(true)
    setShowDetailsModal(false)
  }

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken") || ""
      const refreshToken = localStorage.getItem("refreshToken") || ""
      const req = requests.find((r) => r.id === id)
      if (!req) throw new Error("Request not found")
      const dto = {
        status: "REJECTED"
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      if (refreshToken) headers["Authorization-Refresh"] = `Bearer ${refreshToken}`;
      const res = await fetch(`http://localhost:8081/consent/respond/${id}`, {
        method: "POST",
        headers,
        body: JSON.stringify(dto),
      })
      const newAccessToken = res.headers.get("X-New-Access-Token")
      if (newAccessToken) {
        localStorage.setItem("authToken", newAccessToken)
      }
      if (!res.ok) throw new Error("Failed to reject consent")
      setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: "rejected" as const } : req)))
      setShowDetailsModal(false)
    } catch (err) {
      alert("Failed to reject consent")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken") || ""
      const refreshToken = localStorage.getItem("refreshToken") || ""
      const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
      if (refreshToken) headers["Authorization-Refresh"] = `Bearer ${refreshToken}`;
      const res = await fetch(`http://localhost:8081/api/notifications/${id}`, {
        method: "DELETE",
        headers,
      })
      const newAccessToken = res.headers.get("X-New-Access-Token")
      if (newAccessToken) {
        localStorage.setItem("authToken", newAccessToken)
      }
      if (!res.ok) throw new Error("Failed to delete notification")
      setRequests((prev) => prev.filter((req) => req.id !== id))
    } catch (err) {
      alert("Failed to delete notification")
    }
  }

  const handleConsentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRequest) {
      try {
        const token = localStorage.getItem("authToken") || ""
        const refreshToken = localStorage.getItem("refreshToken") || ""
        const dto = {
          status: "APPROVED"
        }
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };
        if (refreshToken) headers["Authorization-Refresh"] = `Bearer ${refreshToken}`;
        const res = await fetch(`http://localhost:8081/consent/respond/${selectedRequest.id}`, {
          method: "POST",
          headers,
          body: JSON.stringify(dto),
        })
        const newAccessToken = res.headers.get("X-New-Access-Token")
        if (newAccessToken) {
          localStorage.setItem("authToken", newAccessToken)
        }
        if (!res.ok) throw new Error("Failed to submit consent")
        setRequests((prev) =>
          prev.map((req) => (req.id === selectedRequest.id ? { ...req, status: "accepted" as const } : req)),
        )
        setShowConsentForm(false)
        // Show dynamic form after consent is accepted
        setShowDynamicForm(true)
        // Initialize dynamic form values
        const initialVals: { [key: string]: string } = {}
        selectedRequest.dynamicFields?.forEach(f => { initialVals[f.name] = "" })
        setDynamicFormValues(initialVals)
      } catch (err) {
        alert("Failed to submit consent")
      }
    }
  }

  const handleDynamicFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDynamicFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleDynamicFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRequest) {
      try {
        const token = localStorage.getItem("authToken") || ""
        const refreshToken = localStorage.getItem("refreshToken") || ""
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };
        if (refreshToken) headers["Authorization-Refresh"] = `Bearer ${refreshToken}`;
        const res = await fetch(`http://localhost:8081/form/submit/${selectedRequest.requestId}`, {
          method: "POST",
          headers,
          body: JSON.stringify(dynamicFormValues),
        })
        const newAccessToken = res.headers.get("X-New-Access-Token")
        if (newAccessToken) {
          localStorage.setItem("authToken", newAccessToken)
        }
        if (!res.ok) throw new Error("Failed to submit form data")
        setShowDynamicForm(false)
        setSelectedRequest(null)
        setDynamicFormValues({})
        alert("Form data submitted successfully!")
      } catch (err) {
        alert("Failed to submit form data")
      }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment_auth":
        return "💳"
      case "account_access":
        return "🔐"
      default:
        return "📄"
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "payment_auth":
        return <Badge variant="destructive">Payment</Badge>
      case "account_access":
        return <Badge variant="secondary">Access</Badge>
      default:
        return <Badge variant="default">Data</Badge>
    }
  }

  // Handler to open details modal
  const handleOpenDetails = (request: NotificationRequest) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

  // Handler to close details modal
  const handleCloseDetails = () => {
    setShowDetailsModal(false)
    setSelectedRequest(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FinTrust</h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/home" className="text-blue-600 font-medium">
                Home
              </Link>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center">
                <BarChart3 className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative"
                    onClick={fetchNotifications}
                  >
                    <Bell className="h-5 w-5" />
                    {pendingCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {pendingCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Notifications</SheetTitle>
                    <SheetDescription>Third-party requests requiring your attention</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {loadingNotifications ? (
                      <p className="text-center text-gray-500 py-8">Loading...</p>
                    ) : notificationError ? (
                      <p className="text-center text-red-500 py-8">{notificationError}</p>
                    ) : requests.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No notifications</p>
                    ) : (
                      requests.map((request) => (
                        <Card key={request.id} className="relative cursor-pointer" onClick={() => handleOpenDetails(request)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={request.senderLogo || "/placeholder.svg"} alt={request.sender} />
                                  <AvatarFallback>
                                    <Building2 className="h-5 w-5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-sm font-medium">{request.sender}</CardTitle>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {getTypeBadge(request.type)}
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {request.timestamp}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleDelete(request.id) }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-gray-600 mb-4">
                              {getTypeIcon(request.type)} {request.description}
                            </p>
                            {request.status === "pending" && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleAccept(request) }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); handleReject(request.id) }}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {request.status === "accepted" && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                ✓ Accepted
                              </Badge>
                            )}
                            {request.status === "rejected" && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                ✗ Rejected
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>
                <span className="font-semibold">{selectedRequest.sender}</span> is requesting access to your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <span className="font-semibold">Organization:</span> {selectedRequest.organization}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Purpose:</span> {selectedRequest.purpose}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Use Case:</span> {selectedRequest.usecase}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Description:</span> {selectedRequest.description}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Requested At:</span> {selectedRequest.timestamp}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Status:</span> {selectedRequest.status}
              </div>
              {selectedRequest.dynamicFields && selectedRequest.dynamicFields.length > 0 && (
                <div className="mb-2">
                  <span className="font-semibold">Dynamic Fields:</span>
                  <ul className="list-disc ml-6">
                    {selectedRequest.dynamicFields.map((field) => (
                      <li key={field.name}>
                        <span className="font-medium">{field.name}</span> - {field.type}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex space-x-2 mt-4">
                {selectedRequest.status === "pending" && (
                  <>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleAccept(selectedRequest)}>
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button className="flex-1 border-red-200 text-red-600 hover:bg-red-50" variant="outline" onClick={() => handleReject(selectedRequest.id)}>
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </>
                )}
                <Button className="flex-1" variant="outline" onClick={handleCloseDetails}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Devansh Garg</p>
                      <p className="text-xs leading-none text-muted-foreground">gargdevansh728@gmail.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Devansh!</h2>
          <p className="text-gray-600">Manage your financial data and third-party requests securely.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Requiring your attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Services</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Active integrations</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and navigation shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start h-auto p-4 bg-transparent">
                  <BarChart3 className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">View Dashboard</div>
                    <div className="text-sm text-gray-500">See detailed analytics and reports</div>
                  </div>
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start h-auto p-4 bg-transparent">
                <User className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Manage Profile</div>
                  <div className="text-sm text-gray-500">Update your account settings</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Consent Form Modal */}
      {showConsentForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Data Consent Form</CardTitle>
              <CardDescription>
                {selectedRequest.sender} is requesting access to your data. Please provide the required information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConsentSubmit} className="space-y-4">
                <Separator />
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    Submit & Approve
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowConsentForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dynamic Form Modal */}
      {showDynamicForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Fill Required Data</CardTitle>
              <CardDescription>
                Please fill the required fields for {selectedRequest.sender}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDynamicFormSubmit} className="space-y-4">
                {selectedRequest.dynamicFields?.map((field) => (
                  <div className="space-y-2" key={field.name}>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={dynamicFormValues[field.name] || ""}
                        onChange={handleDynamicFormChange}
                        required={field.required}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type || "text"}
                        value={dynamicFormValues[field.name] || ""}
                        onChange={handleDynamicFormChange}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
                <Separator />
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    Submit
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowDynamicForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
