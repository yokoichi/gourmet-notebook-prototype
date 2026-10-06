"""Approved 11-record initial data + existing synthetic flows; no capture or outside requests."""
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('headless_flows', Path(__file__).with_name('verify-headless-dom.py'))
flows = importlib.util.module_from_spec(spec)
spec.loader.exec_module(flows)

class InitialFlows(flows.HeadlessFlows):
    def initial_book(self):
        return json.loads((flows.ROOT / 'examples/initial-researched-v2.json').read_text())

    def export_book(self):
        return self.download(lambda: self.page.locator('#export-button').click())

    def test_initial_11_values_unknowns_and_historical_sources(self):
        book = self.initial_book()
        self.assertEqual(self.export_book(), book)
        cards = self.page.locator('.restaurant-card')
        flows.expect(self.page.locator('.initial-research')).to_have_count(11)
        for i, record in enumerate(book['restaurants']):
            flows.expect(cards.nth(i).locator('h3')).to_have_text(record['name'])
            if record['memo']:
                flows.expect(cards.nth(i).locator('.card-memo')).to_have_text(record['memo'])
            cards.nth(i).locator('.initial-research summary').click()
            flows.expect(cards.nth(i).locator('.initial-research')).to_contain_text('2026-10-05')
            self.assertGreater(cards.nth(i).locator('.initial-research a').count(), 0)
        for i in [3, 6, 7]:
            flows.expect(cards.nth(i).locator('.initial-research')).to_contain_text('同定未確認')
        flows.expect(cards.nth(9).locator('.initial-research')).to_contain_text('電話：不明')

    def test_same_final_json_is_duplicate_without_automatic_add(self):
        book = self.initial_book()
        self.page.locator('#import-button').click()
        self.upload('#file-input', book, 'initial-v2.json')
        flows.expect(self.page.locator('#import-preview')).to_be_visible()
        flows.expect(self.page.locator('#commit-import')).to_be_disabled()
        self.assertEqual(self.page.locator('#preview-rows .preview-row').count(), 11)
        flows.expect(self.page.locator('#preview-summary')).to_contain_text('重複 11件')
        self.page.locator('#import-dialog [data-close]').first.click()
        self.assertEqual(self.export_book(), book)

    def test_edit_protection_reimport_reload_and_confirmed_json_roundtrip(self):
        book = self.initial_book()
        self.page.locator('.restaurant-card').first.locator('.edit-button').click()
        self.page.locator('#manual-memo').fill('本人が変更したメモ\n2行目')
        self.page.locator('#manual-phone').fill('')
        self.page.locator('#manual-form button[type=submit]').click()
        flows.expect(self.page.locator('#manual-dialog')).not_to_be_visible()
        flows.expect(self.page.locator('.restaurant-card')).to_have_count(11)
        edited = self.export_book()
        self.assertEqual(edited['restaurants'][0]['memo'], '本人が変更したメモ\n2行目')
        self.assertEqual(edited['restaurants'][0]['phone'], '')
        self.page.locator('#import-button').click()
        self.upload('#file-input', book, 'initial-v2.json')
        flows.expect(self.page.locator('#import-preview')).to_be_visible()
        flows.expect(self.page.locator('#commit-import')).to_be_disabled()
        self.page.locator('#import-dialog [data-close]').first.click()
        self.assertEqual(self.export_book(), edited)
        self.page.locator('.initial-research').first.locator('summary').click()
        flows.expect(self.page.locator('.initial-research').first).to_contain_text('現在値の再確認ではありません')
        self.page.once('dialog', lambda dialog: dialog.accept())
        self.page.reload()
        flows.expect(self.page.locator('.restaurant-card')).to_have_count(11)
        self.assertEqual(self.export_book(), book)
        self.page.locator('#import-button').click()
        self.upload('#file-input', edited, 'edited-v2.json')
        flows.expect(self.page.locator('#import-preview')).to_be_visible()
        self.page.locator('#import-mode').select_option('restore')
        self.page.locator('#restore-confirm').check()
        self.page.locator('#commit-import').click()
        flows.expect(self.page.locator('#import-dialog')).not_to_be_visible()
        self.assertEqual(self.export_book(), edited)
        flows.expect(self.page.locator('.initial-research')).to_have_count(11)

if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(InitialFlows)
    outcome = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(0 if outcome.wasSuccessful() else 1)
