import { describe, it, expect } from 'vitest'
import { preprocessKillercodaMarkdown, processExecSyntax } from '../../src/utils/killercodaMarkdown'

describe('preprocessKillercodaMarkdown', () => {
  it('converts ```{{exec}} to valid closing fence + EXEC_BLOCK marker', () => {
    const input = '```shell\ntofu plan\n```{{exec}}'
    const result = preprocessKillercodaMarkdown(input)
    expect(result).toBe('```shell\ntofu plan\n```\n<!-- EXEC_BLOCK -->')
  })

  it('converts ```{{execute}} to valid closing fence + EXEC_BLOCK marker', () => {
    const input = '```shell\ntofu apply\n```{{execute}}'
    const result = preprocessKillercodaMarkdown(input)
    expect(result).toBe('```shell\ntofu apply\n```\n<!-- EXEC_BLOCK -->')
  })

  it('converts ```{{copy}} to valid closing fence + COPY_BLOCK marker', () => {
    const input = '```hcl\nresource {}\n```{{copy}}'
    const result = preprocessKillercodaMarkdown(input)
    expect(result).toBe('```hcl\nresource {}\n```\n<!-- COPY_BLOCK -->')
  })

  it('handles multiple exec blocks in same document', () => {
    const input = '```shell\ncmd1\n```{{exec}}\n\ntext\n\n```shell\ncmd2\n```{{exec}}'
    const result = preprocessKillercodaMarkdown(input)
    expect(result).toContain('```\n<!-- EXEC_BLOCK -->\n\ntext\n\n```shell\ncmd2\n```\n<!-- EXEC_BLOCK -->')
  })

  it('leaves regular code blocks unchanged', () => {
    const input = '```shell\ntofu plan\n```\n\nNext paragraph.'
    const result = preprocessKillercodaMarkdown(input)
    expect(result).toBe(input)
  })

  it('leaves inline code with {{exec}} unchanged (handled by processExecSyntax)', () => {
    const input = 'Run `tofu plan`{{exec}} to review.'
    const result = preprocessKillercodaMarkdown(input)
    expect(result).toBe(input)
  })

  it('handles mixed inline and fenced markers', () => {
    const input = 'Run `tofu plan`{{exec}} first.\n\n```shell\ntofu apply\n```{{exec}}'
    const result = preprocessKillercodaMarkdown(input)
    expect(result).toContain('Run `tofu plan`{{exec}} first.')
    expect(result).toContain('```\n<!-- EXEC_BLOCK -->')
  })
})

describe('processExecSyntax', () => {
  describe('inline code', () => {
    it('converts inline `cmd`{{exec}} to exec-command class', () => {
      const input = '<p><code>tofu plan</code>{{exec}}</p>'
      const result = processExecSyntax(input)
      expect(result).toBe('<p><code class="exec-command">tofu plan</code></p>')
    })

    it('converts inline `cmd`{{execute}} to exec-command class', () => {
      const input = '<p><code>tofu apply</code>{{execute}}</p>'
      const result = processExecSyntax(input)
      expect(result).toBe('<p><code class="exec-command">tofu apply</code></p>')
    })

    it('handles multiple inline exec commands in same paragraph', () => {
      const input = '<p><code>plan</code>{{exec}} and <code>apply</code>{{exec}}</p>'
      const result = processExecSyntax(input)
      expect(result).toBe('<p><code class="exec-command">plan</code> and <code class="exec-command">apply</code></p>')
    })

    it('converts inline `text`{{copy}} to copy-command class', () => {
      const input = '<p>alias <code>k8s</code>{{copy}}</p>'
      const result = processExecSyntax(input)
      expect(result).toBe('<p>alias <code class="copy-command">k8s</code></p>')
    })

    it('handles mixed exec and copy inline markers', () => {
      const input = '<p><code>cmd</code>{{exec}} and <code>text</code>{{copy}}</p>'
      const result = processExecSyntax(input)
      expect(result).toContain('<code class="exec-command">cmd</code>')
      expect(result).toContain('<code class="copy-command">text</code>')
    })

    it('leaves regular inline code unchanged', () => {
      const input = '<p>Use <code>tofu plan</code> to preview.</p>'
      const result = processExecSyntax(input)
      expect(result).toBe(input)
    })
  })

  describe('fenced code blocks', () => {
    it('adds exec-block class to pre with EXEC_BLOCK marker', () => {
      const input = '<pre><code class="language-shell">tofu plan\n</code></pre>\n<!-- EXEC_BLOCK -->'
      const result = processExecSyntax(input)
      expect(result).toBe('<pre class="exec-block"><code class="language-shell">tofu plan\n</code></pre>')
    })

    it('adds copy-block class to pre with COPY_BLOCK marker', () => {
      const input = '<pre><code class="language-hcl">resource {}\n</code></pre>\n<!-- COPY_BLOCK -->'
      const result = processExecSyntax(input)
      expect(result).toBe('<pre class="copy-block"><code class="language-hcl">resource {}\n</code></pre>')
    })

    it('handles pre/code without language class', () => {
      const input = '<pre><code>tofu plan\n</code></pre>\n<!-- EXEC_BLOCK -->'
      const result = processExecSyntax(input)
      expect(result).toBe('<pre class="exec-block"><code>tofu plan\n</code></pre>')
    })

    it('handles multi-line code blocks', () => {
      const input = '<pre><code class="language-shell">sudo install -m 0755\ncurl -fsSL url\nsudo chmod a+r\n</code></pre>\n<!-- EXEC_BLOCK -->'
      const result = processExecSyntax(input)
      expect(result).toContain('class="exec-block"')
      expect(result).toContain('sudo install -m 0755\ncurl -fsSL url\nsudo chmod a+r\n')
      expect(result).not.toContain('EXEC_BLOCK')
    })

    it('leaves regular code blocks unchanged', () => {
      const input = '<pre><code class="language-shell">tofu plan\n</code></pre>'
      const result = processExecSyntax(input)
      expect(result).toBe(input)
    })

    it('handles multiple fenced blocks', () => {
      const input = '<pre><code>cmd1\n</code></pre>\n<!-- EXEC_BLOCK -->\n<p>text</p>\n<pre><code>cmd2\n</code></pre>\n<!-- COPY_BLOCK -->'
      const result = processExecSyntax(input)
      expect(result).toContain('<pre class="exec-block"><code>cmd1\n</code></pre>')
      expect(result).toContain('<pre class="copy-block"><code>cmd2\n</code></pre>')
    })
  })

  describe('mixed inline and fenced', () => {
    it('processes both inline exec and fenced exec in same HTML', () => {
      const input = '<p><code>cmd1</code>{{exec}}</p>\n<pre><code>cmd2\n</code></pre>\n<!-- EXEC_BLOCK -->'
      const result = processExecSyntax(input)
      expect(result).toContain('<code class="exec-command">cmd1</code>')
      expect(result).toContain('<pre class="exec-block"><code>cmd2\n</code></pre>')
    })
  })
})

