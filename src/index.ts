#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import url from 'url'
import cp from 'child_process'
import { Minimatch } from 'minimatch'

type Options = {
  projectName: string
  targetDir: string
  packageManager: 'pnpm' | 'npm' | 'yarn'
  installDeps: boolean
  initGit: boolean
}

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseArgs(argv: string[]): Options {
  let projectName = 'my-app'
  let targetDir = process.cwd()
  let packageManager: Options['packageManager'] = 'pnpm'
  let installDeps = false
  let initGit = false
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (!a) continue
    if (!a.startsWith('--')) {
      projectName = a
      continue
    }
    const [k, v] = a.split('=')
    switch (k) {
      case '--dir':
        targetDir = path.resolve(v ?? argv[++i] ?? '.')
        break
      case '--pm':
        {
          const pm = (v ?? argv[++i] ?? 'pnpm') as Options['packageManager']
          if (!['pnpm', 'npm', 'yarn'].includes(pm)) throw new Error(`Unsupported package manager: ${pm}`)
          packageManager = pm
        }
        break
      case '--install':
        installDeps = true
        break
      case '--git':
        initGit = true
        break
    }
  }
  return { projectName, targetDir, packageManager, installDeps, initGit }
}

const DEFAULT_IGNORES: string[] = []

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function shouldIgnore(relPath: string, ignoreGlobs: string[]): boolean {
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '')
  return ignoreGlobs.some((g) => new Minimatch(g, { dot: true }).match(normalized))
}

function copyDir(src: string, dst: string, ignoreGlobs: string[], relBase = '') {
  const entries = fs.readdirSync(src)
  for (const entry of entries) {
    const from = path.join(src, entry)
    const to = path.join(dst, entry)
    const rel = relBase ? path.join(relBase, entry) : entry
    if (shouldIgnore(rel, ignoreGlobs)) continue
    const st = fs.statSync(from)
    if (st.isDirectory()) {
      ensureDir(to)
      copyDir(from, to, ignoreGlobs, rel)
    } else {
      const content = fs.readFileSync(from)
      fs.writeFileSync(to, content)
    }
  }
}

function rewriteRootPackageJson(filePath: string, newName: string) {
  const pkg = readJson(filePath)
  pkg.name = newName
  // adjust scripts to new scoped names
  const scope = newName
  if (pkg.scripts && typeof pkg.scripts.dev === 'string') {
    pkg.scripts.dev = String(pkg.scripts.dev)
      .replaceAll('@app/server', `@${scope}/server`)
      .replaceAll('@app/web', `@${scope}/web`)
  }
  if (pkg.scripts && typeof pkg.scripts.build === 'string') {
    pkg.scripts.build = String(pkg.scripts.build)
      .replaceAll('@app/server', `@${scope}/server`)
      .replaceAll('@app/web', `@${scope}/web`)
  }
  writeJson(filePath, pkg)
}

function rewriteWorkspacePackages(rootDir: string, newScope: string) {
  const serverPkgPath = path.join(rootDir, 'apps', 'server', 'package.json')
  const webPkgPath = path.join(rootDir, 'apps', 'web', 'package.json')
  const contractsPkgPath = path.join(rootDir, 'packages', 'contracts', 'package.json')

  if (fs.existsSync(serverPkgPath)) {
    const pkg = readJson(serverPkgPath)
    pkg.name = `@${newScope}/server`
    if (pkg.dependencies?.['@contracts/core']) pkg.dependencies['@contracts/core'] = 'workspace:*'
    writeJson(serverPkgPath, pkg)
  }
  if (fs.existsSync(webPkgPath)) {
    const pkg = readJson(webPkgPath)
    pkg.name = `@${newScope}/web`
    if (pkg.dependencies) {
      if (pkg.dependencies['@app/server']) {
        // move dependency key to new scoped name
        const version = 'workspace:*'
        delete pkg.dependencies['@app/server']
        pkg.dependencies[`@${newScope}/server`] = version
      }
      if (pkg.dependencies['@contracts/core']) pkg.dependencies['@contracts/core'] = 'workspace:*'
    }
    writeJson(webPkgPath, pkg)
  }
  if (fs.existsSync(contractsPkgPath)) {
    const pkg = readJson(contractsPkgPath)
    pkg.name = '@contracts/core'
    writeJson(contractsPkgPath, pkg)
  }
}

