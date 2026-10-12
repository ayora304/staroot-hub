export interface CaptureMetadata {
  capturedAt: string
  gpsLat: number | null
  gpsLng: number | null
  gpsAccuracyM: number | null
}

/** Burn a readable capture time and location into the compressed image. */
export async function stampMetadata(photo: Blob, meta: CaptureMetadata): Promise<Blob> {
  const bitmap = await createImageBitmap(photo)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  if (!context) { bitmap.close(); throw new Error('Could not stamp the photo.') }
  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  const footer = Math.max(42, Math.round(canvas.width * 0.065))
  context.fillStyle = 'rgba(0,0,0,.72)'
  context.fillRect(0, canvas.height - footer, canvas.width, footer)
  context.fillStyle = '#fff'
  context.font = `600 ${Math.max(12, Math.round(canvas.width * 0.026))}px sans-serif`
  const time = new Date(meta.capturedAt).toLocaleString()
  const location = meta.gpsLat == null || meta.gpsLng == null
    ? 'GPS unavailable'
    : `GPS ${meta.gpsLat.toFixed(5)}, ${meta.gpsLng.toFixed(5)} (±${Math.round(meta.gpsAccuracyM ?? 0)}m)`
  context.fillText(`${time}  ·  ${location}`, Math.round(canvas.width * 0.025), canvas.height - Math.round(footer * 0.36), canvas.width * 0.95)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode the stamped photo.')), 'image/jpeg', 0.65))
}
