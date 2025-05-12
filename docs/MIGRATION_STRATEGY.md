# Vue 2 → Vue 3 Migration Strategy (Grok × GPT-4o)

## 核心原则
- **保守增量迁移**：逐步升级依赖和核心组件，降低风险。
- **Composition API 优先**：自动将 Vue 2 Options API 转换为 `<script setup lang="ts">`，支持保留 Options API。
- **AI 辅助**：利用 OpenAI GPT-4o 进行代码转换，结合缓存优化。
- **质量保证**：集成 `vue-codemods` 修复不兼容 API，`ESLint`（支持 TypeScript）验证，`Prettier` 格式化。
- **灵活性**：CLI 提供 `--dry-run`、`--validate-ai`、`--report` 等选项，适应不同需求。

## 迁移流程
1. **扫描**：识别项目中的 `.vue` 文件，支持 glob 模式（如 `src/**/*.vue`）。
2. **修复**：运行 `vue-codemods` 修正 Vue 2 遗留问题（如 `$on`、`Vue.set`）。
3. **AI 转换**：使用 `aiPlugin.ts` 生成 `<script setup lang="ts">`，支持缓存和注释保留。
4. **验证**：通过 `ESLint` 检查代码规范，`--validate-ai` 验证 AI 输出完整性。
5. **格式化**：使用 `Prettier` 统一代码风格。
6. **输出**：生成迁移报告和可选的 `vite.config.ts`。

## 技术栈
- 环境：Node.js, TypeScript
- 依赖：OpenAI SDK v4.9.0+, `node-cache`, `commander`, `eslint`, `prettier`
- 详情见 [AI_PLUGIN_DESIGN.md](AI_PLUGIN_DESIGN.md)

## 贡献
欢迎提交 Pull Request，详情见 [CONTRIBUTING.md](../CONTRIBUTING.md)。