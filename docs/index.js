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

  // 既存行を削除（ヘッダ以外）
  Array.from(table.querySelectorAll('.row:not(.head)')).forEach(n => n.remove());

  // 並べ替え用の配列を作成
  let list = ORIGINAL.map((ex, idx) => ({
    ...ex,
    __idx: idx, // 元の順序を保持（新旧の基準に使う）
  }));

  if (sortMode === 'new') {
    // manifest 先頭ほど新しい想定
    list.sort((a, b) => a.__idx - b.__idx);
  } else if (sortMode === 'old') {
    list.sort((a, b) => b.__idx - a.__idx);
  }

  if (sortMode !== 'author') {
    // 通常のフラット描画
    for (const ex of list) {
      table.appendChild(buildRow(ex));
    }
  } else {
    // 著者でまとめる：author -> exhibits[]
    const byAuthor = new Map();
    for (const ex of list) {
      const author = (ex.author && String(ex.author)) || extractAuthorFromLabel(ex.label) || '（作者未設定）';
      if (!byAuthor.has(author)) byAuthor.set(author, []);
      byAuthor.get(author).push(ex);
    }

    // 作者名で昇順
    const authors = Array.from(byAuthor.keys()).sort((a, b) => a.localeCompare(b, 'ja'));

    for (const author of authors) {
      // グループ見出しを挿入
      const group = document.createElement('div');
      group.className = 'row group-head';
      const headCell = document.createElement('div');
      headCell.className = 'cell';
      safeText(headCell, `著者: ${author}`);
      group.appendChild(headCell);
      table.appendChild(group);

      // その作者の作品を元順序のまま（新しい順の感覚）
      for (const ex of byAuthor.get(author)) {
        table.appendChild(buildRow(ex));
      }
    }
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
  safeText(strong, ex.label);
  labelCell.appendChild(strong);
  row.appendChild(labelCell);

  // 作者
  const authorCell = document.createElement('div');
  authorCell.className = 'cell';
  const author = (ex.author && String(ex.author)) || extractAuthorFromLabel(ex.label) || '';
  safeText(authorCell, author);
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
