import { NextRequest, NextResponse } from 'next/server'

// Text analysis result structure
interface AnalysisResult {
  wordCount: number
  charCount: number
  topWords: Array<{ word: string; count: number }>
}

// Analyze text and return word frequency statistics
function analyzeText(text: string): AnalysisResult {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)

  const wordCounts: Record<string, number> = {}
  for (const word of words) {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  }

  const topWords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  return {
    wordCount: words.length,
    charCount: text.replace(/\s/g, '').length,
    topWords,
  }
}

// POST handler for text analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Please provide text to analyze' },
        { status: 400 }
      )
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 }
      )
    }

    const result = analyzeText(text)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
