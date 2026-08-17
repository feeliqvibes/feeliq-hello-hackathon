'use client'

import { useState, useCallback } from 'react'

// Custom hook for text analysis with error handling and loading states
export function useTextAnalyzer() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Analyze text via API route
  const analyze = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter some text to analyze')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/tools/hello-hackathon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
        signal: AbortSignal.timeout(30_000),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed with status ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error. Please check your connection.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }, [input])

  // Reset all state
  const reset = useCallback(() => {
    setInput('')
    setResult(null)
    setError(null)
  }, [])

  return { input, setInput, result, loading, error, analyze, reset }
}
