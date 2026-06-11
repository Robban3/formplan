import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Något gick fel</h1>
          <p className="text-stone-400 text-sm mb-6">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-forest-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Ladda om appen
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
