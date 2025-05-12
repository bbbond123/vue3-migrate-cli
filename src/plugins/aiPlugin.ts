import OpenAI from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import * as fs from 'fs/promises';
import NodeCache from 'node-cache';

interface MigrationOptions {
  ai?: boolean;
  ts?: boolean;
  strictTs?: boolean;
  validateAi?: boolean;
}

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 缓存实例，设置 1 小时过期
const cache = new NodeCache({ stdTTL: 3600 });

const aiPlugin = {
  name: 'ai-conversion',
  /**
   * 使用 OpenAI API 将 Vue 2 Options API 转换为 Vue 3 Composition API (<script setup lang="ts">)
   * @param content - 输入的 .vue 文件内容
   * @param filePath - 文件路径
   * @param options - 迁移选项
   * @returns 转换后的内容
   */
  async process(content: string, filePath: string, options: MigrationOptions): Promise<string> {
    if (!options.ai) return content;

    // 提取 <script> 部分
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch || !scriptMatch[1].trim()) {
      console.warn(`🔍 未找到 <script> 块，跳过文件：${filePath}`);
      return content;
    }

    const scriptContent = scriptMatch[1].trim();
    const cacheKey = `ai:${filePath}:${scriptContent}`; // 缓存键

    // 检查缓存
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 使用缓存结果：${filePath}`);
      return content.replace(scriptMatch[0], cachedResult as string);
    }

    // 提取注释
    const comments = scriptContent.match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || [];

    // 构造 AI 提示词
    const prompt = `
将以下 Vue 2 Options API 组件转换为 Vue 3 Composition API，使用 <script setup lang="ts">。
* 使用 defineProps 和 defineEmits 定义 props 和 emits。
* 所有变量、props、emits 和函数都要添加 TypeScript 类型注解（如 ref<number>(0), const increment: () => void）。
* 保留计算属性、方法、watch、生命周期钩子和业务逻辑。
* 修复不兼容的 API（如 $on、filters、Vue.set）。
* 保留原有的注释（插入到转换后的代码中）。
* 输出格式仅包含转换后的 <script setup lang="ts"> 内容，不包含 template。

输入：
${scriptContent}
    `;

    let convertedScript = '';
    try {
      // 调用 OpenAI API（兼容 v4.9.0+）
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.2,
      });

      convertedScript = response.choices?.[0]?.message?.content?.trim() || '';
      if (!convertedScript) {
        console.warn(`⚠️ AI 未返回内容 (${filePath})，跳过转换`);
        return content;
      }

      // 插入注释
      const finalScript = comments.length
        ? convertedScript.replace('<script setup lang="ts">', `<script setup lang="ts">\n${comments.join('\n')}\n`)
        : convertedScript;

      // 缓存结果
      cache.set(cacheKey, finalScript);

      // 验证 AI 输出（如果启用 --validate-ai）
      if (options.validateAi) {
        const warnings: string[] = [];

        if (!finalScript.includes('<script setup lang="ts">')) {
          warnings.push('未包含 <script setup lang="ts">');
        }
        if (!/defineProps|defineEmits/.test(finalScript)) {
          warnings.push('未使用 defineProps 或 defineEmits');
        }
        if ((options.ts || options.strictTs) && !/:\s*(number|string|boolean|void)/.test(finalScript)) {
          warnings.push('缺少类型注解');
        }

        if (warnings.length > 0) {
          console.warn(`⚠️ AI 输出验证失败 (${filePath}):`);
          warnings.forEach((msg) => console.warn(` - ${msg}`));
          return content; // 回退到原内容
        }
      }

      // 替换原有 <script> 块
      return content.replace(scriptMatch[0], finalScript);
    } catch (err: any) {
      console.error(`❌ AI 转换失败 (${filePath}): ${err.message}`);
      return content; // 出错时回退
    }
  },
};

export default aiPlugin;