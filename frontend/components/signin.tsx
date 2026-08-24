"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"

import Image from "next/image"
import { Input } from "@/components/ui/input"
import { useSigninMutation, useLoginMutation } from "@/lib/queries/auth"
import { ApiError } from "@/lib/queries/api-error"

function isEmailAlreadyRegistered(err: unknown) {
  return (
    err instanceof ApiError &&
    (err.details as { reason?: string } | undefined)?.reason ===
      "email_already_registered"
  )
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback
}

export default function Signin({
  trigger,
  onSuccess,
}: {
  trigger: React.ReactElement
  // Called after a session is actually established (guest entry, login, or
  // signup with email confirmation off). Defaults to navigating to
  // /dashboard, the landing page's behavior. Lets a caller like the
  // letter-detective page instead just refresh its own state in place,
  // since router.push to the same route it's already on wouldn't remount
  // it. Never called for the "check your email" branch — there is no
  // session yet in that case.
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"email" | "password">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const signinMutation = useSigninMutation()
  const loginMutation = useLoginMutation()
  const submitting = signinMutation.isPending || loginMutation.isPending
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.matchMedia("(max-width: 639px)").matches
  })

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)")
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  const handleAuthSuccess = () => {
    setOpen(false)
    if (onSuccess) {
      onSuccess()
    } else {
      router.push("/dashboard")
    }
  }

  const enterAsGuest = async () => {
    setError(null)
    try {
      await signinMutation.mutateAsync({ mode: "anonymous" })
      handleAuthSuccess()
    } catch (err) {
      setError(errorMessage(err, "Could not connect. Please check your connection."))
    }
  }

  const submitEmailPassword = async () => {
    setError(null)
    setInfo(null)
    try {
      const result = await signinMutation.mutateAsync({
        mode: "email",
        email,
        password,
      })

      // No session yet — signUp() only returns one when email
      // confirmation is off, and a claim never gets a new session at all.
      if (result.confirmationRequired || result.claimPending) {
        setInfo("Check your email to confirm your account, then sign in.")
        return
      }

      handleAuthSuccess()
    } catch (err) {
      // Not a fresh signup or claim -> this is a returning user, try login.
      if (isEmailAlreadyRegistered(err)) {
        try {
          await loginMutation.mutateAsync({ email, password })
          handleAuthSuccess()
        } catch (loginErr) {
          setError(errorMessage(loginErr, "Something went wrong. Please try again."))
        }
        return
      }

      setError(errorMessage(err, "Something went wrong. Please try again."))
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === "email") {
      if (email.trim()) {
        setError(null)
        setStep("password")
      }
    } else {
      submitEmailPassword()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (step === "email") {
        e.preventDefault()
        if (email.trim()) {
          setStep("password")
        }
      }
    }
  }

  const formBody = (
    <div className="flex flex-col items-center justify-start w-full">
      <Image
        src="/signin_image.png"
        alt="signin image"
        loading="eager"
        width={350}
        height={100}
        className="w-full object-cover"
      />
      <div className="flex flex-col items-start justify-center w-full px-[20px] mt-[15px]">
        <span className="text-[30px] font-pixel">Sign In</span>
        <span className="text-[16px] text-[#5e5e5e] leading-[20px] mt-[5px] font-pixel">
          Dyslexia can affect reading, spelling, ancold language processing. Play a few quick games to explore how you learn.
        </span>
        
        <div className="w-full mt-[15px]">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email-input"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="w-full"
              >
                <label htmlFor="email" className="text-[16px] hidden">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="john@example.com"
                  className="font-pixel h-[40px] w-full rounded-[13px] !text-[16px] px-[20px] !placeholder:text-[16px] !placeholder:text-[#aeaeae] !leading-0 !placeholder:leading-0 bg-white border-[1px] border-[#e0e0e0] focus:border-[#949494] focus:ring-0 focus-visible:ring-0 focus-visible:outline-none !ring-0 !outline-none !px-[15px] items-center justify-center"
                  required
                />
              </motion.div>
            ) : (
              <motion.div
                key="password-input"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="w-full flex flex-col items-start"
              >
                <label htmlFor="password" className="text-[16px] hidden">Password</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="font-pixel h-[40px] w-full rounded-[13px] !text-[16px] !px-[15px] !placeholder:text-[16px] !placeholder:text-[#aeaeae] !leading-0 !placeholder:leading-0 bg-white border-[1px] border-[#e0e0e0] focus:border-[#949494] focus:ring-0 focus-visible:ring-0 focus-visible:outline-none !ring-0 !outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setInfo(null)
                    setStep("email")
                  }}
                  className="text-[12px] text-[#5e5e5e] hover:underline mt-[10px] font-pixel cursor-pointer px-[10px]"
                >
                  ← back to email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {error ? (
            <p role="alert" className="text-[13px] text-red-600 mt-[10px] font-pixel px-[10px]">
              {error}
            </p>
          ) : null}
          {info ? (
            <p role="status" className="text-[13px] text-[#1d1d1d] mt-[10px] font-pixel px-[10px]">
              {info}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )

  const resetOnClose = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setStep("email")
      setError(null)
      setInfo(null)
      setPassword("")
    }
  }

  // DialogContent/DrawerContent render through a portal (see
  // components/ui/dialog.tsx / drawer.tsx), so their children end up in a
  // different DOM subtree than anything outside them. A <form> only fires a
  // native submit event for a type="submit" button that shares a real DOM
  // ancestor, so the form must live inside the portaled content, not
  // wrapping it. `className="contents"` keeps it invisible to layout.
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={resetOnClose}>
        <DrawerTrigger render={trigger} />
        <DrawerContent className="w-full m-0 [--drawer-inset:0px] rounded-t-[24px] rounded-b-none !rounded-b-none border-none border-0 p-0 overflow-hidden flex flex-col items-center gap-3 pb-4">
          <form onSubmit={handleFormSubmit} className="contents">
            {formBody}
            <div className="flex flex-row items-center justify-between w-full px-[20px] gap-3 mt-[12px]">
              <button type="submit" disabled={submitting} className="w-fit text-[16px] font-pixel flex flex-row items-center justify-center bg-[#ececec] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] px-[30px] py-[10px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? "signing in..." : "sign in"}
              </button>
              <button type="button" onClick={enterAsGuest} className="flex-1 w-full text-[16px] font-pixel flex flex-row items-center justify-center bg-[#f7f7f7] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] py-[10px] cursor-pointer whitespace-nowrap">
                  play without login
              </button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={resetOnClose}>
      <DialogTrigger render={trigger} />
      <DialogContent className="w-[350px] p-0 overflow-hidden flex flex-col items-center justify-between gap-3" showCloseButton={false}>
        <form onSubmit={handleFormSubmit} className="contents">
          {formBody}

          <div className="flex flex-row items-center justify-center w-full px-[20px] pb-[20px] gap-x-[20px] mt-[8px] sm:flex-row sm:justify-center">
            <button type="submit" disabled={submitting} className="w-content text-[16px] font-pixel flex flex-row items-center justify-center bg-[#ececec] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] px-[30px] py-[10px] disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? "signing in..." : "sign in"}
            </button>
            <button type="button" onClick={enterAsGuest} className="w-auto text-[16px] font-pixel flex flex-row items-center justify-center bg-[#f7f7f7] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] py-[10px] px-[15px]">
                play without login
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