describe('full pipeline (preprocess + marked + processExecSyntax)', () => {
  // These tests verify the end-to-end behavior with marked parsing

  it('renders fenced exec block as exec-block pre', async () => {
    const { marked } = await import('marked')
    marked.setOptions({ breaks: true, gfm: true })

    const md = '```shell\ntofu plan\n```{{exec}}'
    const preprocessed = preprocessKillercodaMarkdown(md)
    const html = marked.parse(preprocessed) as string
    const result = processExecSyntax(html)

    expect(result).toContain('class="exec-block"')
    expect(result).toContain('tofu plan')
    expect(result).not.toContain('{{exec}}')
    expect(result).not.toContain('EXEC_BLOCK')
  })

  it('does not swallow content after fenced exec block', async () => {
    const { marked } = await import('marked')
    marked.setOptions({ breaks: true, gfm: true })

    const md = '```shell\ncmd1\n```{{exec}}\n\n### Next Section\n\nParagraph text.'
    const preprocessed = preprocessKillercodaMarkdown(md)
    const html = marked.parse(preprocessed) as string
    const result = processExecSyntax(html)

    expect(result).toContain('class="exec-block"')
    expect(result).toContain('<h3>Next Section</h3>')
    expect(result).toContain('Paragraph text.')
  })

  it('renders multiple fenced exec blocks without swallowing content', async () => {
    const { marked } = await import('marked')
    marked.setOptions({ breaks: true, gfm: true })

    const md = [
      '### Task 1',
      '```shell',
      'cmd1',
      '```{{exec}}',
      '',
      '### Task 2',
      '```shell',
      'cmd2',
      '```{{exec}}',
      '',
      '### Task 3',
      '```shell',
      'cmd3',
      '```{{exec}}',
    ].join('\n')

    const preprocessed = preprocessKillercodaMarkdown(md)
    const html = marked.parse(preprocessed) as string
    const result = processExecSyntax(html)

    expect(result).toContain('<h3>Task 1</h3>')
    expect(result).toContain('<h3>Task 2</h3>')
    expect(result).toContain('<h3>Task 3</h3>')
    // All three blocks should be exec-block
    const execBlockCount = (result.match(/exec-block/g) || []).length
    expect(execBlockCount).toBe(3)
    // No raw markers visible
    expect(result).not.toContain('{{exec}}')
    expect(result).not.toContain('EXEC_BLOCK')
  })

  it('handles inline exec alongside fenced exec', async () => {
    const { marked } = await import('marked')
    marked.setOptions({ breaks: true, gfm: true })

    const md = 'Run `tofu plan`{{exec}} first.\n\n```shell\ntofu apply\n```{{exec}}'
    const preprocessed = preprocessKillercodaMarkdown(md)
    const html = marked.parse(preprocessed) as string
    const result = processExecSyntax(html)

    expect(result).toContain('class="exec-command"')
    expect(result).toContain('class="exec-block"')
  })

  it('preserves regular code blocks without markers', async () => {
    const { marked } = await import('marked')
    marked.setOptions({ breaks: true, gfm: true })

    const md = '```shell\ntofu plan\n```\n\nNext paragraph.'
    const preprocessed = preprocessKillercodaMarkdown(md)
    const html = marked.parse(preprocessed) as string
    const result = processExecSyntax(html)

    expect(result).not.toContain('exec-block')
    expect(result).not.toContain('copy-block')
    expect(result).toContain('tofu plan')
    expect(result).toContain('Next paragraph.')
  })
})
