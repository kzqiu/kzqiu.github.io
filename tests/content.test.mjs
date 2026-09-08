import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

test('Markdown automatically publishes to the right section with math and highlighted code', async () => {
  // Build a disposable copy so fixtures never become real published content.
  const fixture = await mkdtemp(join(tmpdir(), 'curios-content-'));
  try {
    for (const path of ['src', 'public', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
      await cp(join(root, path), join(fixture, path), { recursive: true });
    }
    await symlink(join(root, 'node_modules'), join(fixture, 'node_modules'), 'dir');
    await rm(join(fixture, 'src/content'), { recursive: true });
    await mkdir(join(fixture, 'src/content/posts/topic'), { recursive: true });
    await mkdir(join(fixture, 'src/content/projects'), { recursive: true });
    const post = (title, date, extra = '') => `---\ntitle: "${title}"\ndate: ${date}\n${extra}---\n\n## Details\n\nInline $x^2$.\n\n$$\n\\frac{1}{2}\n$$\n\n\`\`\`cpp\nint square(int x) { return x * x; }\n\`\`\`\n`;
    await writeFile(join(fixture, 'src/content/posts/older.md'), post('Older post', '2025-01-01'));
    await writeFile(join(fixture, 'src/content/posts/topic/newer.md'), post('Newer post', '2026-09-07'));
    await writeFile(join(fixture, 'src/content/projects/demo.md'), post('Demo project', '2026-09-07'));
    await writeFile(join(fixture, 'src/content/posts/hidden.md'), post('Hidden draft', '2026-09-08', 'draft: true\n'));
    await writeFile(join(fixture, 'src/content/projects/hidden.md'), post('Hidden project', '2026-09-08', 'draft: true\n'));

    execFileSync(process.execPath, [join(root, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', fixture], {
      cwd: fixture, stdio: 'pipe', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    });
    const output = (path) => readFile(join(fixture, 'dist', path), 'utf8');
    const thoughts = await output('thoughts/index.html');
    const projects = await output('projects/index.html');
    assert.match(thoughts, /href="\/posts\/topic\/newer\/"/);
    assert.ok(thoughts.indexOf('Newer post') < thoughts.indexOf('Older post'));
    assert.doesNotMatch(thoughts, /Demo project|Hidden draft/);
    assert.match(projects, /href="\/projects\/demo\/"/);
    assert.doesNotMatch(projects, /Newer post|Hidden project/);
    for (const path of ['posts/topic/newer/index.html', 'projects/demo/index.html']) {
      const html = await output(path);
      assert.match(html, /class="katex"/);
      assert.match(html, /katex-display/);
      assert.match(html, /astro-code/);
      assert.match(html, /<span style="color:/);
      assert.match(html, /<h2 id="details">Details<\/h2>/);
      assert.match(html, /September 7, 2026/);
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
      assert.doesNotMatch(html, /<script\b/);
    }
    await assert.rejects(output('posts/hidden/index.html'), { code: 'ENOENT' });
    await assert.rejects(output('projects/hidden/index.html'), { code: 'ENOENT' });
    const home = await output('index.html');
    assert.match(home, /Work in progress\./);
    assert.match(home, /Kevin&#39;s Curios|Kevin's Curios/);
    assert.match(await output('thoughts.html'), /0;url=\/thoughts\//);
    assert.match(await output('projects.html'), /0;url=\/projects\//);
    assert.equal((await output('CNAME')).trim(), 'www.kevinzqiu.com');
  } catch (error) {
    if (error.stdout) console.error(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    throw error;
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
