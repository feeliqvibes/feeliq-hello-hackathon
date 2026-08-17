import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hello Hackathon - FeeliQ',
  description: 'Word frequency analyzer — starter tool for hackathon participants',
  icons: {
    icon: '/feeliq-logo-mark.png',
    apple: '/feeliqlogo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
