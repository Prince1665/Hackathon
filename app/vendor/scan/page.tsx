"use client"

import { useEffect, useRef, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BrowserQRCodeReader } from "@zxing/browser"

type Item = {
  id: string
  name: string
  status: string
  category: string
}

export default function VendorScanPage() {
  const [cameraReady, setCameraReady] = useState(false)
  const [result, setResult] = useState<string>("")
  const [item, setItem] = useState<Item | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    codeReaderRef.current = new BrowserQRCodeReader()
    return () => {
      stopCamera()
      codeReaderRef.current = null
    }
  }, [])

  function stopCamera() {
    const v = videoRef.current
    const stream = (v?.srcObject as MediaStream | null) || streamRef.current
    if (stream) stream.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (v) v.srcObject = null
  }

  async function startScan() {
    setItem(null)
    setResult("")
    setCameraReady(true)
    try {
      // Request permission first so device labels are populated
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })
        // attach briefly so iOS shows preview immediately (optional)
        if (videoRef.current) {
          videoRef.current.srcObject = tmp
          await videoRef.current.play().catch(() => {})
        }
        // Keep a reference so we can stop it when ZXing takes over
        streamRef.current = tmp
      } catch (e) {
        // Continue; ZXing may still prompt. If it fails, we'll show an alert below.
      }

      const devices = await BrowserQRCodeReader.listVideoInputDevices()
      const pick = (list: MediaDeviceInfo[]) => {
        const byLabel = list.find((d) => /back|rear|environment/i.test(d.label))
        return byLabel?.deviceId || list[0]?.deviceId || null
      }
      const deviceId = pick(devices)
      if (!deviceId) throw new Error("No camera found")

      // Hand over to ZXing; it will manage the stream. Stop our temp stream if any.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      const res = await codeReaderRef.current!.decodeOnceFromVideoDevice(deviceId, videoRef.current!)
      const text = typeof (res as any).getText === "function" ? (res as any).getText() : (res as any).text
      setResult(text)
      await handleDecoded(text)
    } catch (e: any) {
      if (e?.name !== "NotFoundException") {
        alert(e?.message || "Failed to access camera. Ensure you are on HTTPS or localhost and have granted permission.")
      }
    } finally {
      setCameraReady(false)
      stopCamera()
    }
  }

  async function handleDecoded(text: string) {
    // Expect URL like https://host/item/{id}
    try {
      const url = new URL(text)
      const parts = url.pathname.split("/")
      const id = parts[parts.length - 1]
      const res = await fetch(`/api/items/${id}`)
      if (res.ok) {
        const data = await res.json()
        setItem(data)
      } else {
        setItem(null)
        alert("Item not found")
      }
    } catch {
      // Maybe direct ID
      const id = text.trim()
      const res = await fetch(`/api/items/${id}`)
      if (res.ok) setItem(await res.json())
    }
  }

  async function confirmCollection() {
    if (!item) return
    const res = await fetch(`/api/items/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "Collected" }) })
    if (res.ok) {
      const updated = await res.json()
      setItem(updated)
    } else {
      alert("Failed to update status")
    }
  }

  return (
    <main>
      <AppNav />
      <section className="container py-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor QR Scan</CardTitle>
            <CardDescription>Use device camera to scan item QR and update status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div className="grid gap-2">
                <Label htmlFor="manual">Manual item ID or QR URL (fallback)</Label>
                <Input id="manual" placeholder="Paste QR URL or Item ID" onChange={(e) => setResult(e.target.value)} value={result} />
              </div>
              <Button onClick={() => handleDecoded(result)} disabled={!result}>Lookup</Button>
            </div>
            <div className="grid gap-3">
              <div className="relative rounded border overflow-hidden bg-black/80 aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay playsInline />
                {!cameraReady ? (
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                    <div className="grid gap-2">
                      <Button onClick={startScan}>Start Camera</Button>
                      <div className="text-[11px] text-muted-foreground">If camera fails, check browser permissions and that you are on HTTPS or localhost.</div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">Note: Allow camera access when prompted.</div>
            </div>
            {item ? (
              <div className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.id}</div>
                  </div>
                  <Badge>{item.status}</Badge>
                </div>
                <div className="mt-3">
                  <Button onClick={confirmCollection} disabled={item.status === "Collected"}>Confirm Collection</Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
