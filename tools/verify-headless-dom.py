#!/usr/bin/env python3
"""Synthetic UI checks using existing Playwright + Chrome; no image/video/trace capture."""
import copy
import functools
import http.server
import json
import pathlib
import tempfile
import threading
import unittest
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parents[1]
MAP_URL = 'https://www.google.com/maps/place/data=!4m2!3m1!1s0x1234:0xfedcba9876543210'
CSV = 'タイトル,メモ,URL,タグ,コメント\r\n合成DOMカフェ,合成の非共有メモ,' + MAP_URL + ',合成タグ,合成コメント\r\n'


def exchange(transport, **values):
    request = transport['request']
    row = copy.deepcopy(request['sourceRow'])
    restaurant = dict(name=row['cellsByColumn']['タイトル'], genre='カフェ', phone='00-0000-0000', address='架空県合成市1', tags=[], memo='', urls=[row['cellsByColumn']['URL']], customValues={})
    restaurant.update(values)
    evidence = {}
    for key in restaurant:
        copied = key in ('name', 'urls')
        researched = key in ('address', 'phone', 'genre') and bool(restaurant[key])
        evidence[key] = dict(status='copied_csv' if copied else 'researched' if researched else 'unknown', sourceIds=['synthetic-official'] if researched else [], sourceColumn='タイトル' if key == 'name' else 'URL' if key == 'urls' else '', sourceLineStart=row['physicalLineStart'] if copied else 0, sourceLineEnd=row['physicalLineEnd'] if copied else 0, rule='', reason='')
    result = dict(restaurant=restaurant, sourceRow=row, reviewDisposition='retain', fieldEvidence=evidence, unknownFields=[key for key in ('address', 'phone', 'genre') if not restaurant[key]], classificationCandidates=[], needsReview=[], warnings=[], errors=[], identity=dict(status='matched', method='direct_map_id', sourceIds=['synthetic-official'], originalIdentifier='0x1234:0xfedcba9876543210', publicIdentifier='0x1234:0xfedcba9876543210', explanation='合成DOM検証'), sources=[dict(id='synthetic-official', url=MAP_URL, title='合成公開出典', observedAt='2026-10-06', accessRoute='body', claim='合成施設の公開情報')])
    return dict(format='gourmet-notebook-ai-exchange', schemaVersion=2, **{key: request[key] for key in ('researchMode', 'promptVersion', 'requestId', 'workspaceId', 'candidateId', 'candidateRevision', 'urlJobId')}, inputHash=transport['inputHash'], result=result)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