function writeEnvExample(rootDir: string, dbName: string) {
  const lines = [
    `DATABASE_URL=postgres://postgres:postgres@localhost:5432/${dbName}`,
    'OPENROUTER_API_KEY=',
    'OPENROUTER_MODEL=openrouter/auto',
    'SERVER_PORT=8787',
    'APP_URL=http://localhost:5173',
    'NODE_ENV=development',
    'DATA_STORE=memory',
    '',
  ]
  const serverDir = path.join(rootDir, 'apps', 'server')
  fs.writeFileSync(path.join(serverDir, '.env.example'), lines.join('\n'))
}

function maybeInitGit(root: string) {
  if (!fs.existsSync(path.join(root, '.git'))) {
    cp.spawnSync('git', ['init'], { stdio: 'inherit', cwd: root })
  }
}

function maybeInstall(root: string, pm: Options['packageManager']) {
  const cmd = pm
  const args = pm === 'pnpm' ? ['install'] : pm === 'yarn' ? [] : ['install']
  cp.spawnSync(cmd, args, { stdio: 'inherit', cwd: root })
}

function sanitizeName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'my-app'
}

function rewriteImportsToScopedName(rootDir: string, scope: string) {
  const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'])
  function walk(current: string) {
    for (const entry of fs.readdirSync(current)) {
      const full = path.join(current, entry)
      const st = fs.statSync(full)
      if (st.isDirectory()) {
        // skip node_modules
        if (entry === 'node_modules') continue
        walk(full)
      } else {
        const lower = entry.toLowerCase()
        const hasExt = Array.from(exts).some((ext) => lower.endsWith(ext))
        if (!hasExt) continue
        const content = fs.readFileSync(full, 'utf8')
        if (content.includes("'@app/server'") || content.includes('"@app/server"')) {
          const next = content.replaceAll('@app/server', `@${scope}/server`)
          fs.writeFileSync(full, next)
        }
      }
    }
  }
  walk(rootDir)
}

function replacePlaceholders(rootDir: string, mapping: Record<string, string>) {
  const textExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yaml', '.yml', '.env', '.d.ts'])
  function walk(current: string) {
    for (const entry of fs.readdirSync(current)) {
      const full = path.join(current, entry)
      const st = fs.statSync(full)
      if (st.isDirectory()) {
        if (entry === 'node_modules') continue
        walk(full)
      } else {
        const lower = entry.toLowerCase()
        const hasExt = Array.from(textExts).some((ext) => lower.endsWith(ext))
        if (!hasExt) continue
        let content = fs.readFileSync(full, 'utf8')
        let changed = false
        for (const [k, v] of Object.entries(mapping)) {
          if (content.includes(k)) {
            content = content.split(k).join(v)
            changed = true
          }
        }
        if (changed) fs.writeFileSync(full, content)
      }
    }
  }
  walk(rootDir)
}

function main() {
  const opts = parseArgs(process.argv)
  const safeName = sanitizeName(opts.projectName)
  const scaffoldRoot = path.resolve(path.join(__dirname, '..', 'templates'))
  const outputRoot = path.resolve(path.join(opts.targetDir, safeName))

  if (fs.existsSync(outputRoot)) {
    // empty or remove directory contents to avoid mixing
    try {
      fs.rmSync(outputRoot, { recursive: true, force: true })
    } catch {}
  }
  ensureDir(outputRoot)

  const ignore = DEFAULT_IGNORES
  copyDir(scaffoldRoot, outputRoot, ignore)

  // rewrite placeholders and package names
  rewriteRootPackageJson(path.join(outputRoot, 'package.json'), safeName)
  rewriteWorkspacePackages(outputRoot, safeName)
  rewriteImportsToScopedName(outputRoot, safeName)
  // replace placeholders across text files
  replacePlaceholders(outputRoot, {
    '__PROJECT_NAME__': safeName,
    '__SCOPE__': safeName,
    '__DB_NAME__': safeName.replace(/[^a-z0-9]/g, '_'),
  })
  // write env example for server
  writeEnvExample(outputRoot, safeName.replace(/[^a-z0-9]/g, '_'))

  if (opts.initGit) maybeInitGit(outputRoot)
  if (opts.installDeps) maybeInstall(outputRoot, opts.packageManager)

  // done
  const rel = outputRoot
  console.log(`Created monorepo at: ${rel}`)
  console.log('Next steps:')
  console.log(`  1) cd ${rel}`)
  console.log(`  2) Copy apps/server/.env.example -> apps/server/.env and fill values`)
  console.log(`  3) ${opts.packageManager} install`)
  console.log('  4) Build contracts: pnpm --filter @contracts/core build')
  console.log('     Or watch during dev: pnpm --filter @contracts/core dev')
  console.log('     Tip: include contracts watch in root dev script to avoid missing dist')
  console.log('  5) Run: pnpm dev')
}

main()


