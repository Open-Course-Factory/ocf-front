import { marked } from 'marked'
import DOMPurify from 'dompurify'
import axios from 'axios'

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

// Track blob URLs created by loadScenarioImages for cleanup
let activeBlobUrls: string[] = []

/**
 * Revoke all blob URLs created by previous loadScenarioImages calls.
 * Call this before loading a new step to prevent memory leaks.
 */
export function revokeScenarioImageUrls(): void {
  for (const url of activeBlobUrls) {
    URL.revokeObjectURL(url)
  }
  activeBlobUrls = []
}

/**
 * Load scenario images in a rendered markdown container.
 * Finds <img> tags with relative src, fetches from the API endpoint
 * using authenticated requests, and replaces src with blob URLs.
 *
 * @param container - DOM element containing rendered markdown
 * @param scenarioId - Scenario UUID for the image API endpoint
 * @param stepDir - Step directory prefix (e.g., "step1") for resolving relative paths
 */
export async function loadScenarioImages(
  container: HTMLElement,
  scenarioId: string,
  stepDir?: string
): Promise<void> {
  const images = container.querySelectorAll('img')
  const promises: Promise<void>[] = []

  images.forEach(img => {
    const src = img.getAttribute('src')
    if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) {
      return
    }

    // Resolve relative path to scenario root
    let relPath = src
    if (stepDir && (src.startsWith('./') || !src.startsWith('/'))) {
      relPath = src.startsWith('./') ? src.slice(2) : src
      relPath = `${stepDir}/${relPath}`
    }

    // Show placeholder while loading
    img.style.opacity = '0.3'
    img.alt = img.alt || 'Loading...'

    const promise = axios.get(`/project-files/image/${scenarioId}/${relPath}`, {
      responseType: 'blob'
    }).then(response => {
      const blobUrl = URL.createObjectURL(response.data)
      activeBlobUrls.push(blobUrl)
      img.src = blobUrl
      img.style.opacity = '1'
    }).catch(() => {
      // Image not found — hide broken img or show alt text
      img.style.display = 'none'
    })

    promises.push(promise)
  })

  await Promise.all(promises)
}