class HeadlessFlows(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = 'http://127.0.0.1:' + str(cls.server.server_port)
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(channel='chrome', headless=True, args=['--disable-background-networking', '--disable-component-update', '--no-first-run'])
        print('ENGINE Chrome ' + cls.browser.version + '; headless; screenshots/video/trace = disabled', flush=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='gourmet-dom-')
        self.context = self.browser.new_context(accept_downloads=True, viewport={'width': 390, 'height': 844})
        self.external = []
        self.errors = []
        def route(request_route):
            url = request_route.request.url
            if url.startswith(self.origin + '/'):
                request_route.continue_()
            else:
                self.external.append(urlsplit(url).scheme + '://' + (urlsplit(url).hostname or ''))
                request_route.abort()
        self.context.route('**/*', route)
        self.page = self.context.new_page()
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.goto(self.origin + '/')
        expect(self.page.locator('.restaurant-card')).to_have_count(8)

    def tearDown(self):
        self.context.close()
        self.temp.cleanup()
        self.assertEqual(self.errors, [], 'uncaught page errors')
        self.assertEqual(self.external, [], 'unexpected external page requests')

    def open_research(self):
        self.page.locator('#research-button').click()
        expect(self.page.locator('#research-dialog')).to_be_visible()

    def upload(self, selector, data, name):
        buffer = data.encode('utf-8') if isinstance(data, str) else json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.page.locator(selector).set_input_files({'name': name, 'mimeType': 'text/csv' if name.endswith('.csv') else 'application/json', 'buffer': buffer})

    def row(self, index=0):
        return self.page.locator('.research-row').nth(index)

    def open_row(self, index=0):
        row = self.row(index)
        details = row.locator('details')
        if not details.evaluate('(node) => node.open'):
            row.locator('summary').click()
        return row

    def download(self, action):
        with self.page.expect_download() as event:
            action()
        download = event.value
        path = pathlib.Path(self.temp.name) / download.suggested_filename
        download.save_as(str(path))
        return json.loads(path.read_text())

    def start(self, sequential=False, csv=CSV):
        self.open_research()
        self.upload('#research-csv', csv, 'synthetic.csv')
        expect(self.page.locator('#research-status')).to_contain_text('原本')
        for index in range(self.page.locator('.research-row').count()):
            self.open_row(index).locator('select').select_option('new')
        self.page.locator('#research-confirm-raw').click()
        expect(self.page.locator('#research-status')).to_contain_text('原値')
        if sequential:
            self.page.locator('#research-policy').check()
            expect(self.page.locator('#research-policy')).to_be_checked()
            expect(self.page.locator('#research-status')).to_contain_text('方針')
        requests = self.download(lambda: self.page.locator('#research-requests').click())
        self.assertEqual(len(requests['transports']), self.page.locator('.research-row').count())
        self.assertNotIn('合成の非共有メモ', json.dumps(requests, ensure_ascii=False))
        self.assertNotIn('合成コメント', json.dumps(requests, ensure_ascii=False))
        return requests['transports']

    def result(self, data):
        self.upload('#research-result-file', data, 'synthetic-result.json')
        expect(self.page.locator('#research-status')).to_contain_text('受入')
        expect(self.page.locator('#research-result-file')).to_be_enabled()

    def backup(self):
        return self.download(lambda: self.page.locator('#research-backup').click())

    def close_research(self):
        self.page.locator('#research-dialog [data-close]').click()
        expect(self.page.locator('#research-dialog')).not_to_be_visible()

    def test_result_preview_manual_apply_and_session_roundtrip(self):
        transport = self.start()[0]
        expect(self.page.locator('#research-policy')).not_to_be_checked()
        self.result(exchange(transport, phone=''))
        row = self.open_row()
        expect(row).to_contain_text('元コメント：合成コメント')
        expect(row).to_contain_text('電話：現在「」 → 不明・空欄保持')
        apply = row.get_by_role('button', name='この行の空欄を補完', exact=True)
        expect(apply).to_be_enabled()
        apply.click()
        expect(self.page.locator('#research-status')).to_contain_text('補完しました')
        backup = self.backup()
        self.assertEqual(len(backup['notebook']['restaurants']), 9)
        record = backup['notebook']['restaurants'][-1]
        self.assertEqual(record['address'], '架空県合成市1')
        self.assertEqual(record['memo'], '合成の非共有メモ')
        self.assertEqual(record['tags'], ['合成タグ'])
        self.assertEqual(len(backup['applicationReceipts']), 2)
        self.upload('#research-restore-file', backup, 'session.json')
        expect(self.page.locator('#research-status')).to_contain_text('確認が必要')
        self.page.locator('#research-replace-confirm').check()
        self.upload('#research-restore-file', backup, 'session.json')
        expect(self.page.locator('#research-status')).to_contain_text('復元しました')
        self.result(exchange(transport, phone=''))
        restored = self.backup()
        self.assertEqual(restored['notebook'], backup['notebook'])
        self.assertEqual(len(restored['applicationReceipts']), 2)

    def test_sequential_apply_and_manual_edit_empty_touch_keep_current_values(self):
        transport = self.start(sequential=True)[0]
        self.open_row().get_by_role('button', name='手動で編集・候補を採用', exact=True).click()
        expect(self.page.locator('#manual-dialog')).to_be_visible()
        self.page.locator('#manual-address').fill('本人の合成住所')
        self.page.locator('#manual-phone').fill('')
        self.page.locator('#manual-phone').press('Backspace')
        self.page.locator('#manual-form button[type=submit]').click()
        expect(self.page.locator('#manual-dialog')).not_to_be_visible()
        self.open_research()
        self.result(exchange(transport))
        saved = self.backup()
        record = saved['notebook']['restaurants'][-1]
        self.assertEqual(record['address'], '本人の合成住所')
        self.assertEqual(record['phone'], '')
        self.assertEqual(record['genre'], 'カフェ')
        self.assertEqual(record['memo'], '合成の非共有メモ')

    def test_cancel_explicit_retry_old_and_duplicate_results(self):
        transport = self.start(sequential=True)[0]
        self.open_row().get_by_role('button', name='要求を取消', exact=True).click()
        expect(self.page.locator('#research-status')).to_contain_text('取り消しました')
        self.result(exchange(transport))
        expect(self.page.locator('#research-status')).to_contain_text('拒否 1件')
        retry = self.download(lambda: self.open_row().get_by_role('button', name='このURLを再試行する要求を保存', exact=True).click())['transports'][0]
        self.assertNotEqual(retry['request']['requestId'], transport['request']['requestId'])
        self.result(exchange(transport))
        expect(self.page.locator('#research-status')).to_contain_text('拒否 1件')
        self.result(exchange(retry))
        self.result(exchange(retry))
        saved = self.backup()
        self.assertEqual(len(saved['notebook']['restaurants']), 9)
        self.assertEqual(len(saved['applicationReceipts']), 2)

    def test_invalid_result_error_and_recovery_does_not_lose_original(self):
        transport = self.start()[0]
        bad = exchange(transport)
        bad['result']['fieldEvidence']['address']['sourceIds'] = []
        self.result(bad)
        expect(self.page.locator('#research-status')).to_contain_text('拒否 1件')
        expect(self.row()).to_contain_text('失敗')
        self.result(exchange(transport))
        self.open_row().get_by_role('button', name='この行の空欄を補完', exact=True).click()
        expect(self.page.locator('#research-status')).to_contain_text('補完しました')
        saved = self.backup()
        self.assertEqual(saved['notebook']['restaurants'][-1]['memo'], '合成の非共有メモ')
        self.upload('#research-result-file', '{"a":1,"a":2}', 'bad.json')
        expect(self.page.locator('#research-status')).to_contain_text('JSON')
        self.assertEqual(self.backup()['notebook'], saved['notebook'])

    def test_duplicate_csv_warning_and_ordinary_append_keep_research(self):
        self.start(csv=CSV + '合成DOM別行,合成別メモ,' + MAP_URL + ',,合成別コメント\r\n')
        expect(self.row()).to_contain_text('重複候補を確認')
        saved = self.backup()
        self.close_research()
        self.page.locator('#import-button').click()
        v2 = dict(schemaVersion=2, format='gourmet-notebook-prototype', fieldSettings=saved['notebook']['fieldSettings'], restaurants=[dict(name='合成普通追加', genre='', phone='', address='', memo='', tags=[], urls=[], customValues={})])
        self.upload('#file-input', v2, 'synthetic-v2.json')
        expect(self.page.locator('#commit-import')).to_be_enabled()
        self.assertTrue(self.page.locator('#import-mode option[value=restore]').evaluate('(option) => option.disabled && option.matches(":disabled")'))
        self.page.locator('#commit-import').click()
        expect(self.page.locator('#import-dialog')).not_to_be_visible()
        self.open_research()
        after = self.backup()
        self.assertEqual(len(after['notebook']['restaurants']), 11)
        self.assertEqual(after['workspaceId'], saved['workspaceId'])
        self.assertEqual(after['applicationReceipts'], saved['applicationReceipts'])


    def test_new_manual_record_keeps_existing_requests_and_fill_targets(self):
        transport = self.start(sequential=True)[0]
        before = self.backup()
        self.close_research()
        self.page.locator('#add-button').click()
        self.page.locator('#manual-name').fill('合成手動の新店')
        self.page.locator('#manual-form button[type=submit]').click()
        expect(self.page.locator('#manual-dialog')).not_to_be_visible()
        self.open_research()
        current = self.backup()
        self.assertEqual(current['candidates'][0]['activeRequest'], before['candidates'][0]['activeRequest'])
        self.result(exchange(transport))
        current = self.backup()
        record = next(r for r in current['notebook']['restaurants'] if r['name'] == '合成DOMカフェ')
        self.assertEqual(record['address'], '架空県合成市1')
        self.assertEqual(len(current['notebook']['restaurants']), 10)

    def test_close_during_actual_file_read_ignores_late_result(self):
        transport = self.start(sequential=True)[0]
        before = self.backup()
        self.page.evaluate("""() => {
          const read = File.prototype.arrayBuffer;
          window.syntheticReadStarted = false;
          File.prototype.arrayBuffer = function(...args) {
            window.syntheticReadStarted = true;
            return new Promise(resolve => { window.releaseSyntheticRead = async () => { resolve(await read.apply(this, args)); }; });
          };
        }""")
        self.upload('#research-result-file', exchange(transport), 'synthetic-delayed.json')
        self.page.wait_for_function('window.syntheticReadStarted')
        self.close_research()
        self.page.evaluate('window.releaseSyntheticRead()')
        self.open_research()
        expect(self.page.locator('#research-backup')).to_be_enabled()
        self.assertEqual(self.backup()['notebook'], before['notebook'])
        self.assertEqual(self.backup()['applicationReceipts'], before['applicationReceipts'])

    def test_explicit_end_enables_ordinary_v2_confirmed_restore(self):
        self.start()
        saved = self.backup()
        self.page.locator('#research-end').click()
        expect(self.page.locator('#research-status')).to_contain_text('終了を明示')
        self.page.locator('#research-end-confirm').check()
        self.page.locator('#research-end').click()
        expect(self.page.locator('#research-status')).to_contain_text('終了しました')
        self.close_research()
        self.page.locator('#import-button').click()
        self.upload('#file-input', saved['notebook'], 'synthetic-book.json')
        expect(self.page.locator('#import-preview')).to_be_visible()
        self.assertFalse(self.page.locator('#import-mode option[value=restore]').evaluate('(option) => option.disabled'))
        self.page.locator('#import-mode').select_option('restore')
        expect(self.page.locator('#commit-import')).to_be_disabled()
        self.page.locator('#restore-confirm').check()
        self.page.locator('#commit-import').click()
        expect(self.page.locator('#import-dialog')).not_to_be_visible()
        book = self.download(lambda: self.page.locator('#export-button').click())
        self.assertEqual(book, saved['notebook'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
