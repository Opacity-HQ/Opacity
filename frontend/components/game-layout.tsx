"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Blobatar } from "@blobatar/react";
import { surprised } from "blobatar/expression";
import {
  ChevronDown,
  Check,
  LayoutDashboard,
  User,
  BarChart2,
  LogOut,
} from "lucide-react";

interface GameLayoutProps {
  title: string;
  username?: string;
  children: React.ReactNode;
}

const GAMES = [
  { label: "letter detective", href: "/letter-detective", icon: "/letter.svg" },
  { label: "memory quest", href: "/memory-quest", icon: "/memory.svg" },
  { label: "rapid match", href: "/rapid-match", icon: "/rapid.svg" },
  { label: "sound match", href: "/sound-match", icon: "/sound.svg" },
  { label: "word builder", href: "/word-builder", icon: "/block.svg" },
];

export default function GameLayout({
  title,
  username = "guest",
  children,
}: GameLayoutProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="flex flex-col items-center w-full max-w-5xl min-h-screen border-x-0 sm:border-x-2 border-[#efefef]">
        <div className="flex flex-row items-center justify-between w-full px-4 sm:px-5 py-3 border-b-2 border-[#efefef]">
          <div className="flex flex-row items-center justify-start min-w-0 pr-2">
            <Link
              href="/"
              className="flex flex-row items-center cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            >
              <Image
                src="/logo.svg"
                alt="Opacity Logo"
                width={20}
                height={20}
                loading="eager"
                className="shrink-0"
              />
              <span className="font-pixel text-[16px] sm:text-[20px] ml-2 text-[#1d1d1d]">
                opacity
              </span>
            </Link>
            <span className="font-pixel text-[16px] sm:text-[20px] ml-1 text-[#1d1d1d] shrink-0">
              /
            </span>
            <div className="relative ml-1" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex flex-row items-center gap-1 font-pixel text-[16px] sm:text-[20px] text-[#1d1d1d] hover:bg-[#f5f5f5] px-2 py-1 rounded-[8px] transition-colors cursor-pointer outline-none border border-transparent hover:border-[#e0e0e0]"
              >
                <span className="truncate">{title}</span>
                <ChevronDown className={`w-4 h-4 text-[#5e5e5e] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-56 bg-white border border-[#e0e0e0] rounded-[14px] shadow-xl p-1.5 flex flex-col animate-in fade-in-0 zoom-in-95">
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {GAMES.map((game) => {
                      const isSelected = game.label.toLowerCase() === title.toLowerCase();
                      return (
                        <button
                          key={game.href}
                          type="button"
                          onClick={() => handleSelect(game.href)}
                          className={`flex items-center justify-between w-full px-2.5 py-2 rounded-[8px] font-pixel text-sm text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#f0f0f0] text-[#1d1d1d]"
                              : "text-[#4a4a4a] hover:bg-[#f7f7f7] hover:text-[#1d1d1d]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Image
                              src={game.icon}
                              alt={`${game.label} icon`}
                              width={16}
                              height={16}
                              className="shrink-0"
                            />
                            <span className="truncate">{game.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#1d1d1d] shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex flex-row items-center justify-left px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-[10px] bg-white hover:bg-[#f5f5f5] transition-all duration-200 cursor-pointer shrink-0 outline-none"
            >
              <Blobatar name={username} size={30} animate="always" expression={surprised} className="shrink-0" />
              <span className="font-pixel text-[16px] sm:text-[20px] ml-[5px]">{username}</span>
            </button>

            {userMenuOpen && (
              <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-52 bg-white border border-[#e0e0e0] rounded-[14px] shadow-xl p-1.5 flex flex-col gap-0.5 animate-in fade-in-0 zoom-in-95">
                <div className="px-2.5 py-2 border-b border-[#efefef] mb-0.5">
                  <p className="font-pixel text-[11px] text-[#8e8e8e] uppercase tracking-wider">Signed in as</p>
                  <p className="font-pixel text-sm text-[#1d1d1d] truncate mt-0.5">{username}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/dashboard");
                  }}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[8px] font-pixel text-xs sm:text-sm text-[#4a4a4a] hover:bg-[#f7f7f7] hover:text-[#1d1d1d] transition-colors cursor-pointer text-left"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#5e5e5e]" />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/dashboard");
                  }}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[8px] font-pixel text-xs sm:text-sm text-[#4a4a4a] hover:bg-[#f7f7f7] hover:text-[#1d1d1d] transition-colors cursor-pointer text-left"
                >
                  <User className="w-4 h-4 text-[#5e5e5e]" />
                  <span>Profile & Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/dashboard");
                  }}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[8px] font-pixel text-xs sm:text-sm text-[#4a4a4a] hover:bg-[#f7f7f7] hover:text-[#1d1d1d] transition-colors cursor-pointer text-left"
                >
                  <BarChart2 className="w-4 h-4 text-[#5e5e5e]" />
                  <span>Progress Stats</span>
                </button>

                <div className="h-px bg-[#efefef] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/");
                  }}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[8px] font-pixel text-xs sm:text-sm text-[#e53e3e] hover:bg-[#fff5f5] transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-[#e53e3e]" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
