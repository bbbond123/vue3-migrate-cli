const fs = require('fs').promises;
const path = require('path');
const { migrate } = require('../src/index');

describe('Migration Tests', () => {
  const testDir = path.join(__dirname, 'fixtures');
  const outputDir = path.join(__dirname, 'output');

  beforeAll(async () => {
    // 创建测试目录
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    // 创建测试文件
    const testComponent = `
<template>
  <div>
    <p>{{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>
    `;
    await fs.writeFile(path.join(testDir, 'TestComponent.vue'), testComponent);
  });

  afterAll(async () => {
    // 清理测试文件
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  test('should migrate Vue 2 component to Vue 3', async () => {
    const options = {
      input: testDir,
      output: outputDir,
      eslint: true,
      ai: true,
      report: true
    };

    const report = await migrate(testDir, options);
    expect(report.length).toBeGreaterThan(0);
    expect(report[0].status).toBe('success');

    // 验证输出文件
    const outputFile = await fs.readFile(path.join(outputDir, 'TestComponent.vue'), 'utf-8');
    expect(outputFile).toContain('<script setup>');
    expect(outputFile).toContain('import { ref } from \'vue\'');
  });
}); 