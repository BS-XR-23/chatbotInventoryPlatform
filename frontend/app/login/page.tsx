"use client"

import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-4">
        {isLogin ? <LoginForm /> : <RegisterForm />}
        <div className="text-center">
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </Button>
        </div>
      </div>
    </div>
  )
}
