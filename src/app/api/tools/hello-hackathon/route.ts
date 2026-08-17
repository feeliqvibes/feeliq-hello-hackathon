import { NextRequest, NextResponse } from 'next/server'

interface GitHubRepo {
  name: string
  description: string
  default_branch: string
  created_at: string
  updated_at: string
  owner: { login: string }
}

interface GitHubTree {
  tree: Array<{ path: string; type: string; size?: number }>
}

interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: { name: string; date: string }
  }
}

interface GitHubFile {
  content: string
  encoding: string
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const cleaned = url.trim().replace(/\/+$/, '')
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2].replace('.git', '') }
}

async function fetchGitHub(owner: string, repo: string, path: string): Promise<unknown> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/${path}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
    signal: AbortSignal.timeout(15_000),
  })

  if (res.status === 403) {
    const reset = res.headers.get('x-ratelimit-reset')
    const resetTime = reset ? new Date(parseInt(reset) * 1000).toISOString() : 'unknown'
    throw new Error(`GitHub API rate limit exceeded. Try again after ${resetTime}`)
  }

  if (res.status === 404) {
    throw new Error('Repository not found. Make sure it is public.')
  }

  if (res.status === 401) {
    throw new Error('Repository is private. Only public repos can be validated.')
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`)
  }

  return res.json()
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const data = await fetchGitHub(owner, repo, `contents/${path}`) as GitHubFile
    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return data.content
  } catch {
    return null
  }
}

async function fetchGitHubData(owner: string, repo: string) {
  const repoData = await fetchGitHub(owner, repo, '') as GitHubRepo

  const [treeData, commitsData] = await Promise.all([
    fetchGitHub(owner, repo, `git/trees/${repoData.default_branch}?recursive=1`) as Promise<GitHubTree>,
    fetchGitHub(owner, repo, 'commits?per_page=20') as Promise<GitHubCommit[]>,
  ])

  const filePaths = treeData.tree
    .filter(item => item.type === 'blob')
    .map(item => item.path)

  const filesToFetch = [
    'README.md', 'readme.md', 'README',
    '.gitignore',
    'LICENSE', 'LICENSE.md', 'license', 'license.md',
  ]

  const jsxFiles = filePaths
    .filter(p => p.endsWith('.jsx') || p.endsWith('.tsx'))
    .slice(0, 10)

  const sqlFiles = filePaths
    .filter(p => p.endsWith('.sql'))
    .slice(0, 5)

  const allFetchPaths = [...new Set([...filesToFetch, ...jsxFiles, ...sqlFiles])]

  const fetchedFiles: Record<string, string> = {}
  await Promise.allSettled(
    allFetchPaths.map(async (path) => {
      const content = await fetchFileContent(owner, repo, path)
      if (content) fetchedFiles[path] = content
    })
  )

  return {
    repo: {
      name: repoData.name,
      description: repoData.description || '',
      defaultBranch: repoData.default_branch,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
    },
    fileTree: filePaths,
    commits: commitsData.slice(0, 20),
    fetchedFiles,
  }
}

interface Check {
  id: string
  name: string
  category: string
  severity: 'blocker' | 'required' | 'bonus'
  passed: boolean
  points: number
  maxPoints: number
  justification: string
}

interface Score {
  total: number
  functionality: number
  branding: number
  codeQuality: number
  github: number
  security: number
  innovation: number
}

interface ValidationReport {
  repo: { name: string; description: string; defaultBranch: string; createdAt: string; updatedAt: string }
  score: Score
  checks: Check[]
  fileTree: string[]
  commits: Array<{ sha: string; commit: { message: string; author: { name: string; date: string } } }>
  fetchedFiles: Record<string, string>
}

function contentHas(files: Record<string, string>, pattern: RegExp): string[] {
  return Object.entries(files)
    .filter(([, content]) => pattern.test(content))
    .map(([path]) => path)
}

function fileExists(fileTree: string[], name: string): boolean {
  return fileTree.some(p => p === name || p.endsWith('/' + name))
}

function runChecks(data: {
  fileTree: string[]
  fetchedFiles: Record<string, string>
  commits: Array<{ commit: { message: string } }>
}): Check[] {
  const { fileTree, fetchedFiles, commits } = data
  const allContent = Object.values(fetchedFiles).join('\n')
  const checks: Check[] = []

  // ── Functionality (30 pts) ──
  const hasIndexJsx = fileTree.some(p => p.endsWith('index.jsx') || p.endsWith('index.tsx'))
  checks.push({ id: 'func-index', name: 'index.jsx exists', category: 'functionality', severity: 'blocker', passed: hasIndexJsx, points: hasIndexJsx ? 5 : 0, maxPoints: 5, justification: hasIndexJsx ? 'Found index.jsx/tsx in repository' : 'No index.jsx or index.tsx found in repository' })

  const hasRegisterSql = fileTree.some(p => p.endsWith('register_tool.sql'))
  checks.push({ id: 'func-sql', name: 'register_tool.sql exists', category: 'functionality', severity: 'blocker', passed: hasRegisterSql, points: hasRegisterSql ? 5 : 0, maxPoints: 5, justification: hasRegisterSql ? 'Found register_tool.sql' : 'No register_tool.sql found' })

  const hasExportDefault = /export\s+default\s+function/.test(allContent)
  checks.push({ id: 'func-export', name: 'export default', category: 'functionality', severity: 'blocker', passed: hasExportDefault, points: hasExportDefault ? 5 : 0, maxPoints: 5, justification: hasExportDefault ? 'Found export default function' : 'No export default function found in JSX/TSX files' })

  const hasUseClient = /['"]use client['"]/.test(allContent)
  checks.push({ id: 'func-useclient', name: "'use client' directive", category: 'functionality', severity: 'required', passed: hasUseClient, points: hasUseClient ? 3 : 0, maxPoints: 3, justification: hasUseClient ? 'Found use client directive' : 'Missing use client directive in components' })

  const hasErrorHandling = /try\s*\{|\.catch\(|onError|handleError/.test(allContent)
  checks.push({ id: 'func-error', name: 'Error handling', category: 'functionality', severity: 'required', passed: hasErrorHandling, points: hasErrorHandling ? 3 : 0, maxPoints: 3, justification: hasErrorHandling ? 'Found error handling patterns (try/catch or .catch)' : 'No error handling patterns found' })

  const hasValidation = /validate|required|zod|yup|joi/.test(allContent)
  checks.push({ id: 'func-validation', name: 'Input validation', category: 'functionality', severity: 'required', passed: hasValidation, points: hasValidation ? 3 : 0, maxPoints: 3, justification: hasValidation ? 'Found input validation patterns' : 'No input validation found' })

  const hasLoading = /loading|isLoading|Spinner|skeleton/i.test(allContent)
  checks.push({ id: 'func-loading', name: 'Loading states', category: 'functionality', severity: 'bonus', passed: hasLoading, points: hasLoading ? 3 : 0, maxPoints: 3, justification: hasLoading ? 'Found loading state handling' : 'No loading states detected' })

  const jsxCount = fileTree.filter(p => p.endsWith('.jsx') || p.endsWith('.tsx')).length
  const hasMultipleComponents = jsxCount > 3
  checks.push({ id: 'func-multi', name: 'Multiple components', category: 'functionality', severity: 'bonus', passed: hasMultipleComponents, points: hasMultipleComponents ? 3 : 0, maxPoints: 3, justification: hasMultipleComponents ? `Found ${jsxCount} JSX/TSX files` : `Only ${jsxCount} JSX/TSX files found` })

  // ── Branding & UI (20 pts) ──
  const hasPageShellImport = /import.*PageShell|from.*PageShell/.test(allContent)
  checks.push({ id: 'brand-import', name: 'PageShell imported', category: 'branding', severity: 'blocker', passed: hasPageShellImport, points: hasPageShellImport ? 5 : 0, maxPoints: 5, justification: hasPageShellImport ? 'PageShell is imported' : 'PageShell import not found' })

  const hasPageShellUsage = /<PageShell[\s>]/.test(allContent)
  checks.push({ id: 'brand-usage', name: 'PageShell wrapping content', category: 'branding', severity: 'blocker', passed: hasPageShellUsage, points: hasPageShellUsage ? 5 : 0, maxPoints: 5, justification: hasPageShellUsage ? 'PageShell component is used' : 'PageShell component not used in JSX' })

  const hasBrandColor = /004aad|#004aad|bg-\[#004aad\]/i.test(allContent)
  checks.push({ id: 'brand-color', name: '#004aad color', category: 'branding', severity: 'blocker', passed: hasBrandColor, points: hasBrandColor ? 3 : 0, maxPoints: 3, justification: hasBrandColor ? 'Brand color #004aad found' : 'Brand color #004aad not found' })

  const hasCompanyName = /FeeliQ\s*Technologies/.test(allContent)
  checks.push({ id: 'brand-company', name: 'FeeliQ Technologies text', category: 'branding', severity: 'blocker', passed: hasCompanyName, points: hasCompanyName ? 2 : 0, maxPoints: 2, justification: hasCompanyName ? '"FeeliQ Technologies" text found' : '"FeeliQ Technologies" text not found' })

  const hasDarkMode = /dark:/.test(allContent)
  checks.push({ id: 'brand-dark', name: 'Dark mode classes', category: 'branding', severity: 'required', passed: hasDarkMode, points: hasDarkMode ? 3 : 0, maxPoints: 3, justification: hasDarkMode ? 'Dark mode classes (dark:) found' : 'No dark mode classes found' })

  const hasResponsive = /md:|sm:|lg:|xl:/.test(allContent)
  checks.push({ id: 'brand-responsive', name: 'Responsive classes', category: 'branding', severity: 'bonus', passed: hasResponsive, points: hasResponsive ? 2 : 0, maxPoints: 2, justification: hasResponsive ? 'Responsive breakpoint classes found' : 'No responsive breakpoint classes found' })

  // ── Code Quality (20 pts) ──
  const hasHooksDir = fileTree.some(p => p.includes('hooks/') && (p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts')))
  checks.push({ id: 'quality-hooks', name: 'Hook separation', category: 'codeQuality', severity: 'required', passed: hasHooksDir, points: hasHooksDir ? 4 : 0, maxPoints: 4, justification: hasHooksDir ? 'Found hooks/ directory with custom hooks' : 'No hooks/ directory found' })

  const folderNames = fileTree.map(p => p.split('/').filter(Boolean)[0]).filter(Boolean)
  const uniqueFolders = [...new Set(folderNames)]
  const hasCleanStructure = uniqueFolders.length >= 2 && fileTree.length > 3
  checks.push({ id: 'quality-structure', name: 'Clean file structure', category: 'codeQuality', severity: 'required', passed: hasCleanStructure, points: hasCleanStructure ? 4 : 0, maxPoints: 4, justification: hasCleanStructure ? `Found ${uniqueFolders.length} directories, ${fileTree.length} files` : 'File structure appears minimal' })

  const hasConsistentNaming = fileTree.every(p => !/[A-Z]/.test(p.split('/').pop() || '') || p.endsWith('.md') || p.endsWith('.sql'))
  checks.push({ id: 'quality-naming', name: 'Consistent naming', category: 'codeQuality', severity: 'required', passed: hasConsistentNaming, points: hasConsistentNaming ? 4 : 0, maxPoints: 4, justification: hasConsistentNaming ? 'File names follow consistent casing' : 'Some file names have inconsistent casing' })

  const hasComments = /\/\/|\/\*\*|\*\/|#\s/.test(allContent)
  checks.push({ id: 'quality-comments', name: 'Comments in code', category: 'codeQuality', severity: 'bonus', passed: hasComments, points: hasComments ? 4 : 0, maxPoints: 4, justification: hasComments ? 'Found comments in code' : 'No comments found in code' })

  const importLines = allContent.match(/^import\s+.*from\s+['"].*['"]/gm) || []
  const importCount = importLines.length
  const hasNoUnusedImports = importCount < 50 || importCount > 0
  checks.push({ id: 'quality-unused', name: 'Import count reasonable', category: 'codeQuality', severity: 'required', passed: hasNoUnusedImports, points: hasNoUnusedImports ? 4 : 0, maxPoints: 4, justification: hasNoUnusedImports ? `${importCount} imports found (reasonable)` : 'Excessive imports detected' })

  // ── GitHub Standards (15 pts) ──
  const hasReadme = fileExists(fileTree, 'README.md') || fileExists(fileTree, 'readme.md')
  checks.push({ id: 'gh-readme', name: 'README.md exists', category: 'github', severity: 'blocker', passed: hasReadme, points: hasReadme ? 3 : 0, maxPoints: 3, justification: hasReadme ? 'README.md found' : 'README.md not found' })

  const readmeContent = fetchedFiles['README.md'] || fetchedFiles['readme.md'] || ''
  const hasReadmeContent = readmeContent.length > 100
  checks.push({ id: 'gh-readme-content', name: 'README has content', category: 'github', severity: 'blocker', passed: hasReadmeContent, points: hasReadmeContent ? 2 : 0, maxPoints: 2, justification: hasReadmeContent ? `README has ${readmeContent.length} characters` : `README has only ${readmeContent.length} characters (needs >100)` })

  const hasGitignore = fileExists(fileTree, '.gitignore')
  checks.push({ id: 'gh-gitignore', name: '.gitignore exists', category: 'github', severity: 'blocker', passed: hasGitignore, points: hasGitignore ? 3 : 0, maxPoints: 3, justification: hasGitignore ? '.gitignore found' : '.gitignore not found' })

  const hasLicense = fileTree.some(p => /^LICENSE/i.test(p.split('/').pop() || ''))
  checks.push({ id: 'gh-license', name: 'LICENSE exists', category: 'github', severity: 'blocker', passed: hasLicense, points: hasLicense ? 3 : 0, maxPoints: 3, justification: hasLicense ? 'LICENSE file found' : 'LICENSE file not found' })

  const hasEnoughCommits = commits.length > 3
  checks.push({ id: 'gh-commits', name: '>3 commits', category: 'github', severity: 'required', passed: hasEnoughCommits, points: hasEnoughCommits ? 2 : 0, maxPoints: 2, justification: hasEnoughCommits ? `Found ${commits.length} commits` : `Only ${commits.length} commits found (needs >3)` })

  const hasMeaningfulCommits = commits.some(c => c.commit.message.length > 10)
  checks.push({ id: 'gh-commit-msg', name: 'Meaningful commit messages', category: 'github', severity: 'bonus', passed: hasMeaningfulCommits, points: hasMeaningfulCommits ? 2 : 0, maxPoints: 2, justification: hasMeaningfulCommits ? 'Found descriptive commit messages' : 'Commit messages appear too short' })

  // ── Security (10 pts) ──
  const hasApiKeys = /sk-[a-zA-Z0-9]{20,}|gsk_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9\-]{20,}/.test(allContent)
  checks.push({ id: 'sec-apikeys', name: 'No hardcoded API keys', category: 'security', severity: 'blocker', passed: !hasApiKeys, points: !hasApiKeys ? 2 : 0, maxPoints: 2, justification: hasApiKeys ? 'Hardcoded API keys detected!' : 'No hardcoded API keys found' })

  const hasSecrets = /(secret|password|passwd)\s*[:=]\s*['"][^'"]{8,}['"]/i.test(allContent)
  checks.push({ id: 'sec-secrets', name: 'No secrets in code', category: 'security', severity: 'blocker', passed: !hasSecrets, points: !hasSecrets ? 2 : 0, maxPoints: 2, justification: hasSecrets ? 'Potential secrets/passwords in code!' : 'No hardcoded secrets found' })

  const hasEval = /\beval\s*\(|new\s+Function\s*\(/.test(allContent)
  checks.push({ id: 'sec-eval', name: 'No eval() usage', category: 'security', severity: 'blocker', passed: !hasEval, points: !hasEval ? 2 : 0, maxPoints: 2, justification: hasEval ? 'eval() or Function() detected!' : 'No eval() usage found' })

  const hasDangerousHtml = /dangerouslySetInnerHTML/.test(allContent)
  checks.push({ id: 'sec-xss', name: 'No dangerouslySetInnerHTML', category: 'security', severity: 'blocker', passed: !hasDangerousHtml, points: !hasDangerousHtml ? 1 : 0, maxPoints: 1, justification: hasDangerousHtml ? 'dangerouslySetInnerHTML detected!' : 'No dangerouslySetInnerHTML found' })

  const hasEnvCommitted = fileTree.some(p => /^\.env$/i.test(p.split('/').pop() || '') || /\.env\./i.test(p))
  checks.push({ id: 'sec-env', name: '.env not committed', category: 'security', severity: 'blocker', passed: !hasEnvCommitted, points: !hasEnvCommitted ? 1 : 0, maxPoints: 1, justification: hasEnvCommitted ? '.env file found in repository!' : 'No .env files committed' })

  const hasNodeModules = fileTree.some(p => p.startsWith('node_modules/'))
  checks.push({ id: 'sec-nodemod', name: 'node_modules not committed', category: 'security', severity: 'blocker', passed: !hasNodeModules, points: !hasNodeModules ? 1 : 0, maxPoints: 1, justification: hasNodeModules ? 'node_modules/ found in repository!' : 'node_modules/ not committed' })

  const hasPrivateKeys = /BEGIN\s+(RSA|OPENSSH|DSA|EC)\s+PRIVATE\s+KEY/.test(allContent)
  checks.push({ id: 'sec-privatekey', name: 'No private keys', category: 'security', severity: 'blocker', passed: !hasPrivateKeys, points: !hasPrivateKeys ? 1 : 0, maxPoints: 1, justification: hasPrivateKeys ? 'Private key detected!' : 'No private keys found' })

  // ── Innovation & UX (5 pts) ──
  const sourceFiles = fileTree.filter(p => p.endsWith('.jsx') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.ts'))
  const hasManyFiles = sourceFiles.length > 5
  checks.push({ id: 'innov-files', name: '>5 source files', category: 'innovation', severity: 'bonus', passed: hasManyFiles, points: hasManyFiles ? 1 : 0, maxPoints: 1, justification: hasManyFiles ? `${sourceFiles.length} source files found` : `Only ${sourceFiles.length} source files` })

  const hasManyCommits = commits.length > 10
  checks.push({ id: 'innov-commits', name: '>10 commits', category: 'innovation', severity: 'bonus', passed: hasManyCommits, points: hasManyCommits ? 1 : 0, maxPoints: 1, justification: hasManyCommits ? `${commits.length} commits found` : `Only ${commits.length} commits` })

  const hasRouteTs = fileTree.some(p => p.endsWith('route.ts') || p.endsWith('route.js'))
  checks.push({ id: 'innov-ai', name: 'Has API route (AI pattern)', category: 'innovation', severity: 'bonus', passed: hasRouteTs, points: hasRouteTs ? 1 : 0, maxPoints: 1, justification: hasRouteTs ? 'Found API route (Type B1 pattern)' : 'No API route found' })

  checks.push({ id: 'innov-hooks', name: 'Has hooks/ directory', category: 'innovation', severity: 'bonus', passed: hasHooksDir, points: hasHooksDir ? 1 : 0, maxPoints: 1, justification: hasHooksDir ? 'Found hooks/ directory' : 'No hooks/ directory found' })

  checks.push({ id: 'innov-loading', name: 'Loading/error states', category: 'innovation', severity: 'bonus', passed: hasLoading, points: hasLoading ? 1 : 0, maxPoints: 1, justification: hasLoading ? 'Found loading/error state handling' : 'No loading/error states detected' })

  return checks
}

function calculateScore(checks: Check[]): Score {
  const sum = (cat: string) => checks.filter(c => c.category === cat).reduce((s, c) => s + c.points, 0)
  const functionality = sum('functionality')
  const branding = sum('branding')
  const codeQuality = sum('codeQuality')
  const github = sum('github')
  const security = sum('security')
  const innovation = sum('innovation')
  return { total: functionality + branding + codeQuality + github + security + innovation, functionality, branding, codeQuality, github, security, innovation }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Please provide a GitHub repository URL' }, { status: 400 })
    }

    const parsed = parseGitHubUrl(url)
    if (!parsed) {
      return NextResponse.json({ error: 'Please enter a valid GitHub URL (e.g., https://github.com/user/repo)' }, { status: 400 })
    }

    const data = await fetchGitHubData(parsed.owner, parsed.repo)
    const checks = runChecks(data)
    const score = calculateScore(checks)

    const report: ValidationReport = {
      repo: data.repo,
      score,
      checks,
      fileTree: data.fileTree,
      commits: data.commits,
      fetchedFiles: data.fetchedFiles,
    }

    return NextResponse.json(report)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
