export function compressImage(source: HTMLCanvasElement, maxEdge = 1024, quality = 0.65): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('Could not compress the camera image.'))
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode the camera image.')), 'image/jpeg', quality))
}
