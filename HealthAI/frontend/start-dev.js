#!/usr/bin/env node
// Wrapper to start Next.js dev server — used by .claude/launch.json
const { spawn } = require('child_process')
const port = process.env.PORT || process.argv[2] || '3000'

const next = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'dev', '--port', port],
  { stdio: 'inherit', cwd: __dirname }
)

next.on('exit', (code) => process.exit(code ?? 0))
