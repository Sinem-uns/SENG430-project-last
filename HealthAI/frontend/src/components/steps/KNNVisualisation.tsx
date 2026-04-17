'use client'

import React, { useEffect, useRef } from 'react'

export function KNNVisualisation({ k }: { k: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Center point (New Patient)
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    // Deterministic random points for two classes
    // We want them to be somewhat separated but mixed
    const points: { x: number, y: number, color: string, dist: number }[] = []
    
    // Seeded random for stable redraws
    let seed = 42
    const random = () => {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    }

    // Generate Class A (Blue - Healthy)
    for (let i = 0; i < 40; i++) {
      const x = random() * canvas.width * 0.7
      const y = random() * canvas.height * 0.7
      points.push({ x, y, color: '#0ea5e9', dist: Math.hypot(x - cx, y - cy) }) // teal-500 equivalent
    }

    // Generate Class B (Red - Sick)
    for (let i = 0; i < 40; i++) {
      const x = random() * canvas.width * 0.7 + canvas.width * 0.3
      const y = random() * canvas.height * 0.7 + canvas.height * 0.3
      points.push({ x, y, color: '#ef4444', dist: Math.hypot(x - cx, y - cy) }) // red-500 equivalent
    }

    // Sort by distance to center
    points.sort((a, b) => a.dist - b.dist)

    // Draw all points
    points.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      // Dim points that aren't in the nearest K
      ctx.globalAlpha = i < k ? 1.0 : 0.2
      ctx.fill()
      if (i < k) {
        ctx.lineWidth = 1
        ctx.strokeStyle = '#334155'
        ctx.stroke()
      }
      ctx.globalAlpha = 1.0
    })

    // Draw decision radius circle
    if (k > 0 && points.length >= k) {
      const radius = points[k - 1].dist + 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = '#94a3b8'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw center point (The new patient to classify)
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#f8fafc' // white
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#0f172a' // almost black
    ctx.stroke()
    
    // Draw crosshair inside center point
    ctx.beginPath()
    ctx.moveTo(cx - 3, cy)
    ctx.lineTo(cx + 3, cy)
    ctx.moveTo(cx, cy - 3)
    ctx.lineTo(cx, cy + 3)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1
    ctx.stroke()

  }, [k])

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-2 font-medium">Dynamic KNN Visualisation</div>
      <canvas 
        ref={canvasRef} 
        width={240} 
        height={240} 
        className="border border-border-subtle rounded-md bg-white shadow-sm"
      />
      <div className="text-[10px] text-muted-foreground mt-2 max-w-[240px] text-center leading-tight">
        Circle automatically expands to nearest {k} historical cases to determine majority class
      </div>
    </div>
  )
}
