
##### `docs/ROADMAP.md`
```markdown
# 项目路线图

## ✅ 已完成
- [x] 支持 Vue 2 → Vue 3 迁移流程。
- [x] 实现插件化架构（`codemods`、`ai`、`eslint`、`prettier`）。
- [x] 支持 `<script setup lang="ts">`。
- [x] 集成 OpenAI API 转换，添加缓存和注释保留。
- [x] 实现 `--validate-ai` 校验输出结构。

## 🚧 进行中（优先级高）
- [ ] 扩展单元测试覆盖（优化 `test/migrate.test.js` 或迁移到 Vitest）。
- [ ] 实现插件系统并发处理（使用 `PQueue` 优化批量迁移）。
- [ ] 开发 AI 辅助的自动生成 Vitest 单测功能。

## 📌 计划中（待讨论）
- [ ] 支持多语言提示词（`--lang en/zh`）。
- [ ] 抽象提示词到 `src/prompts` 模块。
- [ ] 支持多 AI 提供者（OpenAI、Grok、local model）。
- [ ] 开发 Web UI 展示迁移报告仪表盘（低优先级）。

## 贡献
欢迎提出建议或提交 PR，参见 [CONTRIBUTING.md](../CONTRIBUTING.md)。