const SCRIPT = /<script[\s\S]*?<\/script>/gi;
const FOREIGN = /<foreignObject[\s\S]*?<\/foreignObject>/gi;
const HANDLERS = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL = /(?:xlink:)?href\s*=\s*["']\s*(?:javascript:|data:text\/html)[^"']*["']/gi;
const EXTERNAL = /(?:xlink:)?href\s*=\s*["']\s*https?:[^"']*["']/gi;

export function sanitizeSvg(markup: string): string {
  return markup
    .replace(SCRIPT, '')
    .replace(FOREIGN, '')
    .replace(HANDLERS, '')
    .replace(JS_URL, '')
    .replace(EXTERNAL, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<use\b[^>]*href\s*=\s*["'](?!#)[^"']*["'][^>]*\/?>/gi, '');
}

export function outlineUploadedSvg(markup: string): string {
  return sanitizeSvg(markup)
    .replace(/\sfill="(?!none)[^"]*"/gi, ' fill="#FFFFFF"')
    .replace(/\sfill='(?!none)[^']*'/gi, " fill='#FFFFFF'")
    .replace(/\sstroke="(?!none)[^"]*"/gi, ' stroke="#707070"')
    .replace(/\sstroke='(?!none)[^']*'/gi, " stroke='#707070'");
}
