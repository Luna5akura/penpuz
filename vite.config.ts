import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { watch, existsSync, type FSWatcher } from 'node:fs'
import { spawn } from 'node:child_process'

// 仅在 vite preview（systemd 服务）中启用：监听源码变化，自动构建部署。
// vite preview 按请求从磁盘读取产物，重建后无需重启服务。
function autoDeployPlugin(): Plugin {
  const root = path.resolve(__dirname)
  const deployScript = path.join(root, 'scripts', 'deploy.sh')

  let timer: ReturnType<typeof setTimeout> | null = null
  let running = false
  let pending = false
  const watchers: FSWatcher[] = []

  function schedule() {
    if (running) {
      pending = true
      return
    }
    if (timer) clearTimeout(timer)
    timer = setTimeout(run, 1000)
  }

  function run() {
    running = true
    pending = false
    const child = spawn('sh', [deployScript], { cwd: root, stdio: 'inherit' })
    child.on('exit', (code) => {
      running = false
      console.log(`[auto-deploy] 部署结束 (exit ${code})`)
      if (pending) run()
    })
  }

  // 递归监听目录（编辑器原子保存/深层文件都能触发；目录被删后自动重新挂载）
  function addRecursive(sub: string) {
    const target = path.join(root, sub)
    let w: FSWatcher
    try {
      w = watch(target, { recursive: true }, (_event, filename) => {
        console.log(`[auto-deploy] 变更: ${sub}/${String(filename ?? '')}`)
        schedule()
      })
    } catch {
      setTimeout(() => addRecursive(sub), 3000)
      return
    }
    watchers.push(w)
    w.on('error', () => {
      w.close()
      setTimeout(() => addRecursive(sub), 3000)
    })
    w.on('rename', () => {
      if (!existsSync(target)) {
        w.close()
        setTimeout(() => addRecursive(sub), 3000)
      }
    })
  }

  // 监听仓库根目录（非递归），只关心这两个文件，避免 dist/node_modules 干扰
  const rootFiles = new Set(['index.html', 'vite.config.ts'])
  function addRootWatch() {
    const w = watch(root, (_event, filename) => {
      const name = String(filename ?? '')
      if (rootFiles.has(name)) {
        console.log(`[auto-deploy] 变更: ${name}`)
        schedule()
      }
    })
    watchers.push(w)
    w.on('error', () => {
      w.close()
      setTimeout(addRootWatch, 3000)
    })
  }

  return {
    name: 'auto-deploy',
    configurePreviewServer() {
      addRecursive('src')
      addRecursive('public')
      addRootWatch()
      console.log('[auto-deploy] 已启用：监听 src/ public/ index.html vite.config.ts')
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), autoDeployPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
})
