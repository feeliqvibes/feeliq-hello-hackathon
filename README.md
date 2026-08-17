# Hello Hackathon

A starter tool for FeeliQ hackathon participants. Built with the [feeliq-tool-dev-template](https://github.com/feeliqvibes/feeliq-tool-dev-template).

## What It Does

**Hello Hackathon** is a word frequency analyzer:
- Enter any text
- See word count, character count, and top 5 most frequent words
- Copy results to clipboard

## Project Structure

```
src/
├── tools/hello-hackathon/
│   ├── index.jsx              # Main component
│   └── register_tool.sql      # Database registration
└── app/api/tools/hello-hackathon/
    └── route.ts               # API route
```

## Setup

### 1. Clone the template

```bash
git clone https://github.com/feeliqvibes/feeliq-tool-dev-template.git my-project
cd my-project
```

### 2. Copy this tool into the template

```bash
# Copy tool files
cp -r /path/to/this/repo/src/tools/hello-hackathon frontend/src/tools/
cp -r /path/to/this/repo/src/app/api/tools/hello-hackathon frontend/src/app/api/tools/
```

### 3. Register the tool

Add to `frontend/src/tools/registry.js`:

```js
const HelloHackathon = React.lazy(() => import('./hello-hackathon/index.jsx'));
// Add to TOOL_REGISTRY:
'hello-hackathon': HelloHackathon,
```

### 4. Start the dev server

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — "Hello Hackathon" appears in the tool list.

## Tech Stack

- Next.js 16.3 (App Router)
- React 19
- Tailwind CSS
- TypeScript (API route)
- FeeliQ tool template conventions

## Branding

- Brand color: `#004aad`
- Company: FeeliQ Technologies
- Uses PageShell wrapper for consistent layout
- Full dark mode support

## License

MIT
