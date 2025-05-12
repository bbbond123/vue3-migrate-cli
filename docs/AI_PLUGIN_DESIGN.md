# aiPlugin 插件设计 (AI 转换 Vue 组件)

## 功能概述
- **提取与转换**：从 `<script>` 提取 Vue 2 Options API，转换为 `<script setup lang="ts">`。
- **类型支持**：自动添加 TypeScript 类型注解（如 `ref<number>`、`defineProps<{ id: number }>()`）。
- **注释保留**：提取原 `<script>` 注释，插入新代码。
- **缓存机制**：使用 `node-cache` 避免重复 API 调用。
- **验证规则**：检查 `defineProps`、`defineEmits` 和类型注解。
- **错误处理**：API 出错时回退到原始内容。

## 使用方式
```bash
ts-node bin/cli.ts -i src/**/*.vue --ai --ts --validate-ai --output out