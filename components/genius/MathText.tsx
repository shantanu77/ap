import katex from "katex";
import "katex/contrib/mhchem";

type Segment = { value: string; display: boolean; math: boolean };

/** Typeset generated math and chemistry while leaving ordinary prose untouched. */
function splitText(text: string): Segment[] {
  const segments: Segment[] = [];
  const delimiters = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?!\$)[^$\n]+\$)/g;
  let cursor = 0;
  for (const match of text.matchAll(delimiters)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ value: text.slice(cursor, index), display: false, math: false });
    const raw = match[0];
    const display = raw.startsWith("$$") || raw.startsWith("\\[");
    const value = raw.startsWith("$$") ? raw.slice(2, -2)
      : raw.startsWith("\\[") ? raw.slice(2, -2)
        : raw.startsWith("\\(") ? raw.slice(2, -2) : raw.slice(1, -1);
    segments.push({ value, display, math: true });
    cursor = index + raw.length;
  }
  if (cursor < text.length) segments.push({ value: text.slice(cursor), display: false, math: false });

  // Older cached lessons often contain plain numeric fractions or mhchem commands.
  return segments.flatMap((segment) => {
    if (segment.math) return [segment];
    const pattern = /(\\ce\{[^{}]*\}|(?<![\w])[-−]?\d+\s*\/\s*[-−]?\d+(?![\w]))/g;
    const parts: Segment[] = [];
    let offset = 0;
    for (const match of segment.value.matchAll(pattern)) {
      const index = match.index ?? 0;
      if (index > offset) parts.push({ value: segment.value.slice(offset, index), display: false, math: false });
      const value = match[0].startsWith("\\ce{") ? match[0] : `\\frac{${match[0].split("/")[0].trim().replace("−", "-")}}{${match[0].split("/")[1].trim().replace("−", "-")}}`;
      parts.push({ value, display: false, math: true });
      offset = index + match[0].length;
    }
    if (offset < segment.value.length) parts.push({ value: segment.value.slice(offset), display: false, math: false });
    return parts;
  });
}

export default function MathText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {splitText(String(text ?? "")).map((segment, index) => {
        if (!segment.math) return <span key={index}>{segment.value}</span>;
        const html = katex.renderToString(segment.value, {
          displayMode: segment.display,
          throwOnError: false,
          trust: false,
          output: "htmlAndMathml",
        });
        return <span key={index} className={segment.display ? "genius-display-math" : "genius-inline-math"} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </span>
  );
}
