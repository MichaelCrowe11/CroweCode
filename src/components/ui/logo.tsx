"use client"

import { useTheme } from "next-themes"
import { siteConfig } from "@/config/site"
import Image from "next/image"

interface LogoProps {
  className?: string
  width?: number
  height?: number
  showText?: boolean
}

export function Logo({ className = "", width = 40, height = 40, showText = true }: LogoProps) {
  const { theme } = useTheme()
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Logo placeholder - replace with actual logo image */}
        <div 
          className="flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold"
          style={{ width, height }}
        >
          CC
        </div>
      </div>
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
          CroweCode
        </span>
      )}
    </div>
  )
}

export function LogoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="text-cyan-500"
    >
      <path 
        d="M12 2L2 7L12 12L22 7L12 2Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M2 17L12 22L22 17" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M2 12L12 17L22 12" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}