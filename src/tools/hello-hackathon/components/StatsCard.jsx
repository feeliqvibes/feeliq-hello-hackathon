'use client'

import React from 'react'

export default function StatsCard({ wordCount, charCount }) {
  return (
    <div className="p-4 grid grid-cols-2 gap-3 sm:gap-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
        <div className="text-xl sm:text-2xl font-bold text-[#004aad]">{wordCount}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Words</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
        <div className="text-xl sm:text-2xl font-bold text-[#004aad]">{charCount}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Characters</div>
      </div>
    </div>
  )
}
