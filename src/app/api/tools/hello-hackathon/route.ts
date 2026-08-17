import { NextResponse } from 'next/server'

interface TextStats {
  wordCount: number
  charCount: number
  topWords: Array<{ word: string; count: number }>
}

function analyzeText(text: string): TextStats {
  const trimmed = text.trim()
  const charCount = trimmed.length

  const words = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)

  const wordCount = words.length

  const frequency: Record<string, number> = {}
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1
  }

  const topWords = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }))

  return { wordCount, charCount, topWords }
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Please provide text to analyze' },
        { status: 400 }
      )
    }

    if (text.length > 50_000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 50,000 characters.' },
        { status: 400 }
      )
    }

    const result = analyzeText(text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: 'Failed to analyze text' },
      { status: 500 }
    )
  }
}
