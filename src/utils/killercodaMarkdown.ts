import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({
  breaks: true,
  gfm: true,
})

/**
 * Preprocess KillerCoda markdown: fix ```{{exec}} / ```{{execute}} / ```{{copy}}
 * closing fences that are not valid CommonMark.
 * marked treats them as code block content, swallowing all subsequent markdown.
 */
export function preprocessKillercodaMarkdown(markdown: string): string {
  return markdown
    .replace(/```\{\{exec(ute)?\}\}/g, '```\n<!-- EXEC_BLOCK -->')
    .replace(/```\{\{copy\}\}/g, '```\n<!-- COPY_BLOCK -->')
}

/**
 * Process KillerCoda {{exec}} / {{execute}} / {{copy}} markers in rendered HTML.
 * Handles both inline code and fenced code blocks.
 */
export function processExecSyntax(html: string): string {
  // Inline code: `command`{{exec}} or `command`{{execute}} → clickable command
  html = html.replace(/<code>([^<]+)<\/code>\{\{exec(ute)?\}\}/g, '<code class="exec-command">$1</code>')
  // Fenced code blocks: ```{{exec}} → paste-to-terminal block
  html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>\s*<!--\s*EXEC_BLOCK\s*-->/g,
    '<pre class="exec-block"><code$1>$2</code></pre>')
  // Fenced code blocks: ```{{copy}} → copy-only block (marker cleanup)
  html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>\s*<!--\s*COPY_BLOCK\s*-->/g,
    '<pre class="copy-block"><code$1>$2</code></pre>')
  return html
}

/**
 * Full pipeline: preprocess KillerCoda markdown → parse with marked → process markers → sanitize.
 */
export function renderKillercodaMarkdown(markdown: string): string {
  const preprocessed = preprocessKillercodaMarkdown(markdown)
  const html = marked.parse(preprocessed) as string
  return DOMPurify.sanitize(processExecSyntax(html))
}
