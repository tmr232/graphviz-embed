import { codeToHtml } from "shiki";
import type { CodeOptionsSingleTheme, CodeToHastOptions } from "shiki";

export type CodeOptions = {
  language: CodeToHastOptions["lang"];
  fontSize?: string;
  theme?: CodeOptionsSingleTheme["theme"];
  padding?: string;
};

export async function renderCodeSegments(
  segments: Map<string, string>,
  options: CodeOptions,
): Promise<Map<string, Element>> {
  const renderedSegments = new Map();
  for (const [id, code] of segments.entries()) {
    renderedSegments.set(id, await renderCode(code, options));
  }
  return renderedSegments;
}

async function renderCode(
  code: string,
  codeOptions: CodeOptions,
): Promise<Element> {
  const highlightOptions: CodeToHastOptions = {
    theme: codeOptions.theme ?? "solarized-light",
    lang: codeOptions.language,
  };
  const codeHtml = await codeToHtml(code, highlightOptions);
  const codeContainer = `<div
                            style="width: fit-content; font-size: ${codeOptions.fontSize ?? "14px"}; margin:0;"
                         >
                            ${codeHtml}
                        </div>`;
  const html = `<div style="visibility: none;">${codeContainer}</div>`;
  const elem = htmlToElement(html);
  const preElem = elem.querySelector("pre");
  if (preElem) {
    preElem.style.margin = "0";
    preElem.style.padding = codeOptions.padding ?? "0";
  }
  document.body.appendChild(elem);
  const codeElem = await waitForElement(elem, `div div`);
  return codeElem;
}

function waitForElement(root: Element, selector: string): Promise<Element> {
  return new Promise((resolve) => {
    let element: Element | null = null;

    if ((element = root.querySelector(selector))) {
      return resolve(element);
    }

    const observer = new MutationObserver(() => {
      if ((element = root.querySelector(selector))) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });
  });
}

function htmlToElement(html: string): Element {
  const template = document.createElement("template");
  template.innerHTML = html;
  const result = template.content.firstElementChild;
  if (!result) {
    throw new Error("Failed generating element");
  }
  return result;
}
