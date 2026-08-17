'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2, Copy, Check } from 'lucide-react'
import PageShell from '@/components/PageShell'

export default function HelloHackathon({ tool }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const analyze = async () => {
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
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyResult = () => {
    if (!result) return
    const text = [
      `Word Count: ${result.wordCount}`,
      `Character Count: ${result.charCount}`,
      '',
      'Top Words:',
      ...result.topWords.map(w => `  ${w.word}: ${w.count}`),
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <PageShell title={tool?.name || 'Hello Hackathon'} icon={Sparkles}>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter text below to analyze word frequency. Built with the FeeliQ tool template.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste or type your text here..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:outline-none focus:border-[#004aad] focus:ring-1 focus:ring-[#004aad] dark:bg-gray-900 dark:text-gray-100"
            disabled={loading}
          />

          <button
            onClick={analyze}
            disabled={loading || !input.trim()}
            className="w-full px-6 py-3 bg-[#004aad] text-white text-sm font-semibold rounded-lg hover:bg-[#003885] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Text
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Results</h3>
              <button
                onClick={copyResult}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#004aad] transition-colors"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[#004aad]">{result.wordCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Words</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[#004aad]">{result.charCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Characters</div>
              </div>
            </div>

            {result.topWords.length > 0 && (
              <div className="px-4 pb-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Top Words</h4>
                <div className="space-y-1">
                  {result.topWords.map((w, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-800 dark:text-gray-200 font-mono">{w.word}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#004aad] rounded-full"
                            style={{ width: `${(w.count / result.topWords[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-6 text-right">{w.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Type B1 tool — uses API route for processing
        </p>
      </div>
    </PageShell>
  )
}
