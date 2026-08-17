'use client'

import React from 'react'
import { Loader2, Sparkles } from 'lucide-react'

export default function InputArea({ input, setInput, loading, onAnalyze }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste or type your text here..."
        rows={6}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:outline-none focus:border-[#004aad] focus:ring-1 focus:ring-[#004aad] dark:bg-gray-900 dark:text-gray-100"
        disabled={loading}
      />

      <button
        onClick={onAnalyze}
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
  )
}
