interface MigrationOptions {
    ai?: boolean;
    ts?: boolean;
    strictTs?: boolean;
    validateAi?: boolean;
}
declare const aiPlugin: {
    name: string;
    /**
     * 使用 OpenAI API 将 Vue 2 Options API 转换为 Vue 3 Composition API (<script setup lang="ts">)
     * @param content - 输入的 .vue 文件内容
     * @param filePath - 文件路径
     * @param options - 迁移选项
     * @returns 转换后的内容
     */
    process(content: string, filePath: string, options: MigrationOptions): Promise<string>;
};
export default aiPlugin;
