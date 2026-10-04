import { buildPreview, decodeFile, normalizeRecord, exportRecords, ticketsFor, MAX_BYTES, MAX_STORES } from './importer.js';
import { samples } from './samples.js';

const $ = selector => document.querySelector(selector);
const element = (tag, className = '', text = '') => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};
let stores = samples.map(store => ({ ...store, tags: [...store.tags] }));
let filter = '', dirty = false, preview = null, fileGeneration = 0;

function render() {
  const query = $('#search').value.trim().toLowerCase();
  const genres = [...new Set(stores.map(store => store.genre).filter(Boolean))];
  if (filter && !genres.includes(filter)) filter = '';
  const filters = $('#filters');
  filters.replaceChildren();
  ['', ...genres].forEach(genre => {
    const button = element('button', 'filter', genre || 'すべて');
    button.type = 'button'; button.setAttribute('aria-pressed', String(genre === filter));
    button.addEventListener('click', () => { filter = genre; render(); });
    filters.append(button);
  });
  let visible = stores.filter(store => (!filter || store.genre === filter) && [store.name, store.address, store.memo, store.genre, ...store.tags].join(' ').toLowerCase().includes(query));
  if ($('#sort').value === 'name') visible = [...visible].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  $('#total-count').textContent = stores.length;
  $('#result-count').textContent = `${visible.length}件のお店${query || filter ? ' / ' + stores.length + '件中' : ''}`;
  const grid = $('#restaurant-grid'); grid.replaceChildren();
  visible.forEach(store => {
    const card = element('article', 'restaurant-card');
    const top = element('div', 'card-top');
    const icon = element('span', 'genre-icon' + (store.tone ? ' tone-' + store.tone : ''), store.icon || '◌');
    icon.setAttribute('aria-hidden', 'true');
    top.append(icon, element('span', 'card-source', store.source));
    const tags = element('div', 'card-tags');
    if (store.genre) tags.append(element('span', 'tag genre-tag', store.genre));
    store.tags.forEach(tag => tags.append(element('span', 'tag', tag)));
    const bottom = element('div', 'card-bottom');
    const edit = element('button', 'edit-button', 'メモを編集 ↗');
    edit.type = 'button'; edit.setAttribute('aria-label', store.name + 'を編集');
    edit.addEventListener('click', () => openManual(store));
    bottom.append(element('span', '', 'a little favorite.'), edit);
    card.append(top, element('h3', '', store.name), element('p', 'card-address', store.address || '住所のメモはまだありません'), tags);
    if (store.memo) card.append(element('p', 'card-memo', store.memo));
    card.append(bottom); grid.append(card);
  });
  $('#empty-state').hidden = visible.length > 0;
}

function announce(message) { $('#status').textContent = message; }
function openManual(store = null) {
  const form = $('#manual-form'); form.reset(); $('#manual-error').textContent = '';
  for (const field of ['id', 'name', 'address', 'phone', 'genre', 'memo']) form.elements.namedItem(field).value = store?.[field] || '';
  form.elements.namedItem('tags').value = store?.tags.join(', ') || '';
  $('#manual-title').textContent = store ? 'お店のメモを編集' : 'お店をメモする';
  form.querySelector('[type=submit]').textContent = store ? 'この画面で更新' : 'この画面に追加';
  $('#manual-dialog').showModal();
}

$('#add-button').addEventListener('click', () => openManual());
$('#manual-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const form = event.currentTarget;
    const input = Object.fromEntries(new FormData(form));
    const record = normalizeRecord(input);
    const index = stores.findIndex(store => store.id === input.id);
    if (index >= 0) record.mapsURL = stores[index].mapsURL;
    if (index < 0 && stores.length >= MAX_STORES) throw new Error('この画面の上限は2,000店舗です。JSONを書き出してから再読み込みしてください。');
    if (index >= 0) stores[index] = { ...stores[index], ...record, source: '手動編集' };
    else stores.unshift({ ...record, id: crypto.randomUUID(), source: '手動入力', icon: '◌', tone: 'green' });
    dirty = true; render(); $('#manual-dialog').close();
    announce(index >= 0 ? 'この画面内のメモを更新しました。サーバには保存されていません。' : 'この画面内に追加しました。必要ならJSONを書き出してください。');
  } catch (error) { $('#manual-error').textContent = error.message; }
});

