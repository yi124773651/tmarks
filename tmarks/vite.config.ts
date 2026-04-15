import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath } from 'node:url'
import viteCompression from 'vite-plugin-compression'
// import { visualizer } from 'rollup-plugin-visualizer'
// import JavaScriptObfuscator from 'javascript-obfuscator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 自定义代码混淆插件
// function obfuscatorPlugin(): Plugin {
//   return {
//     name: 'vite-plugin-obfuscator-custom',
//     enforce: 'post',
//     apply: 'build',
//     generateBundle(options, bundle) {
//       for (const key in bundle) {
//         const chunk = bundle[key]
//         if (chunk.type === 'chunk' && chunk.fileName.endsWith('.js')) {
//           // 混淆代码
//           const obfuscationResult = JavaScriptObfuscator.obfuscate(chunk.code, {
//             // 压缩代码
//             compact: true,
//             // 控制流平坦化（破坏程序结构）
//             controlFlowFlattening: true,
//             controlFlowFlatteningThreshold: 0.75,
//             // 死代码注入
//             deadCodeInjection: true,
//             deadCodeInjectionThreshold: 0.4,
//             // 调试保护（防止使用开发者工具）
//             debugProtection: false,
//             debugProtectionInterval: 0,
//             // 禁用控制台输出
//             disableConsoleOutput: true,
//             // 标识符名称生成器
//             identifierNamesGenerator: 'hexadecimal',
//             log: false,
//             // 标识符前缀
//             identifiersPrefix: '',
//             // 重命名全局变量
//             renameGlobals: false,
//             // 自我防护
//             selfDefending: true,
//             // 字符串数组编码
//             stringArray: true,
//             stringArrayCallsTransform: true,
//             stringArrayCallsTransformThreshold: 0.75,
//             stringArrayEncoding: ['base64'],
//             stringArrayIndexShift: true,
//             stringArrayRotate: true,
//             stringArrayShuffle: true,
//             stringArrayWrappersCount: 2,
//             stringArrayWrappersChainedCalls: true,
//             stringArrayWrappersParametersMaxCount: 4,
//             stringArrayWrappersType: 'function',
//             stringArrayThreshold: 0.75,
//             // 转换对象键
//             transformObjectKeys: true,
//             // Unicode转义序列
//             unicodeEscapeSequence: false,
//           })

//           chunk.code = obfuscationResult.getObfuscatedCode()
//         }
//       }
//     },
//   }
// }

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  // const enableObfuscation = isProduction && env.VITE_ENABLE_OBFUSCATION === 'true'

  return {
    plugins: [
      react(),
      // 生产环境启用压缩
      isProduction && viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
      }),
      isProduction && viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      // 可选插件配置（需要时取消注释）:
      // - 代码混淆: enableObfuscation && obfuscatorPlugin()
      // - 构建分析: visualizer({ filename: './dist/stats.html' })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './shared'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
    build: {
      // 生产环境优化
      minify: 'terser',
      terserOptions: {
        compress: {
          // 删除 console
          drop_console: true,
          // 删除 debugger
          drop_debugger: true,
          // 移除未使用的代码
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        },
        format: {
          // 删除注释
          comments: false,
        },
        mangle: {
          // 混淆变量名
          toplevel: true,
        },
      },
      // 分块策略
      rollupOptions: {
        output: {
          // 手动分块
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'query-vendor': ['@tanstack/react-query', '@tanstack/react-virtual'],
            'utils': ['date-fns', 'zustand'],
          },
          // 文件名混淆
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // 增加分块大小警告阈值
      chunkSizeWarningLimit: 1000,
      // 启用源码映射（仅用于错误追踪，不暴露源码）
      sourcemap: false,
    },
  }
})
