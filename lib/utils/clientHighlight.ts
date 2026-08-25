import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/themes/prism-tomorrow.css";

/**
 * Fast client-side syntax highlighting utility using Prism.
 */
export function highlightClientCode(code: string, lang: string): string {
  if (!code) return "";

  const normalizedLang = (lang || "python").toLowerCase().trim();
  let prismLang = Prism.languages.python;

  if (normalizedLang === "python") {
    prismLang = Prism.languages.python;
  } else if (normalizedLang === "c++" || normalizedLang === "cpp") {
    prismLang = Prism.languages.cpp || Prism.languages.clike;
  } else if (normalizedLang === "java") {
    prismLang = Prism.languages.java || Prism.languages.clike;
  } else if (normalizedLang === "javascript" || normalizedLang === "js") {
    prismLang = Prism.languages.javascript || Prism.languages.clike;
  } else if (normalizedLang === "typescript" || normalizedLang === "ts") {
    prismLang = Prism.languages.typescript || Prism.languages.javascript || Prism.languages.clike;
  } else if (normalizedLang === "go") {
    prismLang = Prism.languages.go || Prism.languages.clike;
  } else if (normalizedLang === "rust") {
    prismLang = Prism.languages.rust || Prism.languages.clike;
  }

  return Prism.highlight(code, prismLang, normalizedLang);
}
