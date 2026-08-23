"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"

import Image from "next/image"
import { Input } from "@/components/ui/input"

type ApiErrorBody = {
  ok: false
  error: { code: string; message: string; details?: { reason?: string } }
}

type SigninSuccessBody = {
  ok: true
  data: {
    userId?: string
    isAnonymous: boolean
    confirmationRequired?: boolean
    claimPending?: boolean
  }
}

export default function Signin({ trigger }: { trigger: React.ReactElement }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"email" | "password">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
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

  const enterAsGuest = async () => {
    try {
      await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "anonymous" }),
      })
    } finally {
      router.push("/dashboard")
    }
  }

  const submitEmailPassword = async () => {
    setSubmitting(true)
    setError(null)
    setInfo(null)
    try {
      const signinRes = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "email", email, password }),
      })

      if (signinRes.ok) {
        const body: SigninSuccessBody = await signinRes.json()

        // No session yet — signUp() only returns one when email
        // confirmation is off, and a claim never gets a new session at all.
        if (body.data.confirmationRequired || body.data.claimPending) {
          setInfo("Check your email to confirm your account, then sign in.")
          return
        }

        setOpen(false)
        router.push("/dashboard")
        return
      }

      const signinBody: ApiErrorBody = await signinRes.json()

      // Not a fresh signup or claim -> this is a returning user, try login.
      if (signinBody.error.details?.reason === "email_already_registered") {
        const loginRes = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        if (loginRes.ok) {
          setOpen(false)
          router.push("/dashboard")
          return
        }

        const loginBody: ApiErrorBody = await loginRes.json()
        setError(loginBody.error.message)
        return
      }

      setError(signinBody.error.message)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
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
              </motion.div>
            )}
          </AnimatePresence>
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

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={resetOnClose}>
        <form onSubmit={handleFormSubmit}>
          <DrawerTrigger render={trigger} />
          <DrawerContent className="w-full m-0 [--drawer-inset:0px] rounded-t-[24px] rounded-b-none !rounded-b-none border-none border-0 p-0 overflow-hidden flex flex-col items-center gap-3 pb-4">
            {formBody}
            <div className="flex flex-row items-center justify-between w-full px-[20px] gap-3 mt-[12px]">
              <button type="submit" disabled={submitting} className="w-fit text-[16px] font-pixel flex flex-row items-center justify-center bg-[#ececec] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] px-[30px] py-[10px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? "signing in..." : "sign in"}
              </button>
              <DrawerClose className="flex-1" render={
                <button type="button" onClick={enterAsGuest} className="w-full text-[16px] font-pixel flex flex-row items-center justify-center bg-[#f7f7f7] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] py-[10px] cursor-pointer whitespace-nowrap">
                    play without login
                </button>
              } />
            </div>
          </DrawerContent>
        </form>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={resetOnClose}>
      <form onSubmit={handleFormSubmit}>
        <DialogTrigger render={trigger} />
        <DialogContent className="w-[350px] p-0 overflow-hidden flex flex-col items-center justify-between gap-3" showCloseButton={false}>
          {formBody}

          <div className="flex flex-row items-center justify-center w-full px-[20px] pb-[20px] gap-x-[20px] mt-[8px] sm:flex-row sm:justify-center">
            <button type="submit" disabled={submitting} className="w-content text-[16px] font-pixel flex flex-row items-center justify-center bg-[#ececec] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] px-[30px] py-[10px] disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? "signing in..." : "sign in"}
            </button>
            <DialogClose render={
              <button type="button" onClick={enterAsGuest} className="w-auto text-[16px] font-pixel flex flex-row items-center justify-center bg-[#f7f7f7] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] py-[10px] px-[15px]">
                  play without login
              </button>
            } />
          </div>
        </DialogContent>
      </form>
    </Dialog>
  )
}
