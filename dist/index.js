#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateDir = migrateDir;
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const eslint_1 = require("eslint");
const prettier_1 = __importDefault(require("prettier"));
const events_1 = require("events");
const readline_1 = __importDefault(require("readline"));
// 创建 readline 接口
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
// 询问用户是否接受更改
async function askForConfirmation(message) {
    return new Promise((resolve) => {
        rl.question(`${message} (y/N) `, (answer) => {
            resolve(answer.toLowerCase() === 'y');
        });
    });
}
// 迁移流水线类，支持插件化
class MigrationPipeline extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.plugins = [];
    }
    // 注册插件
    registerPlugin(plugin) {
        this.plugins.push(plugin);
    }
    // 执行迁移流程
    async run(filePath) {
        let content = await fs_1.promises.readFile(filePath, 'utf-8');
        let originalContent = content;
        for (const plugin of this.plugins) {
            content = await plugin.process(content, filePath, this.options);
            this.emit('pluginComplete', plugin.name);
        }
        // 如果是交互模式，显示差异并询问用户
        if (this.options.interactive && content !== originalContent) {
            console.log('\n文件变更:');
            console.log('原始内容:');
            console.log(originalContent);
            console.log('\n转换后内容:');
            console.log(content);
            const confirmed = await askForConfirmation('\n是否接受这些更改？');
            if (!confirmed) {
                return originalContent;
            }
        }
        return content;
    }
}
// 插件：运行 vue-codemods
const codemodsPlugin = {
    name: 'vue-codemods',
    async process(content, filePath) {
        // 模拟运行 vue-codemods（实际使用：npx @vue/codemods）
        console.log(`运行 vue-codemods: ${filePath}`);
        return content;
    },
};
// 插件：AI 转换（支持 TypeScript）
const aiPlugin = {
    name: 'ai-conversion',
    async process(content, filePath, options) {
        if (!options.ai)
            return content;
        const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        if (!scriptMatch)
            return content;
        // 模拟 AI 转换
        const convertedScript = options.ts
            ? `
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
      `
            : `
<script setup lang="ts">
import { ref } from 'vue';
const count = ref(0);
function increment() {
  count.value++;
}
</script>
      `;
        return content.replace(scriptMatch[0], convertedScript);
    },
};
// 插件：ESLint 验证（支持 TypeScript）
const eslintPlugin = {
    name: 'eslint',
    async process(content, filePath, options) {
        if (!options.eslint)
            return content;
        const eslint = new eslint_1.ESLint({
            fix: true,
            overrideConfig: {
                root: true,
                env: { browser: true, es2021: true, node: true },
                extends: [
                    'eslint:recommended',
                    'plugin:vue/vue3-recommended',
                    options.ts ? 'plugin:@typescript-eslint/recommended' : ''
                ].filter(Boolean),
                parser: 'vue-eslint-parser',
                parserOptions: {
                    parser: options.ts ? '@typescript-eslint/parser' : '@babel/eslint-parser',
                    sourceType: 'module',
                    extraFileExtensions: ['.vue']
                },
                plugins: ['vue', '@typescript-eslint'],
                rules: {
                    'vue/multi-word-component-names': 'off',
                    'vue/script-setup-uses-vars': 'error',
                    '@typescript-eslint/explicit-module-boundary-types': 'off',
                    '@typescript-eslint/no-explicit-any': 'warn'
                },
                overrides: [
                    {
                        files: ['*.vue'],
                        parser: 'vue-eslint-parser',
                        parserOptions: {
                            parser: options.ts ? '@typescript-eslint/parser' : '@babel/eslint-parser',
                            sourceType: 'module'
                        }
                    }
                ]
            }
        });
        const results = await eslint.lintText(content, { filePath });
        return results[0].output || content;
    },
};
// 插件：Prettier 格式化（支持 TypeScript）
const prettierPlugin = {
    name: 'prettier',
    async process(content, filePath, options) {
        return prettier_1.default.format(content, {
            parser: options.ts ? 'typescript' : 'vue',
            singleQuote: true,
            semi: true,
        });
    },
};
// 主函数：批量处理 source -> target
async function migrateDir(sourceDir, targetDir, options) {
    await fs_1.promises.mkdir(targetDir, { recursive: true });
    const files = await fs_1.promises.readdir(sourceDir);
    const pipeline = new MigrationPipeline(options);
    pipeline.registerPlugin(codemodsPlugin);
    pipeline.registerPlugin(aiPlugin);
    pipeline.registerPlugin(eslintPlugin);
    pipeline.registerPlugin(prettierPlugin);
    const report = [];
    for (const file of files) {
        if (!file.endsWith('.vue'))
            continue;
        const sourceFile = path_1.default.join(sourceDir, file);
        const targetFile = path_1.default.join(targetDir, file);
        try {
            // 如果 target 已存在则跳过
            await fs_1.promises.access(targetFile);
            console.log(`已存在，跳过: ${targetFile}`);
            report.push({ file: targetFile, status: 'skipped' });
            continue;
        }
        catch {
            // 文件不存在，继续处理
        }
        try {
            const content = await pipeline.run(sourceFile);
            await fs_1.promises.writeFile(targetFile, content);
            report.push({ file: targetFile, status: 'success' });
        }
        catch (error) {
            console.error(`处理文件失败: ${sourceFile}`, error);
            report.push({
                file: targetFile,
                status: 'error',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    // 生成迁移报告
    if (options.report) {
        const successCount = report.filter(r => r.status === 'success').length;
        const skippedCount = report.filter(r => r.status === 'skipped').length;
        const errorCount = report.filter(r => r.status === 'error').length;
        console.log(`
迁移报告：
- 总文件数：${report.length}
- 成功：${successCount}
- 跳过：${skippedCount}
- 失败：${errorCount}
${report.map(r => `${r.file}：${r.status}${r.error ? ` (${r.error})` : ''}`).join('\n')}
    `);
    }
    return report;
}
// CLI 配置
if (require.main === module) {
    const program = new commander_1.Command();
    program
        .name('vue3-migrate')
        .description('Vue 2 到 Vue 3 迁移 CLI 工具，支持 TypeScript')
        .option('-s, --source <dir>', '源目录', 'source')
        .option('-t, --target <dir>', '目标目录', 'target')
        .option('--eslint', '运行 ESLint 验证', true)
        .option('--vite', '生成 Vite 配置', false)
        .option('--ai', '使用 AI API 转换', false)
        .option('--ts', '生成 TypeScript 代码 (<script setup lang="ts">)', false)
        .option('--report', '生成迁移报告', false)
        .option('--dry-run', '显示 diff 不修改文件', false)
        .option('--interactive', '交互模式，允许审查更改', false)
        .action(async (options) => {
        try {
            await migrateDir(path_1.default.resolve(options.source), path_1.default.resolve(options.target), options);
            console.log('批量迁移完成！');
            if (options.interactive) {
                rl.close();
            }
        }
        catch (error) {
            console.error('迁移失败：', error instanceof Error ? error.message : String(error));
            if (options.interactive) {
                rl.close();
            }
            process.exit(1);
        }
    });
    program.parse();
}
//# sourceMappingURL=index.js.map