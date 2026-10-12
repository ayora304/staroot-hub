/** Captures only from a live camera stream; there is deliberately no file-picker path. */
export function captureImage(video: HTMLVideoElement): HTMLCanvasElement {
  if (!video.videoWidth || !video.videoHeight) throw new Error('Camera is not ready yet.')
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not prepare the camera image.')
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas
}
