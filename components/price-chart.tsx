"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export function PriceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // Generate random data points
    const points = 100
    const data: number[] = []

    // Create a somewhat realistic price chart
    let value = 100
    for (let i = 0; i < points; i++) {
      // Add some randomness but with a trend
      const change = (Math.random() - 0.5) * 5
      value += change
      if (value < 50) value = 50
      if (value > 150) value = 150
      data.push(value)
    }

    // Draw chart
    const width = rect.width
    const height = rect.height
    const maxValue = Math.max(...data)
    const minValue = Math.min(...data)
    const range = maxValue - minValue

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, "rgba(0, 169, 157, 0.2)")
    gradient.addColorStop(1, "rgba(0, 169, 157, 0)")

    // Draw line
    ctx.beginPath()
    ctx.moveTo(0, height - ((data[0] - minValue) / range) * height)

    for (let i = 1; i < data.length; i++) {
      const x = (i / (data.length - 1)) * width
      const y = height - ((data[i] - minValue) / range) * height
      ctx.lineTo(x, y)
    }

    // Draw line
    ctx.strokeStyle = "#00a99d"
    ctx.lineWidth = 2
    ctx.stroke()

    // Fill area
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }, [isLoading])

  return (
    <div className="chart-container w-full h-[200px] relative">
      {isLoading ? (
        <motion.div
          className="absolute inset-0 bg-card/50 animate-pulse-opacity"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      ) : (
        <motion.canvas
          ref={canvasRef}
          className="w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </div>
  )
}
