/**
 * Server-side syntax highlighting using Shiki v1.
 *
 * Per PLAN.md § 11.2:
 *  "Shiki renders syntax-highlighted HTML on the server (Next.js Server Component
 *   or generateHTML API route), meaning zero JavaScript is sent to the client
 *   for read-only code blocks."
 *
 * Used in:
 * - Solution cards (read-only view in Problem Detail Modal)
 * - Public sheet / problem pages
 * - Anywhere Monaco is NOT loaded (view-only mode)
 */

import { createHighlighter, type Highlighter } from "shiki";

// Singleton: avoid recreating the highlighter on every request
let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Returns a shared Shiki highlighter instance (lazy-initialized).
 * Supports the same languages as Monaco (per PLAN.md § 11.3).
 */
async function getHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) return highlighterInstance;
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = createHighlighter({
    themes: ["github-dark", "github-light"], // Built-in Shiki theme bundles
    langs: [
      "python",
      "javascript",
      "typescript",
      "java",
      "cpp",
      "c",
      "csharp",
      "go",
      "rust",
      "kotlin",
      "swift",
      "ruby",
      "php",
      "scala",
      "haskell",
      "sql",
      "bash",
      "r",
      "erlang",
      "jsx",
      "tsx",
    ],
  });

  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

/**
 * Highlights `code` with the given language and theme.
 *
 * @param code     - Raw source code string
 * @param lang     - Language ID (e.g. "python", "cpp", "typescript")
 * @param theme    - "dark" → github-dark | "light" → github-light
 * @returns        - Shiki-generated HTML string (safe, no XSS)
 *
 * Per PLAN.md § 11.4 Theme Pairing:
 *   Site Dark  → Shiki github-dark
 *   Site Light → Shiki github-light
 */
export async function highlightCode(
  code: string,
  lang: string,
  theme: "dark" | "light" = "dark"
): Promise<string> {
  if (!code) return "";
  if (!lang) lang = "text";

  // Normalize language IDs (Monaco uses "shell", Shiki uses "bash")
  const langMap: Record<string, string> = {
    shell: "bash",
    "c++": "cpp",
    "c#": "csharp",
    javascript: "javascript",
    typescript: "typescript",
  };

  const normalizedLang = langMap[lang.toLowerCase()] ?? lang.toLowerCase();
  const shikiTheme = theme === "dark" ? "github-dark" : "github-light";

  try {
    const hl = await getHighlighter();

    // Verify the language is loaded; fall back to plaintext if not
    const loadedLangs = hl.getLoadedLanguages();
    const resolvedLang = loadedLangs.includes(normalizedLang as never)
      ? normalizedLang
      : "text";

    return hl.codeToHtml(code, {
      lang: resolvedLang,
      theme: shikiTheme,
    });
  } catch (err) {
    // Fallback: wrap in pre/code without highlighting
    console.warn("[Shiki] highlight failed, falling back to plain:", err);
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre class="shiki-fallback"><code>${escaped}</code></pre>`;
  }
}
