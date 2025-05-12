import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import {glob} from 'glob';
import PQueue from 'p-queue';
import ora from 'ora';

interface MigrationOptions {
  eslint?: boolean;
  vite?: boolean;
  ai?: boolean;
  ts?: boolean;
  strictTs?: boolean;
  initTsconfig?: boolean;
  validateAi?: boolean;
  report?: boolean;
  dryRun?: boolean;
  output?: string;
}

interface MigrationPlugin {
  name: string;
  process: (content: string, filePath: string, options: MigrationOptions) => Promise<string>;
}

export async function migrate(inputPath: string, options: MigrationOptions) {
  const pipeline = new MigrationPipeline(options);
  pipeline.registerPlugin(require('../plugins/codemodsPlugin').default);
  pipeline.registerPlugin(require('../plugins/aiPlugin').default);
  pipeline.registerPlugin(require('../plugins/eslintPlugin').default);
  pipeline.registerPlugin(require('../plugins/prettierPlugin').default);
  pipeline.registerPlugin(require('../plugins/residualApiPlugin').default);

  const queue = new PQueue({ concurrency: 4 });
  const report: { file: string; status: string; error?: string }[] = [];
  const files = await getVueFiles(inputPath);

  const tasks = files.map(file => async () => {
    const spinner = ora(`迁移 ${file}`).start();
    try {
      const content = await pipeline.run(file);
      const outputPath = options.output ? path.join(options.output, path.relative(inputPath, file)) : file;
      if (options.dryRun) {
        spinner.info(`Diff for ${file}:\n${content}`);
      } else {
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, content);
      }
      spinner.succeed(`完成 ${file}`);
      return { file, status: 'success' };
    } catch (error) {
      //@ts-ignore
      spinner.fail(`失败 ${file}: ${error.message}`);
      //@ts-ignore
      return { file, status: 'failed', error: error.message };
    }
  });

  report.push(...(await queue.addAll(tasks)));

  if (options.vite) {
    const viteConfig = `import { defineConfig } from 'vite';import vue from '@vitejs/plugin-vue';export default defineConfig({plugins: [vue()], resolve: {alias: {'@': '/src'}}});`;
    const viteConfigPath = (options.ts || options.strictTs) ? 'vite.config.ts' : 'vite.config.js';
    await fs.writeFile(viteConfigPath, viteConfig);
    console.log(`生成 ${viteConfigPath}`);
  }

  if (options.ts || options.strictTs || options.initTsconfig) {
    await generateTsConfig();
  }

  if (options.report) {
    const successCount = report.filter(r => r.status === 'success').length;
    console.log(`
迁移报告：
- 总文件数：${report.length}
- 成功：${successCount}
- 失败：${report.length - successCount}
${report.map(r => `${r.file}：${r.status}${r.error ? ` (${r.error})` : ''}`).join('\n')}
    `);
  }

  return report;
}

class MigrationPipeline extends EventEmitter {
  options: MigrationOptions;
  plugins: MigrationPlugin[];

  constructor(options: MigrationOptions) {
    super();
    this.options = options;
    this.plugins = [];
  }

  registerPlugin(plugin: MigrationPlugin) {
    this.plugins.push(plugin);
  }

  async run(filePath: string): Promise<string> {
    let content = await fs.readFile(filePath, 'utf-8');
    for (const plugin of this.plugins) {
      content = await plugin.process(content, filePath, this.options);
      this.emit('pluginComplete', plugin.name);
    }
    return content;
  }
}

async function getVueFiles(inputPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    //@ts-ignore
    glob(inputPath.endsWith('.vue') ? inputPath : `${inputPath}/**/*.vue`, (err , files) =>{
      if (err) reject(err);
      else resolve(files);
    });
  });
}

async function generateTsConfig() {
  const tsConfig = {
    compilerOptions: {
      target: 'esnext',
      module: 'esnext',
      strict: true,
      jsx: 'preserve',
      moduleResolution: 'node',
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      baseUrl: '.',
      paths: { '@/*': ['src/*'] },
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };
  await fs.writeFile('tsconfig.json', JSON.stringify(tsConfig, null, 2));
  console.log('生成 tsconfig.json');
}