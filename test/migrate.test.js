const { migrate } = require('../src/core/MigrationPipeline.js');
const fs = require('fs').promises;
const path = require('path');

describe('vue3-migrate', () => {
  beforeEach(async () => {
    await fs.mkdir('test/tmp', { recursive: true });
    await fs.writeFile('test/tmp/MyComponent.vue', `
      <script>
      export default {
        data() { return { count: 0 }; },
        methods: { increment() { this.count++; } }
      };
      </script>
      <template><div><p>{{ count }}</p><button @click="increment">增加</button></div></template>
    `);
  });

  afterEach(async () => {
    await fs.rm('test/tmp', { recursive: true, force: true });
  });

  it('migrates Vue 2 to Vue 3 with TypeScript', async () => {
    process.env.OPENAI_API_KEY = 'test-key'; // Mock API key
    const report = await migrate('test/tmp/MyComponent.vue', {
      ai: true,
      ts: true,
      validateAi: true,
      output: 'test/tmp/output',
    });
    const output = await fs.readFile('test/tmp/output/MyComponent.vue', 'utf-8');
    expect(output).toContain('<script setup lang="ts">');
    expect(output).toContain('ref<number>');
    expect(report[0].status).toBe('success');
  });
});