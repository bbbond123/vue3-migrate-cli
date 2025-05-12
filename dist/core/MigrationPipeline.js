"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const p_queue_1 = __importDefault(require("p-queue"));
const ora_1 = __importDefault(require("ora"));
async function migrate(inputPath, options) {
    const pipeline = new MigrationPipeline(options);
    pipeline.registerPlugin(require('../plugins/codemodsPlugin').default);
    pipeline.registerPlugin(require('../plugins/aiPlugin').default);
    pipeline.registerPlugin(require('../plugins/eslintPlugin').default);
    pipeline.registerPlugin(require('../plugins/prettierPlugin').default);
    pipeline.registerPlugin(require('../plugins/residualApiPlugin').default);
    const queue = new p_queue_1.default({ concurrency: 4 });
    const report = [];
    const files = await getVueFiles(inputPath);
    const tasks = files.map(file => async () => {
        const spinner = (0, ora_1.default)(`迁移 ${file}`).start();
        try {
            const content = await pipeline.run(file);
            const outputPath = options.output ? path.join(options.output, path.relative(inputPath, file)) : file;
            if (options.dryRun) {
                spinner.info(`Diff for ${file}:\n${content}`);
            }
            else {
                await fs.mkdir(path.dirname(outputPath), { recursive: true });
                await fs.writeFile(outputPath, content);
            }
            spinner.succeed(`完成 ${file}`);
            return { file, status: 'success' };
        }
        catch (error) {
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
class MigrationPipeline extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.plugins = [];
    }
    registerPlugin(plugin) {
        this.plugins.push(plugin);
    }
    async run(filePath) {
        let content = await fs.readFile(filePath, 'utf-8');
        for (const plugin of this.plugins) {
            content = await plugin.process(content, filePath, this.options);
            this.emit('pluginComplete', plugin.name);
        }
        return content;
    }
}
async function getVueFiles(inputPath) {
    return new Promise((resolve, reject) => {
        //@ts-ignore
        (0, glob_1.glob)(inputPath.endsWith('.vue') ? inputPath : `${inputPath}/**/*.vue`, (err, files) => {
            if (err)
                reject(err);
            else
                resolve(files);
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
//# sourceMappingURL=MigrationPipeline.js.map