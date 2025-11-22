const qs = new URLSearchParams(location.search);
const id   = qs.get('id');
const type = qs.get('type'); // "墨字" / "6点式" / "8点式" / "備考"

const content = document.getElementById('content');
const size    = document.getElementById('size');

const POLICY = {
  "墨字":  {
    whiteSpace: "pre-wrap",
    font: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Noto Sans Mono CJK JP", "Noto Sans Mono", monospace',
    min: 16, max: 20.5, initial: 20.5, step: 0.5,
    lineHeight: 2.0, letterSpacing: "0", wordSpacing: "0"
  },

  // ★ 6点式：Noto Sans Symbols 2 を最優先に
  "6点式": {
    whiteSpace: "pre-wrap",
    font: '"Noto Sans Symbols 2", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    min: 20, max: 29, initial: 29, step: 1,
    lineHeight: 2.0, letterSpacing: "0", wordSpacing: "0"
  },

  // ★ 8点式：こちらも同じく
  "8点式": {
    whiteSpace: "pre-wrap",
    font: '"Noto Sans Symbols 2", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    min: 20, max: 29, initial: 29, step: 1,
    lineHeight: 2.0, letterSpacing: "0", wordSpacing: "0"
  },

  "備考":  {
    whiteSpace: "pre-wrap",
    font: '',
    min: 16, max: 20.5, initial: 20.5, step: 0.5,
    lineHeight: 2.0, letterSpacing: "0", wordSpacing: "0"
  }
};


async function load() {
  try {
    const res = await fetch('manifest.json?v=' + Date.now(), { cache: 'no-cache' });
    const data = await res.json();

    const ex = (data.exhibits || []).find(e => e.id === id);
    const title = document.getElementById('title');
    const meta  = document.getElementById('meta');

    if (!ex) { content.textContent = '作品が見つかりません。'; return; }
    const file = ex.files[type];
    if (!file) { content.textContent = `${type} は用意されていません。`; return; }

    const path = ex.base + file;
    title.textContent = `${ex.label} – ${type}`;
    meta.textContent  = path.replace('./','/');

    const url = encodeURI(path) + '?v=' + Date.now();
    const txt = await fetch(url, { cache: 'no-cache' }).then(r => r.text());

    if (type === "備考") {
      // ★ marked → DOMPurify で必ずサニタイズ
      content.classList.add('md');
      const html = marked.parse(txt);
      content.innerHTML = DOMPurify.sanitize(html);
    } else {
      content.classList.remove('md');
      content.textContent = txt;
    }

    const p = POLICY[type] || POLICY["墨字"];
    Object.assign(content.style, {
      whiteSpace: p.whiteSpace, fontFamily: p.font, lineHeight: String(p.lineHeight),
      letterSpacing: p.letterSpacing, wordSpacing: p.wordSpacing, wordBreak: 'normal',
      overflowWrap: 'anywhere', lineBreak: 'anywhere', overflowX: 'visible',
      fontKerning: 'none', fontVariantEastAsian: 'normal'
    });

    size.min   = String(p.min);
    size.max   = String(p.max);
    size.value = String(p.initial);
    size.step  = String(p.step ?? 1);
    applySize();
    size.addEventListener('input', applySize);

  } catch (e) {
    content.textContent = '読み込みでエラーが発生しました。';
    console.error(e);
  }
}

function applySize() {
  const sizeRange = document.getElementById('size');
  content.style.fontSize = sizeRange.value + 'px';
}

load();
