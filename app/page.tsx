"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!isLogin) {
      if (!formData.username) newErrors.username = "Username is required"
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  // Placeholder: Replace with your backend API endpoints
  const LOGIN_API_URL = "http://localhost:8080/api/auth/login"
  const SIGNUP_API_URL = "http://localhost:8080/api/auth/register"

  // Async function to call login API
  const loginUser = async (email: string, password: string) => {
    try {
      setLoading(true)
      setApiError("")
      const res = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Login failed")
      }
      // On success, save token and redirect to home page
      const data = await res.json()
      if (data && data.accessToken && data.refreshToken) {
        localStorage.setItem("authToken", data.accessToken)
        localStorage.setItem("refreshToken", data.refreshToken)
      }
      window.location.href = "/home"
    } catch (err: any) {
      setApiError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  // Async function to call signup API
  const signupUser = async (payload: typeof formData) => {
    try {
      setLoading(true)
      setApiError("")
      const res = await fetch(SIGNUP_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          userName: payload.username
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Signup failed")
      }
      // On success, redirect to login page
      setIsLogin(true)
    } catch (err: any) {
      setApiError(err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    if (isLogin) {
      await loginUser(formData.email, formData.password)
    } else {
      await signupUser(formData)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FinTech Pro</h1>
          <p className="text-gray-600">Secure financial management platform</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              {isLogin ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Sign in to your account to continue"
                : "Join thousands of users managing their finances securely"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              type="button"
              onClick={async () => {
                setLoading(true)
                setApiError("")
                try {
                  // Open OAuth2 login in a new window
                  const oauthUrl = "http://localhost:8080/oauth2/authorization/google"
                  const width = 500
                  const height = 600
                  const left = window.screenX + (window.outerWidth - width) / 2
                  const top = window.screenY + (window.outerHeight - height) / 2
                  const win = window.open(
                    oauthUrl,
                    "GoogleOAuth2Login",
                    `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars=yes`
                  )
                  if (!win) throw new Error("Popup blocked. Please allow popups and try again.")

                  // Poll for login completion (cookie/session-based)
                  const poll = setInterval(() => {
                    try {
                      if (win.closed) {
                        clearInterval(poll)
                        setLoading(false)
                        setApiError("Login window closed before authentication.")
                        return
                      }
                      // Check if authenticated (e.g., backend sets a session/cookie)
                      // You may want to call a /me or /profile endpoint here
                      fetch("http://localhost:8080/api/auth/me", { credentials: "include" })
                        .then((res) => {
                          if (res.ok) {
                            clearInterval(poll)
                            win.close()
                            window.location.href = "/home"
                          }
                        })
                        .catch(() => {})
                    } catch {}
                  }, 1000)
                } catch (err: any) {
                  setApiError(err.message || "Google login failed")
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "Redirecting..." : "Continue with Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                <div className="text-sm text-red-600 text-center font-medium">{apiError}</div>
              )}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="username"
                      placeholder="JohnDoe"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className={errors.username ? "border-red-500" : ""}
                    />
                    {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? (isLogin ? "Signing in..." : "Creating account...") : (isLogin ? "Sign in" : "Create account")}
              </Button>
            </form>

            {isLogin && (
              <div className="text-center">
                <Link href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot your password?
                </Link>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <div className="text-center w-full">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Protected by industry-standard encryption</p>
          <p className="mt-1">© 2024 FinTech Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
