import { useEffect, useRef, useState } from 'react'
import { captureImage } from '../camera/captureImage'
import { compressImage } from '../camera/compressImage'
import { stampMetadata } from '../camera/stampMetadata'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import type { CapturedPhoto } from './types'

function useObjectUrl(blob: Blob) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const next = URL.createObjectURL(blob); setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}

function PhotoTile({ photo, onRemove }: { photo: CapturedPhoto; onRemove: () => void }) {
  const url = useObjectUrl(photo.blob)
  const hasGps = photo.gps_lat != null && photo.gps_lng != null
  return (
    <li className="relative overflow-hidden rounded-xl border border-border">
      {url && <img src={url} alt={`Captured site evidence ${new Date(photo.captured_at_client).toLocaleString()}`} className="aspect-video w-full object-cover" />}
      <div className="flex items-center justify-between gap-2 p-2 text-xs">
        <span className={hasGps ? 'text-success' : 'text-warning'}>{hasGps ? 'GPS captured' : 'No GPS · will be unverified'}</span>
        <button type="button" onClick={onRemove} aria-label="Remove captured photo" className="min-h-9 rounded-lg px-2 text-danger">Remove</button>
      </div>
    </li>
  )
}

export function CameraCapture({ photos, onChange, max = 3, owner = 'site_logs' }: {
  photos: CapturedPhoto[]
  onChange: (photos: CapturedPhoto[]) => void
  max?: number
  owner?: 'site_logs' | 'reports' | 'movements'
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [open, setOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), [])
  useEffect(() => {
    if (open && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current
  }, [open])

  async function openCamera() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      setOpen(true)
    } catch { setError('Camera access was not granted. Allow camera access in your browser settings and try again.') }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setOpen(false)
  }

  function location(): Promise<{ lat: number | null; lng: number | null; accuracy: number | null }> {
    if (!navigator.geolocation) return Promise.resolve({ lat: null, lng: null, accuracy: null })
    return new Promise((resolve) => {
      let finished = false
      const timer = window.setTimeout(() => { if (!finished) { finished = true; resolve({ lat: null, lng: null, accuracy: null }) } }, 6000)
      navigator.geolocation.getCurrentPosition(
        (position) => { if (!finished) { finished = true; clearTimeout(timer); resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }) } },
        () => { if (!finished) { finished = true; clearTimeout(timer); resolve({ lat: null, lng: null, accuracy: null }) } },
        { enableHighAccuracy: true, timeout: 5500, maximumAge: 0 },
      )
    })
  }

  async function takePhoto() {
    if (!videoRef.current || photos.length >= max) return
    setWorking(true); setError(null)
    try {
      const capturedAt = new Date().toISOString()
      const frame = captureImage(videoRef.current)
      const [compressed, gps] = await Promise.all([compressImage(frame), location()])
      const blob = await stampMetadata(compressed, { capturedAt, gpsLat: gps.lat, gpsLng: gps.lng, gpsAccuracyM: gps.accuracy })
      const next: CapturedPhoto = {
        id: crypto.randomUUID(), blob, fileName: `${owner}-${capturedAt.replace(/[:.]/g, '-')}.jpg`,
        captured_at_client: capturedAt, gps_lat: gps.lat, gps_lng: gps.lng, gps_accuracy_m: gps.accuracy,
      }
      onChange([...photos, next])
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not capture this photo.') }
    finally { setWorking(false) }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="font-medium text-text">Photo evidence</h3><p className="text-sm text-muted">Camera only · up to {max} · compressed to 1024px</p></div>
        {!open && photos.length < max && <Button type="button" variant="secondary" onClick={() => void openCamera()}>Open camera</Button>}
      </div>
      {open && <div className="space-y-3">
        <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera preview" className="max-h-[55vh] w-full rounded-xl bg-black object-contain" />
        <div className="flex gap-2"><Button type="button" onClick={() => void takePhoto()} loading={working}>Capture photo</Button><Button type="button" variant="secondary" onClick={closeCamera}>Close camera</Button></div>
      </div>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {photos.length > 0 && <ul className="grid gap-3 sm:grid-cols-2">{photos.map((photo) => <PhotoTile key={photo.id} photo={photo} onRemove={() => onChange(photos.filter((p) => p.id !== photo.id))} />)}</ul>}
    </Card>
  )
}
