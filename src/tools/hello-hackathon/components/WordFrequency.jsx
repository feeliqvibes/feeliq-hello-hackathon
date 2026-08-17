'use client'

import React from 'react'

export default function WordFrequency({ topWords }) {
  if (!topWords || topWords.length === 0) return null

  const maxCount = topWords[0].count

  return (
    <div className="px-4 pb-4">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Top Words</h4>
      <div className="space-y-1">
        {topWords.map((w, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-800 dark:text-gray-200 font-mono truncate mr-2">{w.word}</span>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-16 sm:w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#004aad] rounded-full"
                  style={{ width: `${(w.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 w-6 text-right">{w.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
