 # AITmarks · AI 书签助手

 AITmarks 是一款面向浏览器的开源书签助手，能够自动解析当前网页、调用主流 AI 模型生成标签建议，并与自建书签服务保持双向同步。项目基于 Manifest V3，采用 React + TypeScript 架构，可轻松扩展 AI 提供商与后端书签 API。

 ![Popup Preview](docs/assets/popup-preview.png)

 ## ✨ 功能亮点

 - **AI 智能标签**：支持 OpenAI、Anthropic、DeepSeek、智谱、硅基流动等模型，实时生成高质量标签。
 - **标签库复用**：自动关联历史标签，支持自定义颜色、排序与搜索，避免标签过载。
 - **本地缓存与离线支持**：使用 Dexie（IndexedDB）缓存最新书签与标签，断网时仍可浏览与编辑。
 - **多书签服务兼容**：默认适配 TMarks API，第三方只需实现统一的 CRUD/批量接口即可接入。
 - **现代 UI/UX**：TailwindCSS + 自定义动画，响应式布局、暗色模式与键盘快捷操作。
 - **Manifest V3 架构**：Popup/Options/Background/ContentScript 模块化设计，方便维护与扩展。

 ## 🧱 架构总览

 ```
 src/
 ├─ popup/        # 弹窗主界面（AI 推荐、标签选择、保存书签）
 ├─ options/      # 配置页面（AI 提供商、书签 API、偏好设置）
 ├─ background/   # 后台逻辑（同步、通知、定时任务）
 ├─ content/      # 内容脚本（抓取当前标签页信息）
 └─ lib/
    ├─ api/       # TMarksClient 及第三方 API 适配
    ├─ store/     # Zustand 状态管理
    ├─ services/  # 业务逻辑（AI 推荐、同步、缓存）
    ├─ db/        # Dexie 数据层
    └─ utils/     # 工具方法、类型定义
 ```

 ## 🛠️ 环境要求

 - Node.js ≥ 18（推荐 LTS）
 - npm ≥ 9（或使用 pnpm/yarn，自行替换指令）
 - Chrome / Edge ≥ 120（完整支持 Manifest V3）

 ## 🚀 快速开始

 ```bash
 # 克隆仓库
 git clone https://github.com/your-org/aitmarks.git
 cd aitmarks

 # 安装依赖
 npm install

 # 开发模式（Vite HMR）
 npm run dev

 # 生产构建
 npm run build

 # （可选）本地预览构建结果
 npm run preview
 ```

 构建产物位于 `dist/`，可通过以下步骤加载为「未打包扩展程序」：

 1. 在浏览器地址栏输入 `chrome://extensions/`
 2. 打开右上角「开发者模式」
 3. 点击「加载已解压的扩展程序」
 4. 选择项目根目录下的 `dist/`

 ## ⚙️ 初始配置

 首次使用需在 Options 页面完成以下设置：

 1. **AI 服务**
    - 选择模型提供商，输入对应的 API Key / Base URL
    - 可保存多组配置并一键切换
 2. **书签站点**
    - 默认基址：`https://tmarks.669696.xyz/api`
    - 填写自建站点的 API Key，即可完成读写授权
    - 支持替换为自定义后端，只需遵循 [`docs/TMarks_API_客户端使用文档.md`](docs/TMarks_API_客户端使用文档.md)
 3. **偏好设置**
    - 主题（亮色 / 暗色 / 跟随系统）
    - 同步间隔、自动保存策略等

 完成配置后，点击扩展图标即可：AITmarks 会自动抓取页面元信息，生成标签建议，并在你确认后同步到书签服务。

 ## 🧠 可插拔设计

 | 模块 | 默认实现 | 扩展方式 |
 |------|----------|----------|
 | AI 模型 | OpenAI / Anthropic / DeepSeek 等 | 在 `lib/providers` 添加新适配器，实现统一的 `generateTags()` 接口 |
 | 书签 API | TMarksClient | 按 `TMarksClient` 的接口约束，实现自定义客户端并注入 |

 更多内核说明与 API 细节请参阅：

 - [`SDK.md`](SDK.md) – 插件组件之间的流程、状态与服务说明
 - [`docs/TMarks_API_客户端使用文档.md`](docs/TMarks_API_客户端使用文档.md) – 第三方书签站点需要提供的接口规范

 ## 📦 常用脚本

 | 命令 | 说明 |
 |------|------|
 | `npm run dev` | 启动开发服务器（Vite） |
 | `npm run build` | TypeScript 编译 + Vite 构建 |
 | `npm run preview` | 预览打包结果 |
 | `npm run icons` | 生成/更新扩展图标（依赖 `scripts/generate-icons.mjs`） |

 > 项目暂未集成自动化测试，可依据需求接入 Vitest / Jest。

 ## 🧪 手动验证流程

 1. 执行 `npm run build` 确保编译通过
 2. 在 Chrome 开发者模式加载 `dist/`
 3. 在 Options 页面配置 AI 与书签 API
 4. 访问任意网页 → 打开 Popup → 选择/编辑标签 → 保存书签
 5. 在后端书签服务中确认数据同步是否成功

 ## 🤝 贡献指南

 欢迎提交 PR 与 Issue！建议流程：

 1. Fork 仓库并创建特性分支（`feature/**`）
 2. `npm run dev` 本地验证功能、`npm run build` 确认通过
 3. 保持代码风格（Tailwind、函数式组件、TypeScript 严格类型）
 4. PR 中说明变更内容、测试方式与潜在影响

 如需讨论 Roadmap 或重要特性，欢迎在 Issue 中发起讨论或提交 RFC。

 ## 🗺️ Roadmap（节选）

 - [ ] 引入自动化测试与 CI/CD
 - [ ] Web 端书签管理面板
 - [ ] 配置导入/导出与团队共享
 - [ ] 更完善的键盘快捷键与无障碍支持

 欢迎在 Issue 中补充你的需求或想法。

 ## 📄 许可证

 本项目采用 **ISC License**，在遵循许可的前提下你可以自由使用、修改与分发。如需商业合作或定制化支持，请联系维护者。

 ---

 如果 AITmarks 对你有所帮助，欢迎 Star ⭐️、分享，或提交你的第一条贡献！
