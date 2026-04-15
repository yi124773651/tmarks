/**
 * Generates the HTML for the tab opener popup window.
 */

interface ThemeColors {
  primary: string
  accent: string
  card: string
  muted: string
  success: string
  destructive: string
  foreground: string
}

interface I18nStrings {
  title: string
  heading: string
  preparing: string
  opening: string
  successPartial: string
  successAll: string
  closeWindow: string
}

interface TabItem {
  url: string
  title: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

function sanitizeCssValue(str: string): string {
  return str.replace(/[^a-zA-Z0-9#%(),.\-\s/]/g, '')
}

export function getThemeColors(): ThemeColors {
  const root = document.documentElement
  const get = (v: string) => getComputedStyle(root).getPropertyValue(v).trim()
  return {
    primary: get('--primary'),
    accent: get('--accent'),
    card: get('--card'),
    muted: get('--muted'),
    success: get('--success'),
    destructive: get('--destructive'),
    foreground: get('--foreground'),
  }
}

export function buildTabOpenerHtml(
  items: TabItem[],
  colors: ThemeColors,
  i18n: I18nStrings
): string {
  const urlsJson = JSON.stringify(items)
  const c = {
    primary: sanitizeCssValue(colors.primary),
    accent: sanitizeCssValue(colors.accent),
    card: sanitizeCssValue(colors.card),
    muted: sanitizeCssValue(colors.muted),
    success: sanitizeCssValue(colors.success),
    destructive: sanitizeCssValue(colors.destructive),
    foreground: sanitizeCssValue(colors.foreground),
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(i18n.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, ${c.primary} 0%, ${c.accent} 100%);
      color: ${c.foreground};
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: ${c.card};
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      box-shadow: 0 8px 32px hsl(0 0% 0% / 0.15);
      max-width: 600px;
    }
    h1 { margin: 0 0 1rem 0; font-size: 2rem; }
    .progress {
      margin: 2rem 0;
      font-size: 1.5rem;
      font-weight: bold;
    }
    .status {
      margin: 1rem 0;
      padding: 1rem;
      background: ${c.muted};
      border-radius: 0.5rem;
      font-size: 0.9rem;
    }
    .links {
      margin-top: 2rem;
      text-align: left;
      max-height: 300px;
      overflow-y: auto;
      padding: 1rem;
      background: ${c.muted};
      border-radius: 0.5rem;
    }
    .link-item {
      padding: 0.5rem;
      margin: 0.25rem 0;
      background: ${c.card};
      border-radius: 0.25rem;
      font-size: 0.85rem;
      word-break: break-all;
    }
    .link-item.opened {
      background: color-mix(in srgb, ${c.success} 30%, transparent);
    }
    .link-item.failed {
      background: color-mix(in srgb, ${c.destructive} 30%, transparent);
    }
    button {
      margin-top: 1rem;
      padding: 0.75rem 2rem;
      font-size: 1rem;
      background: ${c.primary};
      color: ${c.foreground};
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: bold;
      transition: transform 0.2s;
    }
    button:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(i18n.heading)}</h1>
    <div class="progress">
      <span id="current">0</span> / <span id="total">${items.length}</span>
    </div>
    <div class="status" id="status">${escapeHtml(i18n.preparing)}</div>
    <div class="links" id="links"></div>
    <button onclick="window.close()" style="display:none" id="closeBtn">${escapeHtml(i18n.closeWindow)}</button>
  </div>
  <script>
    const urls = ${urlsJson};
    const i18nOpening = '${escapeJsString(i18n.opening)}';
    let opened = 0;
    let failed = 0;

    const linksContainer = document.getElementById('links');
    const statusEl = document.getElementById('status');
    const currentEl = document.getElementById('current');
    const closeBtnEl = document.getElementById('closeBtn');

    urls.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'link-item';
      div.id = 'link-' + index;
      div.textContent = (index + 1) + '. ' + item.title;
      linksContainer.appendChild(div);
    });

    async function openTabs() {
      for (let i = 0; i < urls.length; i++) {
        const item = urls[i];
        const linkEl = document.getElementById('link-' + i);

        try {
          statusEl.textContent = i18nOpening + item.title;
          const newWindow = window.open(item.url, '_blank', 'noopener,noreferrer');

          if (newWindow) {
            opened++;
            linkEl.className = 'link-item opened';
          } else {
            failed++;
            linkEl.className = 'link-item failed';
          }
        } catch (error) {
          console.error('Failed to open:', item.url, error);
          failed++;
          linkEl.className = 'link-item failed';
        }

        currentEl.textContent = (i + 1);

        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (failed > 0) {
        statusEl.textContent = '${escapeJsString(i18n.successPartial)}';
        statusEl.style.background = 'var(--warning)';
        statusEl.style.opacity = '0.3';
      } else {
        statusEl.textContent = '${escapeJsString(i18n.successAll)}';
        statusEl.style.background = 'var(--success)';
        statusEl.style.opacity = '0.3';
      }

      closeBtnEl.style.display = 'block';
    }

    setTimeout(openTabs, 500);
  </script>
</body>
</html>`
}