$('#search').addEventListener('input', render); $('#sort').addEventListener('change', render);
$('#clear-search').addEventListener('click', () => { $('#search').value = ''; filter = ''; render(); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));

function resetPreview() {
  preview = null; $('#import-preview').hidden = true; $('#commit-import').disabled = true;
  $('#preview-rows').replaceChildren(); $('#import-error').textContent = '';
}
$('#import-button').addEventListener('click', () => { fileGeneration++; resetPreview(); $('#file-input').value = ''; $('#import-dialog').showModal(); });
$('#import-dialog').addEventListener('close', () => { fileGeneration++; resetPreview(); $('#file-input').value = ''; });
$('#file-input').addEventListener('change', async event => {
  const generation = ++fileGeneration; resetPreview();
  const file = event.currentTarget.files[0];
  if (!file) return;
  try {
    if (file.size > MAX_BYTES) throw new Error('ファイルは2 MiBまでです。');
    if (!/\.(csv|json)$/i.test(file.name)) throw new Error('CSVまたはJSONを選択してください。ZIPは未対応です。');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (generation !== fileGeneration || !$('#import-dialog').open) return;
    const result = buildPreview(decodeFile(bytes), file.name, stores);
    preview = result;
    $('#preview-summary').replaceChildren(...[
      `追加可能 ${result.counts.valid}件`, `重複 ${result.counts.duplicate}件`, `要修正 ${result.counts.invalid}件`,
    ].map(text => element('span', '', text)));
    $('#column-mapping').textContent = '列の対応：' + result.mapping.join(' / ');
    const rows = $('#preview-rows');
    result.rows.slice(0, 100).forEach(row => {
      const node = element('div', 'preview-row');
      node.append(element('span', '', row.record?.name || `行${row.index}：${row.error}`), element('small', '', { valid: '追加', duplicate: 'スキップ', invalid: '要修正' }[row.status]));
      rows.append(node);
    });
    $('#preview-overflow').textContent = result.rows.length > 100 ? `最初の100件を表示しています。候補全体は${result.rows.length}件です。` : '';
    $('#import-preview').hidden = false;
    $('#commit-import').disabled = result.counts.valid === 0 || stores.length + result.counts.valid > MAX_STORES;
    if (stores.length + result.counts.valid > MAX_STORES) $('#import-error').textContent = '追加後の店舗数が2,000件を超えます。小さなリストに分けてください。';
  } catch (error) { if (generation === fileGeneration) { resetPreview(); $('#import-error').textContent = error.message; } }
});
$('#commit-import').addEventListener('click', () => {
  if (!preview) return;
  const selected = preview;
  preview = null; $('#commit-import').disabled = true;
  const records = selected.rows.filter(row => row.status === 'valid').map(row => ({ ...row.record, tags: [...row.record.tags], id: crypto.randomUUID(), source: 'ファイル取込', icon: '◌', tone: 'blue' }));
  if (!records.length || stores.length + records.length > MAX_STORES) return;
  stores = [...records, ...stores]; dirty = true; render(); $('#import-dialog').close();
  announce(`${records.length}件をこの画面内に追加しました。ファイルは送信されておらず、原本も変更していません。`);
});

$('#export-button').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([exportRecords(stores)], { type: 'application/json;charset=utf-8' }));
  const link = element('a'); link.href = url; link.download = 'gourmet-notebook.json';
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  announce('JSONのダウンロードを開始しました。保存できたか確認してください。画面内のデータはまだ再読み込みで消えます。');
});
function updateEstimate() {
  const field = $('#estimate-count');
  try {
    if (!field.value.trim()) throw new Error('店舗数を入力してください。');
    const count = Number(field.value), tickets = ticketsFor(count);
    $('#estimate-result').textContent = count === 0 ? '0件：処理なし・消費0枚（見積例）' : tickets > 5 ? `${count}件：${tickets}枚必要。デモ残数5枚では不足します。購入機能は未実装です。` : `消費予定${tickets}枚（見積例）。デモ残数5枚 → ${5 - tickets}枚。実際の消費はありません。`;
  } catch (error) { $('#estimate-result').textContent = error.message; }
}
$('#estimate-count').addEventListener('input', updateEstimate);
$('#classification-button').addEventListener('click', () => { updateEstimate(); $('#classification-dialog').showModal(); });
$('#about-button').addEventListener('click', () => $('#about-dialog').showModal());
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
render();
