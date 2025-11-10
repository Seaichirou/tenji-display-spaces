// index.js（完全置き換え）
const COLUMNS = ["墨字","6点式","8点式","備考"];

let ORIGINAL = [];          // manifest.json の順序を保持
let sortMode = 'new';       // 'new' | 'old' | 'author'

// テキストを安全に入れる
function safeText(el, text) {
  el.textContent = (text ?? '');
}

// リンク型チップ
function buildLinkChip(label, href) {
  const a = document.createElement('a');
  a.className = 'chip';
  a.href = href;
  safeText(a, label);
  return a;
}

// 無効チップ
function buildDisabledChip() {
  const span = document.createElement('span');
  span.className = 'chip disabled';
  safeText(span, '—');
  return span;
}

// 1行を作る
function buildRow(ex) {
  const row = document.createElement('div');
  row.className = 'row';

  // 作品名
  const labelCell = document.createElement('div');
  labelCell.className = 'cell label';
  const strong = document.createElement('strong');
  safeText(strong, ex.label);
  labelCell.appendChild(strong);
  row.appendChild(labelCell);

  // 作者
  const authorCell = document.createElement('div');
  authorCell.className = 'cell';
  safeText(authorCell, (ex.author ?? '').toString());
  row.appendChild(authorCell);

  // 4セル（墨字 / 6点 / 8点 / 備考）
  COLUMNS.forEach(col => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const has = ex.files && Object.prototype.hasOwnProperty.call(ex.files, col);

    if (has) {
      const url = `viewer.html?id=${encodeURIComponent(ex.id)}&type=${encodeURIComponent(col)}`;
      cell.appendChild(buildLinkChip(col, url));
    } else {
      cell.appendChild(buildDisabledChip());
    }
    row.appendChild(cell);
  });

  return row;
}

// 描画
function render() {
  const table = document.getElementById('table');
  Array.from(table.querySelectorAll('.row:not(.head)')).forEach(n => n.remove());

  // 現在の順序リスト
  let list = ORIGINAL.map((ex, idx) => ({ ...ex, __idx: idx }));

  if (sortMode === 'new') {
    // 末尾ほど新しい前提 → 新しい順（大きい idx が先）
    list.sort((a, b) => b.__idx - a.__idx);
  } else if (sortMode === 'old') {
    // 古い順（小さい idx が先）
    list.sort((a, b) => a.__idx - b.__idx);
  } else if (sortMode === 'author') {
    // 著者名で単純ソート（見出しなし）
    list.sort((a, b) => {
      const aa = (a.author ?? '').toString().trim();
      const bb = (b.author ?? '').toString().trim();
      const byAuthor = aa.localeCompare(bb, 'ja', { sensitivity: 'base', numeric: true });
      if (byAuthor !== 0) return byAuthor;
      // 同一著者内では新しい順の感覚（大きい idx が先）
      return b.__idx - a.__idx;
    });
  }

  for (const ex of list) {
    table.appendChild(buildRow(ex));
  }
}

// ソート UI
function setupSortUI() {
  const bar = document.querySelector('.sortbar');
  if (!bar) return;
  bar.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-sort]');
    if (!btn) return;
    const mode = btn.getAttribute('data-sort');
    if (!mode || !['new','old','author'].includes(mode)) return;
    sortMode = mode;
    render();
  });
}

// 初期化
(async () => {
  try {
    const res = await fetch('manifest.json', { cache: 'no-cache' });
    const data = await res.json();

    ORIGINAL = (data.exhibits || []).map(ex => ({
      id: ex.id,
      label: ex.label,
      author: ex.author,  // manifest.json で管理
      base: ex.base,
      files: ex.files
    }));

    setupSortUI();
    render();
  } catch (e) {
    console.error(e);
    const table = document.getElementById('table');
    const row = document.createElement('div');
    row.className = 'row';
    safeText(row, 'manifest.json の読み込みに失敗しました。');
    table.appendChild(row);
  }
})();
