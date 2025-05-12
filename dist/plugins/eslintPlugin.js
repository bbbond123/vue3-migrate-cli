"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eslint_1 = require("eslint");
const eslintPlugin = {
    name: 'eslint',
    async process(content, filePath, options) {
        if (!options.eslint)
            return content;
        const eslint = new eslint_1.ESLint({
            fix: true,
            overrideConfig: {
                env: { browser: true, es2021: true },
                parser: options.ts || options.strictTs ? '@typescript-eslint/parser' : 'vue-eslint-parser',
                parserOptions: {
                    parser: options.ts || options.strictTs ? '@typescript-eslint/parser' : '@babel/eslint-parser',
                    sourceType: 'module',
                },
                plugins: ['vue', '@typescript-eslint'],
                extends: [
                    'plugin:vue/vue3-recommended',
                    'eslint:recommended',
                    options.ts || options.strictTs ? 'plugin:@typescript-eslint/recommended' : '',
                ].filter(Boolean),
                rules: {
                    'vue/multi-word-component-names': 'off',
                    '@typescript-eslint/explicit-module-boundary-types': 'off',
                },
            },
        });
        const results = await eslint.lintText(content, { filePath });
        return results[0].output || content;
    },
};
exports.default = eslintPlugin;
//# sourceMappingURL=eslintPlugin.js.map