"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import Image from "next/image"
import { Input } from "@/components/ui/input"

export default function Signin({ trigger }: { trigger: React.ReactElement }) {
  const [step, setStep] = useState<"email" | "password">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === "email") {
      if (email.trim()) {
        setStep("password")
      }
    } else {
      console.log("Signing in with:", { email, password })
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

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) {
        setStep("email")
      }
    }}>
      <form onSubmit={handleFormSubmit}>
        <DialogTrigger render={trigger} />
        <DialogContent className="w-[350px] p-0 overflow-hidden flex flex-col items-center gap-3" showCloseButton={false}>
          <div className="flex flex-col items-center justify-start w-full">
            <Image
                src="/signin_image.png"
                alt="signin image"
                loading="eager"
                width={350}
                height={100}
                className="w-full object-cover"
                />
            <div className="flex flex-col items-start justify-center w-full px-[20px] mt-[15px]" >
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
                          className="font-pixel h-[40px] w-full rounded-[13px] !text-[16px] px-[20px] !placeholder:text-[16px] !placeholder:text-[#aeaeae] !leading-0 !placeholder:leading-0 bg-white border-[1px] border-[#e0e0e0] focus:border-[#949494] focus:ring-[2px] focus:ring-[#aaa9a9] !px-[15px] items-center justify-center"
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
                          className="font-pixel h-[40px] w-full rounded-[13px] !text-[16px] !px-[15px] !placeholder:text-[16px] !placeholder:text-[#aeaeae] !leading-0 !placeholder:leading-0 bg-white border-[1px] border-[#e0e0e0] focus:border-[#949494] focus:ring-[2px] focus:ring-[#aaa9a9]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setStep("email")}
                          className="text-[12px] text-[#5e5e5e] hover:underline mt-[10px] font-pixel cursor-pointer px-[10px]"
                        >
                          ← back to email
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-row items-center justify-center w-full px-[20px] pb-[20px] gap-[20px] mt-[10px] sm:flex-row sm:justify-center">
            <button type="submit" className="text-[18px] font-pixel flex flex-row items-center justify-center w-auto bg-[#ececec] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] px-[17px] py-[8px]">
                sign in 
            </button>
            <DialogClose render={
              <button type="button" className="text-[18px] font-pixel flex flex-row items-center justify-center w-auto bg-[#f7f7f7] hover:bg-[#eaeaea] hover:translate-y-[-2px] transition-all duration-200 rounded-[15px] px-[17px] py-[8px]">
                  play without login
              </button>
            } />
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
