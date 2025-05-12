#!/usr/bin/env ts-node

import { Command } from 'commander';
import { migrate } from '../src/core/MigrationPipeline.js';

const program = new Command();
program
  .name('vue3-migrate')
  .description('Vue 2 到 Vue 3 迁移 CLI 工具，支持 TypeScript')
  .option('-i, --input <path>', '输入 .vue 文件或目录（支持 glob 模式）', 'src')
  .option('-o, --output <path>', '输出目录')
  .option('--eslint', '运行 ESLint 验证', true)
  .option('--vite', '生成 Vite 配置', false)
  .option('--ai', '使用 AI API 转换', false)
  .option('--ts', '生成 TypeScript 代码 (<script setup lang="ts">)', false)
  .option('--strict-ts', '生成严格 TypeScript 代码（强制类型注解）', false)
  .option('--init-tsconfig', '生成 tsconfig.json', false)
  .option('--validate-ai', '验证 AI 输出', false)
  .option('--report', '生成迁移报告', false)
  .option('--dry-run', '显示 diff 不修改文件', false)
  .action(async (options) => {
    try {
      await migrate(options.input, options);
      console.log('迁移完成！');
    } catch (error) {
      console.error('迁移失败：', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);