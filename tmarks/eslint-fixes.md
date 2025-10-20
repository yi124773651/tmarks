# ESLint 修复计划

## 需要修复的问题

### 1. 未使用的变量和导入
- [x] functions/api/bookmarks/[id].ts - 移除未使用的 Bookmark 类型
- [x] functions/api/v1/import.ts - 移除未使用的 ImportError 类型
- [ ] functions/api/v1/export.ts - 多个 any 类型需要修复
- [ ] functions/lib/import-export/exporters/json-exporter.ts - 未使用的变量
- [ ] functions/lib/import-export/parsers/html-parser.ts - 未使用的 folders 变量
- [ ] src/components/bookmarks/BookmarkTitleView.tsx - 未使用的 error 变量
- [ ] src/components/import-export/ImportSection.tsx - 未使用的 error 变量
- [ ] src/components/layout/MobileBottomNav.tsx - 未使用的变量
- [ ] vite.config.ts - 未使用的 Plugin 和 env 变量

### 2. any 类型问题
- [ ] functions/api/v1/export.ts - 11个 any 类型
- [ ] functions/api/v1/import.ts - 8个 any 类型
- [ ] functions/lib/error-handler.ts - 1个 any 类型
- [ ] functions/lib/import-export/exporters/html-exporter.ts - 6个 any 类型
- [ ] functions/lib/import-export/parsers/html-parser.ts - 2个 any 类型
- [ ] functions/lib/import-export/parsers/json-parser.ts - 16个 any 类型
- [ ] functions/lib/input-sanitizer.ts - 4个 any 类型
- [ ] functions/middleware/security.ts - 2个 any 类型
- [ ] shared/import-export-types.ts - 2个 any 类型
- [ ] src/hooks/useImportExport.ts - 2个 any 类型

### 3. 其他问题
- [ ] functions/api/v1/export.ts - case 语句中的词法声明
- [ ] functions/api/v1/import.ts - case 语句中的词法声明
- [ ] functions/lib/input-sanitizer.ts - 不必要的转义字符
- [ ] src/pages/share/PublicSharePage.tsx - React Hook 依赖警告

## 修复策略

1. **优先级1**: 移除未使用的导入和变量
2. **优先级2**: 修复 any 类型，使用具体类型
3. **优先级3**: 修复语法问题和警告
4. **优先级4**: 优化 React Hook 依赖

## 预期效果

修复后将：
- 提高代码类型安全性
- 减少潜在的运行时错误
- 改善代码可维护性
- 通过 ESLint 检查
