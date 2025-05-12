# Vue 3 Migration CLI

A command-line tool for migrating Vue 2 components to Vue 3, with TypeScript support.

## Features

- Convert Vue 2 components to Vue 3 Composition API
- Support for TypeScript and `<script setup lang="ts">`
- AI-powered code conversion
- ESLint validation with TypeScript support
- Prettier formatting
- Interactive mode for reviewing changes
- Migration report generation
- Vite configuration generation

## Installation

```bash
npm install -g vue3-migrate-cli
```

## Usage

```bash
# Basic usage
vue3-migrate -s source -t target

# With TypeScript support
vue3-migrate -s source -t target --ts

# With AI conversion
vue3-migrate -s source -t target --ts --ai

# Interactive mode
vue3-migrate -s source -t target --ts --interactive

# Generate Vite config
vue3-migrate -s source -t target --ts --vite

# Show migration report
vue3-migrate -s source -t target --ts --report
```

## Options

- `-s, --source <dir>`: Source directory (default: 'source')
- `-t, --target <dir>`: Target directory (default: 'target')
- `--eslint`: Run ESLint validation (default: true)
- `--vite`: Generate Vite configuration (default: false)
- `--ai`: Use AI API for conversion (default: false)
- `--ts`: Generate TypeScript code with `<script setup lang="ts">` (default: false)
- `--report`: Generate migration report (default: false)
- `--dry-run`: Show diff without modifying files (default: false)
- `--interactive`: Interactive mode for reviewing changes (default: false)

## Example

Input (Vue 2 component):
```vue
<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

Output (Vue 3 component with TypeScript):
```vue
<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  initialCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialCount: 0
});

const count = ref<number>(props.initialCount);

const increment = (): void => {
  count.value++;
};
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Run tests:
   ```bash
   npm test
   ```


## 📄 文档与设计讨论
- [迁移策略](docs/MIGRATION_STRATEGY.md) - Grok × GPT-4o 协作制定的迁移流程。
- [AI 插件设计](docs/AI_PLUGIN_DESIGN.md) - 详细记录 `aiPlugin.ts` 的实现与优化。
- [路线图](docs/ROADMAP.md) - 项目未来发展计划，欢迎社区反馈。

## 安装与使用
```bash
npm install
export OPENAI_API_KEY=sk-...
ts-node bin/cli.ts -i src/**/*.vue --ai --ts --validate-ai --output out

## License

ISC 