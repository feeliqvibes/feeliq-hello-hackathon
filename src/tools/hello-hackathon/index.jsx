'use client'

import React, { useState } from 'react'
import { Sparkles, Copy, Check } from 'lucide-react'
import PageShell from '@/components/PageShell'
import { useTextAnalyzer } from './hooks/use-text-analyzer'
import InputArea from './components/input-area'
import StatsCard from './components/stats-card'
import WordFrequency from './components/word-frequency'
import ErrorBoundary from './components/error-boundary'

export default function HelloHackathon({ tool }) {
  const { input, setInput, result, loading, error } = useTextAnalyzer()
  const [copied, setCopied] = useState(false)

  const copyResult = () => {
    if (!result) return
    try {
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
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <PageShell title={tool?.name || 'Hello Hackathon'} icon={Sparkles}>
      <ErrorBoundary>
        <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter text below to analyze word frequency. Built with the FeeliQ tool template.
            </p>
          </div>

          <InputArea
            input={input}
            setInput={setInput}
            loading={loading}
          />

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

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

              <StatsCard wordCount={result.wordCount} charCount={result.charCount} />
              <WordFrequency topWords={result.topWords} />
            </div>
          )}

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Type B1 tool — uses API route for processing
          </p>
        </div>
      </ErrorBoundary>
    </PageShell>
  )
}
