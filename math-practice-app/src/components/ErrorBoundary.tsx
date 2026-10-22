import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * General error screen: if a page crashes, show a friendly message and a way home instead of a
 * blank page or a technical stack trace.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Page error:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <section className="page page--narrow" role="alert">
        <h1 className="page__title">Oops! Something went wrong 🙈</h1>
        <p className="page__subtitle">
          This page had a problem. Your saved progress is safe. Let's go back and try again.
        </p>
        <div className="page__actions">
          {/* A full page load resets the app cleanly. */}
          <a href="/" className="btn btn--primary">
            Back to Home
          </a>
        </div>
      </section>
    )
  }
}

export default ErrorBoundary
