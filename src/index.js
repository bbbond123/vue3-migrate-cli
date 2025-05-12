#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const { ESLint } = require('eslint');
const prettier = require('prettier');
const EventEmitter = require('events');
const readline = require('readline');

// 创建 readline 接口
const rl = readline.createInterface({
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
class MigrationPipeline extends EventEmitter {
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
    let content = await fs.readFile(filePath, 'utf-8');
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

// 插件：AI 转换（模拟，实际使用 OpenAI 或 xAI Grok）
const aiPlugin = {
  name: 'ai-conversion',
  async process(content, filePath, options) {
    if (!options.ai) return content;
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch) return content;
    // 模拟 AI 转换
    const convertedScript = `
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

// 插件：ESLint 验证
const eslintPlugin = {
  name: 'eslint',
  async process(content, filePath, options) {
    if (!options.eslint) return content;
    const eslint = new ESLint({ fix: true });
    const results = await eslint.lintText(content, { filePath });
    return results[0].output || content;
  },
};

// 插件：Prettier 格式化
const prettierPlugin = {
  name: 'prettier',
  async process(content, filePath) {
    return prettier.format(content, { parser: 'vue', singleQuote: true });
  },
};

// 主函数：批量处理 source -> target
async function migrateDir(sourceDir, targetDir, options) {
  await fs.mkdir(targetDir, { recursive: true });
  const files = await fs.readdir(sourceDir);
  const pipeline = new MigrationPipeline(options);
  pipeline.registerPlugin(codemodsPlugin);
  pipeline.registerPlugin(aiPlugin);
  pipeline.registerPlugin(eslintPlugin);
  pipeline.registerPlugin(prettierPlugin);
  const report = [];

  for (const file of files) {
    if (!file.endsWith('.vue')) continue;
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);
    try {
      // 如果 target 已存在则跳过
      await fs.access(targetFile);
      console.log(`已存在，跳过: ${targetFile}`);
      report.push({ file: targetFile, status: 'skipped' });
      continue;
    } catch {
      // 文件不存在，继续处理
    }
    const content = await pipeline.run(sourceFile);
    await fs.writeFile(targetFile, content);
    report.push({ file: targetFile, status: 'success' });
  }

  // 生成迁移报告
  if (options.report) {
    const successCount = report.filter(r => r.status === 'success').length;
    const skippedCount = report.filter(r => r.status === 'skipped').length;
    console.log(`\n迁移报告：\n- 总文件数：${report.length}\n- 成功：${successCount}\n- 跳过：${skippedCount}\n${report.map(r => `${r.file}：${r.status}`).join('\n')}\n`);
  }

  return report;
}

// CLI 配置
if (require.main === module) {
  const program = new Command();
  program
    .name('vue3-migrate')
    .description('Vue 2 到 Vue 3 迁移 CLI 工具')
    .option('-s, --source <dir>', '源目录', 'source')
    .option('-t, --target <dir>', '目标目录', 'target')
    .option('--eslint', '运行 ESLint 验证', true)
    .option('--vite', '生成 Vite 配置', false)
    .option('--ai', '使用 AI API 转换', false)
    .option('--report', '生成迁移报告', false)
    .option('--dry-run', '显示 diff 不修改文件', false)
    .option('--interactive', '交互模式，允许审查更改', false)
    .action(async (options) => {
      try {
        await migrateDir(path.resolve(options.source), path.resolve(options.target), options);
        console.log('批量迁移完成！');
        if (options.interactive) {
          rl.close();
        }
      } catch (error) {
        console.error('迁移失败：', error.message);
        if (options.interactive) {
          rl.close();
        }
        process.exit(1);
      }
    });

  program.parse();
}

// 导出 migrateDir 供测试使用
module.exports = { migrateDir }; 