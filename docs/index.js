const COLUMNS = ["墨字","6点式","8点式","備考"];

(async () => {
  try {
    const res = await fetch('manifest.json', { cache: 'no-cache' });
    const data = await res.json();
    const table = document.getElementById('table');

    (data.exhibits || []).forEach(ex => {
      const row = document.createElement('div');
      row.className = 'row';

      // 作品名
      const labelCell = document.createElement('div');
      labelCell.className = 'cell label';
      labelCell.innerHTML = `<strong>${ex.label}</strong>`;
      row.appendChild(labelCell);

      // 4セル（墨字 / 6点 / 8点 / 備考）
      COLUMNS.forEach(col => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        const has = ex.files && Object.prototype.hasOwnProperty.call(ex.files, col);

        if (has) {
          const url = `viewer.html?id=${encodeURIComponent(ex.id)}&type=${encodeURIComponent(col)}`;
          cell.innerHTML = `<a class="chip" href="${url}">${col}</a>`;
        } else {
          cell.innerHTML = `<span class="chip disabled">—</span>`;
        }
        row.appendChild(cell);
      });

      table.appendChild(row);
    });
  } catch (e) {
    console.error(e);
    const table = document.getElementById('table');
    const row = document.createElement('div');
    row.className = 'row';
    row.textContent = 'manifest.json の読み込みに失敗しました。';
    table.appendChild(row);
  }
})();
