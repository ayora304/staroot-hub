import { Component, type ErrorInfo, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crashed', error, info.componentStack)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm opacity-70">Your saved work is safe on this device.</p>
        <button className="min-h-12 rounded-xl border px-5" onClick={() => location.reload()}>Reload</button>
      </div>
    )
  }
}
