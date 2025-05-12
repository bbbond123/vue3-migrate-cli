declare const eslintPlugin: {
    name: string;
    process(content: string, filePath: string, options: any): Promise<string>;
};
export default eslintPlugin;
