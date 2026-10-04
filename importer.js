export const MAX_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS = 1000;
export const MAX_STORES = 2000;

const aliases = {
  name: ['name', 'title', '店名', '店舗名', '名前', 'タイトル'],
  address: ['address', '住所'], phone: ['phone', 'telephone', '電話', '電話番号'],
  genre: ['genre', 'category', 'ジャンル'], tags: ['tags', 'タグ'],
  memo: ['memo', 'note', 'メモ', '備考'], mapsURL: ['mapsurl', 'item_content_url', 'url'],
};
const limits = { name: 200, address: 500, phone: 60, genre: 40, memo: 2000, mapsURL: 2000 };

export function decodeFile(bytes) {
  if (bytes.byteLength > MAX_BYTES) throw new Error('ファイルは2 MiBまでです。小さなリストに分けてください。');
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff)) {
    throw new Error('初版はUTF-8のみ対応しています。UTF-8で書き出してから選択してください。');
  }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, ''); }
  catch { throw new Error('文字コードを読み取れません。UTF-8のCSV/JSONを選択してください。'); }
}

export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false, afterQuote = false;
  const pushField = () => { row.push(field); field = ''; afterQuote = false; };
  const pushRow = () => {
    pushField(); if (row.some(cell => cell.trim())) rows.push(row); row = [];
    if (rows.length > MAX_ROWS + 20) throw new Error('候補は1,000件までです。リストを分けてください。');
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; afterQuote = true; }
      else field += c;
    } else if (c === '"') {
      if (field.length || afterQuote) throw new Error('CSVの引用符が不正です。元の内容を確認してください。');
      quoted = true;
    } else if (c === ',') pushField();
    else if (c === '\n' || c === '\r') { pushRow(); if (c === '\r' && text[i + 1] === '\n') i++; }
    else {
      if (afterQuote) {
        if (c === ' ' || c === '\t') continue;
        throw new Error('CSVの引用符の後に不正な文字があります。');
      }
      field += c;
    }
    if (field.length > 10000 || row.length > 100) throw new Error('CSVのセルまたは列数が上限を超えています。');
  }
  if (quoted) throw new Error('CSVの引用符が閉じられていません。');
  if (field.length || row.length || afterQuote) pushRow();
  return rows;
}

const headerKey = value => String(value).trim().toLowerCase();
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function checkDepth(value) {
  const stack = [[value, 0]];
  while (stack.length) {
    const [item, depth] = stack.pop();
    if (depth > 16) throw new Error('JSONの入れ子が深すぎます。');
    if (item && typeof item === 'object') for (const child of Object.values(item)) stack.push([child, depth + 1]);
  }
}

export function normalizeRecord(input) {
  if (!isObject(input)) throw new Error('店舗データはオブジェクトで指定してください。');
  const keys = new Map(Object.keys(input).map(key => [headerKey(key), key]));
  const result = {};
  for (const [field, names] of Object.entries(aliases)) {
    const key = names.map(name => keys.get(name)).find(name => name !== undefined);
    const value = key === undefined ? '' : input[key];
    if (field === 'tags') {
      const tags = typeof value === 'string' ? value.split(/[,;、]/) : value === null ? [] : value;
      if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) throw new Error('タグは文字列または文字列の配列にしてください。');
      result.tags = [...new Set(tags.map(tag => tag.trim()).filter(Boolean))];
      if (result.tags.length > 12 || result.tags.some(tag => tag.length > 30)) throw new Error('タグは12個まで、各30文字までです。');
      continue;
    }
    if (value !== null && typeof value !== 'string') throw new Error(`${field}は文字列で指定してください。`);
    result[field] = (value ?? '').trim();
    if (result[field].length > limits[field]) throw new Error(`${field}が長すぎます（最大${limits[field]}文字）。`);
  }
  if (!result.name) throw new Error('店名がありません。');
  if (result.mapsURL) {
    let url;
    try { url = new URL(result.mapsURL); } catch { throw new Error('URLが不正です。'); }
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('URLはhttp/httpsのみ対応しています。');
    if (url.username || url.password) throw new Error('認証情報を含むURLは対応していません。');
  }
  return result;
}

export function duplicateKeys(store) {
  const keys = [];
  if (store.mapsURL) keys.push('url:' + store.mapsURL);
  if (store.address) keys.push('name-address:' + store.name.normalize('NFKC').toLowerCase() + '\u0000' + store.address.normalize('NFKC').toLowerCase());
  return keys;
}

export function buildPreview(text, filename, existing = []) {
  if (new TextEncoder().encode(text).byteLength > MAX_BYTES) throw new Error('ファイルは2 MiBまでです。');
  text = text.replace(/^\uFEFF/, '');
  let records, mapping = [];
  if (/\.csv$/i.test(filename)) {
    const rows = parseCSV(text);
    const headerIndex = rows.slice(0, 10).findIndex(row => row.some(cell => aliases.name.includes(headerKey(cell))));
    if (headerIndex < 0) throw new Error('店名の列が見つかりません。name / title / 店名の列が必要です。');
    const headers = rows[headerIndex].map(headerKey);
    if (new Set(headers).size !== headers.length) throw new Error('CSVに同じ名前の列が複数あります。');
    for (const [field, names] of Object.entries(aliases)) {
      const found = headers.find(header => names.includes(header));
      if (found !== undefined) mapping.push(`${found} → ${field}`);
    }
    records = rows.slice(headerIndex + 1).filter(row => row.some(cell => cell.trim())).map(row => {
      if (row.length !== headers.length) return null;
      return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
    });
  } else if (/\.json$/i.test(filename)) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('JSONの書式が不正です。'); }
    checkDepth(data);
    if (Array.isArray(data)) records = data;
    else if (isObject(data) && data.schemaVersion === 1 && Array.isArray(data.restaurants)) records = data.restaurants;
    else throw new Error('JSONは店舗の配列、またはschemaVersion: 1とrestaurants配列を指定してください。MapsのJSON/GeoJSONは未対応です。');
    mapping = ['name/title/店名 → 店名', 'address・phone・genre・tags・memo/note → 任意項目'];
  } else throw new Error('CSVまたはJSONを選択してください。ZIPは初版では未対応です。');
  if (records.length > MAX_ROWS) throw new Error('候補は1,000件までです。');
  const seen = new Set(existing.flatMap(duplicateKeys));
  const rows = records.map((input, index) => {
    try {
      const record = normalizeRecord(input);
      const keys = duplicateKeys(record);
      const duplicate = keys.some(key => seen.has(key));
      if (!duplicate) keys.forEach(key => seen.add(key));
      return { index: index + 1, status: duplicate ? 'duplicate' : 'valid', record, error: '' };
    } catch (error) { return { index: index + 1, status: 'invalid', record: null, error: error.message }; }
  });
  const counts = Object.fromEntries(['valid', 'duplicate', 'invalid'].map(status => [status, rows.filter(row => row.status === status).length]));
  return { rows, counts, mapping };
}

export function ticketsFor(count) {
  if (!Number.isInteger(count) || count < 0 || count > MAX_ROWS) throw new Error('店舗数は0〜1,000の整数で入力してください。');
  return Math.ceil(count / 100);
}

export function exportRecords(stores) {
  return JSON.stringify({ schemaVersion: 1, restaurants: stores.map(store => ({ name: store.name, address: store.address, phone: store.phone, genre: store.genre, tags: [...store.tags], memo: store.memo, mapsURL: store.mapsURL })) }, null, 2);
}
