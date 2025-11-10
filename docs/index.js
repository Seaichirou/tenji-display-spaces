const COLUMNS = ["墨字","6点式","8点式","備考"];

let ORIGINAL = [];   // manifest.json 読み込み結果（順序保持）
let sortMode = 'new'; // 'new' | 'old' | 'author'

function safeText(el, text) {
  el.textContent = (text ?? '');
}

function buildLinkChip(label, href) {
  const a = document.createElement('a');
  a.className = 'chip';
  a.href = href;
  safeText(a, label);
  return a;
}

function buildDisabledChip() {
  const span = document.createElement('span');
  span.className = 'chip disabled';
  safeText(span, '—');
  return span;
}

// 旧ラベルの括弧から author を暫定抽出（例: "かちかち山（芥川龍之介）"）
function extractAuthorFromLabel(label) {
  const m = typeof label === 'string' ? label.match(/（(.+?)）\s*$/) : null;
  return m ? m[1] : '';
}

// 描画本体
function render() {
  const table = document.getElementById('table');
  Array.from(table.querySelectorAll('.row:not(.head)')).forEach(n => n.remove());

  let list = ORIGINAL.map((ex, idx) => ({ ...ex, __idx: idx }));

  if (sortMode === 'new') {
    list.sort((a, b) => a.__idx - b.__idx);   // 新しい順（先頭が新）
  } else if (sortMode === 'old') {
    list.sort((a, b) => b.__idx - a.__idx);   // 古い順
  } else if (sortMode === 'author') {
    // 著者名で単純ソート
    list.sort((a, b) => {
      const aa = (ex.author ?? "").toString();
      const bb = (ex.author ?? "").toString();
      const byAuthor = aa.localeCompare(bb, "ja", { sensitivity: "base", numeric: true });
      if (byAuthor !== 0) return byAuthor;

      // 同一著者内は元の順序
      return a.__idx - b.__idx;
    });
  }

  for (const ex of list) {
    table.appendChild(buildRow(ex));
  }
}


// 1行を作る
function buildRow(ex) {
  const row = document.createElement('div');
  row.className = 'row';

  // 作品名
  const labelCell = document.createElement('div');
  labelCell.className = 'cell label';
  const strong = document.createElement('strong');
  strong.textContent = ex.label ?? "";
  labelCell.appendChild(strong);
  row.appendChild(labelCell);

  // 作者
  const authorCell = document.createElement('div');
  authorCell.className = 'cell';
  authorCell.textContent = ex.author ?? "";
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

// ソート UI のイベント
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

    // exhibits をそのまま保持（配列順が新旧基準）
    ORIGINAL = (data.exhibits || []).map(ex => ({
      id: ex.id,
      label: ex.label,
      author: ex.author,  // 新フィールド（無い場合は未設定のまま）
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
