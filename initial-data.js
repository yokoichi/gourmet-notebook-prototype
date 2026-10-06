import {normalizeRestaurant,restaurantValue,serializeState,validateFieldSettings} from './model.js';

export const initialNotebook = freeze({
  "schemaVersion": 2,
  "format": "gourmet-notebook-prototype",
  "fieldSettings": [
    {
      "id": "name",
      "kind": "builtin",
      "label": "店名",
      "visible": true,
      "required": true
    },
    {
      "id": "genre",
      "kind": "builtin",
      "label": "ジャンル",
      "visible": true,
      "required": false
    },
    {
      "id": "phone",
      "kind": "builtin",
      "label": "電話",
      "visible": true,
      "required": false
    },
    {
      "id": "address",
      "kind": "builtin",
      "label": "住所",
      "visible": true,
      "required": false
    },
    {
      "id": "tags",
      "kind": "builtin",
      "label": "タグ",
      "visible": true,
      "required": false
    },
    {
      "id": "memo",
      "kind": "builtin",
      "label": "メモ",
      "visible": true,
      "required": false
    },
    {
      "id": "urls",
      "kind": "builtin",
      "label": "URL",
      "visible": true,
      "required": false
    }
  ],
  "restaurants": [
    {
      "name": "元祖 平壌冷麺 食道園",
      "genre": "冷麺・焼肉",
      "phone": "019-651-4590",
      "address": "岩手県盛岡市大通1丁目8-2",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/%E5%85%83%E7%A5%96+%E5%B9%B3%E5%A3%8C%E5%86%B7%E9%BA%BA+%E9%A3%9F%E9%81%93%E5%9C%92/data=!4m2!3m1!1s0x5f8576254c3aa50b:0x7c6facf565e963f8"
      ],
      "customValues": {}
    },
    {
      "name": "不来方じゃじゃめん",
      "genre": "じゃじゃ麺",
      "phone": "019-651-7575",
      "address": "岩手県盛岡市大通3-1-23 クリエイトビル B1F",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/%E4%B8%8D%E6%9D%A5%E6%96%B9%E3%81%98%E3%82%83%E3%81%98%E3%82%83%E3%82%81%E3%82%93/data=!4m2!3m1!1s0x5f8576304067628b:0xb8053d480f9957d5"
      ],
      "customValues": {}
    },
    {
      "name": "釜定",
      "genre": "南部鉄器",
      "phone": "019-622-3911",
      "address": "岩手県盛岡市紺屋町2-5",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/%E9%87%9C%E5%AE%9A/data=!4m2!3m1!1s0x5f8576269a4d67e1:0x5df5e8a82446b94f"
      ],
      "customValues": {}
    },
    {
      "name": "茣蓙九【森九商店】",
      "genre": "",
      "phone": "",
      "address": "",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/%E8%8C%A3%E8%93%99%E4%B9%9D%E3%80%90%E6%A3%AE%E4%B9%9D%E5%95%86%E5%BA%97%E3%80%91/data=!4m2!3m1!1s0x5f8576269d89f94f:0x75fecbf840a91427"
      ],
      "customValues": {}
    },
    {
      "name": "みな実古琲店",
      "genre": "喫茶店",
      "phone": "0178-47-4373",
      "address": "青森県八戸市番町23-1",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/%E3%81%BF%E3%81%AA%E5%AE%9F%E5%8F%A4%E7%90%B2%E5%BA%97/data=!4m2!3m1!1s0x5f9b5384d9938e07:0x704167f0bb78c052"
      ],
      "customValues": {}
    },
    {
      "name": "WHARF TANECHI(ワーフ タネチ)",
      "genre": "ソフトクリーム・売店・BBQ",
      "phone": "0178-38-8420",
      "address": "青森県八戸市鮫町字棚久保14-112",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/WHARF+TANECHI(%E3%83%AF%E3%83%BC%E3%83%95+%E3%82%BF%E3%83%8D%E3%83%81)/data=!4m2!3m1!1s0x5f9b53f69b31320d:0xea659f3c5b23b446"
      ],
      "customValues": {}
    },
    {
      "name": "奇跡の鳥居",
      "genre": "",
      "phone": "",
      "address": "",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/%E5%A5%87%E8%B7%A1%E3%81%AE%E9%B3%A5%E5%B1%85/data=!4m2!3m1!1s0x5f84ad6622dafe0f:0xcc9c28b6eb5514a8"
      ],
      "customValues": {}
    },
    {
      "name": "八戸グランドホテル",
      "genre": "",
      "phone": "",
      "address": "",
      "tags": [],
      "memo": "2日間泊まる宿",
      "urls": [
        "https://www.google.com/maps/place/%E5%85%AB%E6%88%B8%E3%82%B0%E3%83%A9%E3%83%B3%E3%83%89%E3%83%9B%E3%83%86%E3%83%AB/data=!4m2!3m1!1s0x6000df9043f5435d:0x9bb01ec23eed0db6"
      ],
      "customValues": {}
    },
    {
      "name": "元祖長浜屋台ラーメン一心亭 八戸分店",
      "genre": "ラーメン",
      "phone": "0178-22-6090",
      "address": "青森県八戸市大字六日町33-1 ライオンビル八戸館 1F",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/%E5%85%83%E7%A5%96%E9%95%B7%E6%B5%9C%E5%B1%8B%E5%8F%B0%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%E4%B8%80%E5%BF%83%E4%BA%AD+%E5%85%AB%E6%88%B8%E5%88%86%E5%BA%97/data=!4m2!3m1!1s0x5f9b53f8afa8e6f5:0xa65b832879dfaafd"
      ],
      "customValues": {}
    },
    {
      "name": "末廣ラーメン本舗 八戸長横町分店",
      "genre": "ラーメン",
      "phone": "",
      "address": "青森県八戸市長横町4-10",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/%E6%9C%AB%E5%BB%A3%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%E6%9C%AC%E8%88%97+%E5%85%AB%E6%88%B8%E9%95%B7%E6%A8%AA%E7%94%BA%E5%88%86%E5%BA%97/data=!4m2!3m1!1s0x5f9b53004a9d0791:0xe89fb34426f5c519"
      ],
      "customValues": {}
    },
    {
      "name": "南部民芸料理 蔵",
      "genre": "郷土料理・海鮮・居酒屋",
      "phone": "0178-22-1027",
      "address": "青森県八戸市十三日町28 花真ビル 1F",
      "tags": [],
      "memo": "",
      "urls": [
        "https://www.google.com/maps/place/%E5%8D%97%E9%83%A8%E6%B0%91%E8%8A%B8%E6%96%99%E7%90%86+%E8%94%B5/data=!4m2!3m1!1s0x5f9b5357af2e2b01:0x89a71f017196e84e"
      ],
      "customValues": {}
    }
  ]
});

export const initialResearch = freeze([
  {
    "name": "元祖 平壌冷麺 食道園",
    "urls": [
      "https://www.google.com/maps/place/%E5%85%83%E7%A5%96+%E5%B9%B3%E5%A3%8C%E5%86%B7%E9%BA%BA+%E9%A3%9F%E9%81%93%E5%9C%92/data=!4m2!3m1!1s0x5f8576254c3aa50b:0x7c6facf565e963f8"
    ],
    "observedAt": "2026-10-05",
    "identity": "maps_id_matched",
    "confidence": "地図ID同定確認",
    "currentStatus": "公式に2026年10月の定休日と営業案内を掲載。当日の営業は未確認。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 3
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 3
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 3
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 3
      },
      "address": {
        "status": "researched",
        "sources": [
          "01a"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "phone": {
        "status": "researched",
        "sources": [
          "01a"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "genre": {
        "status": "researched",
        "sources": [
          "01b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "ジャンルは出典の事業・提供品目を短い分類語へ整理",
        "identityMethod": "maps_id_matched"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "01a",
        "url": "https://shokudoen.com/info/",
        "title": "食道園 店舗案内",
        "type": "store_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "所在地・電話を案内。"
      },
      {
        "id": "01b",
        "url": "https://shokudoen.com/",
        "title": "食道園 公式",
        "type": "store_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "冷麺と焼肉を提供し、2026-10-01付の10月休業日案内がある。同名店との無関係、支店等がない旨を明記。"
      }
    ],
    "notes": [
      "同名店を支店として統合しない。"
    ]
  },
  {
    "name": "不来方じゃじゃめん",
    "urls": [
      "https://www.google.com/maps/place/%E4%B8%8D%E6%9D%A5%E6%96%B9%E3%81%98%E3%82%83%E3%81%98%E3%82%83%E3%82%81%E3%82%93/data=!4m2!3m1!1s0x5f8576304067628b:0xb8053d480f9957d5"
    ],
    "observedAt": "2026-10-05",
    "identity": "maps_id_matched",
    "confidence": "地図ID同定確認",
    "currentStatus": "公式サイトに店舗・持ち帰り案内あり。更新日と当日の営業は未確認。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 4
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 4
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 4
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 4
      },
      "address": {
        "status": "researched",
        "sources": [
          "02a"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "phone": {
        "status": "researched",
        "sources": [
          "02a",
          "02c"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "genre": {
        "status": "researched",
        "sources": [
          "02a",
          "02c"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "ジャンルは出典の事業・提供品目を短い分類語へ整理",
        "identityMethod": "maps_id_matched"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "02a",
        "url": "http://kozukatajaja.jp/",
        "title": "不来方じゃじゃめん 公式",
        "type": "store_official",
        "observedAt": "2026-10-05",
        "accessRoute": "curl_text_body",
        "claim": "店舗住所とTEL/FAX 019-651-7575、じゃじゃ麺と持ち帰り案内を確認。"
      },
      {
        "id": "02b",
        "url": "https://iwatetabi.jp/spots/69964/",
        "title": "いわての旅 不来方じゃじゃめん",
        "type": "tourism_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "住所は一致するが電話7576・FAX7575と記載。"
      },
      {
        "id": "02c",
        "url": "https://www.morioka-hachimantai.jp/spot/903/",
        "title": "モリハチ旅 じゃじゃ麺",
        "type": "tourism_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "同住所のじゃじゃ麺提供店として電話7575を案内。"
      }
    ],
    "notes": [
      "県観光案内の電話末尾7576との食い違いは公式店舗案内を優先。仙台市の同名閉店掲載は別候補として除外。HTTPS本文取得502、HTTPで公式本文確認。"
    ]
  },
  {
    "name": "釜定",
    "urls": [
      "https://www.google.com/maps/place/%E9%87%9C%E5%AE%9A/data=!4m2!3m1!1s0x5f8576269a4d67e1:0x5df5e8a82446b94f"
    ],
    "observedAt": "2026-10-05",
    "identity": "maps_id_matched",
    "confidence": "地図ID同定確認",
    "currentStatus": "南部鉄器協同組合の組合員一覧と盛岡手づくり村の店舗案内に掲載。当日の営業は未確認。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 5
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 5
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 5
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 5
      },
      "address": {
        "status": "researched",
        "sources": [
          "03a",
          "03b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "phone": {
        "status": "researched",
        "sources": [
          "03a",
          "03b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "genre": {
        "status": "researched",
        "sources": [
          "03b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "ジャンルは出典の事業・提供品目を短い分類語へ整理",
        "identityMethod": "maps_id_matched"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "03a",
        "url": "https://www.ginga.or.jp/nanbu/cooperative.html",
        "title": "南部鉄器協同組合 組合概要",
        "type": "industry_cooperative",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "釜定の所在地と電話を掲載。"
      },
      {
        "id": "03b",
        "url": "https://tezukurimura.com/koubou/kamasada/",
        "title": "盛岡手づくり村 釜定",
        "type": "facility_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "鉄瓶・鉄鍋の制作と所在地・電話・営業時間を紹介。"
      }
    ],
    "notes": [
      "飲食店に変換しない。紹介サイト運営施設自体の住所・電話を混入させない。"
    ]
  },
  {
    "name": "茣蓙九【森九商店】",
    "urls": [
      "https://www.google.com/maps/place/%E8%8C%A3%E8%93%99%E4%B9%9D%E3%80%90%E6%A3%AE%E4%B9%9D%E5%95%86%E5%BA%97%E3%80%91/data=!4m2!3m1!1s0x5f8576269d89f94f:0x75fecbf840a91427"
    ],
    "observedAt": "2026-10-05",
    "identity": "corroborated_candidate_maps_unverified",
    "confidence": "同定未確認（候補出典）",
    "currentStatus": "県公式観光案内に所在地・利用時間が掲載。現地の営業状態は未確認。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 6
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 6
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 6
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 6
      },
      "address": {
        "status": "unknown",
        "reason": "同一施設のID照合を完了できないため、候補情報を補完しない"
      },
      "phone": {
        "status": "unknown",
        "reason": "同一施設のID照合を完了できないため、候補情報を補完しない"
      },
      "genre": {
        "status": "unknown",
        "reason": "同一施設のID照合を完了できないため、候補情報を補完しない"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "04a",
        "url": "https://iwatetabi.jp/spots/5036/",
        "title": "いわての旅 ござ九",
        "type": "tourism_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "紺屋町1-31・019-622-7129・利用時間を掲載。"
      },
      {
        "id": "04b",
        "url": "https://www.city.morioka.iwate.jp/kankou/kankou/1037106/rekishi/1009379/1009392.html",
        "title": "盛岡市 景観重要建造物 茣蓙九",
        "type": "municipal",
        "observedAt": "2026-10-05",
        "accessRoute": "web_search_snippet",
        "claim": "茣蓙九を現森九商店と紹介。2023-04-11更新。"
      },
      {
        "id": "04c",
        "url": "https://www.instagram.com/goza.ku/",
        "title": "茣蓙九 公開プロフィール",
        "type": "store_profile_candidate",
        "observedAt": "2026-10-05",
        "accessRoute": "web_search_snippet",
        "claim": "森九商店（ござ九）・盛岡の荒物雑貨屋と表示。プロフィール本文の直接取得は制限。"
      },
      {
        "id": "04d",
        "url": "https://kotabi.jp/iwate/morioka539/",
        "title": "岩手小旅 ござ九・森九商店",
        "type": "secondary_local_article",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "荒物・日用品の雑貨店と同所在地を紹介。2019年の記事。"
      }
    ],
    "notes": [
      "秋田県の同名『森九商店』は除外。個人地域記事の埋込地図は別IDで、厳密一致の根拠にしない。Maps IDは要確認。"
    ]
  },
  {
    "name": "みな実古琲店",
    "urls": [
      "https://www.google.com/maps/place/%E3%81%BF%E3%81%AA%E5%AE%9F%E5%8F%A4%E7%90%B2%E5%BA%97/data=!4m2!3m1!1s0x5f9b5384d9938e07:0x704167f0bb78c052"
    ],
    "observedAt": "2026-10-05",
    "identity": "maps_id_matched",
    "confidence": "地図ID同定確認",
    "currentStatus": "地域文化発信団体のパートナー案内に掲載（2026年欄あり）。当日の営業は未確認。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 7
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 7
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 7
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 7
      },
      "address": {
        "status": "researched",
        "sources": [
          "05a",
          "05b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "phone": {
        "status": "researched",
        "sources": [
          "05a",
          "05b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "genre": {
        "status": "researched",
        "sources": [
          "05a",
          "05c"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "ジャンルは出典の事業・提供品目を短い分類語へ整理",
        "identityMethod": "maps_id_matched"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "05a",
        "url": "https://historia8.org/partner/qgw1l6l1n/",
        "title": "はちのへヒストリア みな実古琲店",
        "type": "local_cultural_partner_directory",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "珈琲店・ギャラリーとして番町23-1と電話を掲載。"
      },
      {
        "id": "05b",
        "url": "https://8machi.com/products/0010",
        "title": "はちまち みな実古琲店",
        "type": "secondary_local_shop_directory",
        "observedAt": "2026-10-05",
        "accessRoute": "web_and_curl_text_body",
        "claim": "所在地・電話を掲載。元URLと同じ埋込地図ID。掲載情報は取材時点という注記あり。"
      },
      {
        "id": "05c",
        "url": "https://8machi.com/products/minamicoffee",
        "title": "はちまち 移転取材",
        "type": "secondary_interview",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "2022-09-06の記事で2022年6月の三日町から番町への移転を確認。"
      }
    ],
    "notes": [
      "旧所在地三日町は採用しない。単なる推測で移転と判断したのではなく、日付のある取材記事を根拠に記録。"
    ]
  },
  {
    "name": "WHARF TANECHI(ワーフ タネチ)",
    "urls": [
      "https://www.google.com/maps/place/WHARF+TANECHI(%E3%83%AF%E3%83%BC%E3%83%95+%E3%82%BF%E3%83%8D%E3%83%81)/data=!4m2!3m1!1s0x5f9b53f69b31320d:0xea659f3c5b23b446"
    ],
    "observedAt": "2026-10-05",
    "identity": "maps_id_matched",
    "confidence": "地図ID同定確認",
    "currentStatus": "運営者と地域公式観光サイトに施設の提供サービスと営業案内掲載。当日の営業は未確認。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 8
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 8
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 8
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 8
      },
      "address": {
        "status": "researched",
        "sources": [
          "06a",
          "06b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "phone": {
        "status": "researched",
        "sources": [
          "06b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "genre": {
        "status": "researched",
        "sources": [
          "06a",
          "06b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "ジャンルは出典の事業・提供品目を短い分類語へ整理",
        "identityMethod": "maps_id_matched"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "06a",
        "url": "https://acpromote.jp/wharf-tanechi/",
        "title": "ACプロモート WHARF TANECHI",
        "type": "operator_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "所在地とソフトクリーム・物販・BBQサービスを案内。"
      },
      {
        "id": "06b",
        "url": "https://visithachinohe.com/spot/wharf-tanechi/",
        "title": "VISITはちのへ WHARF TANECHI",
        "type": "tourism_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body_and_public_html_map_link",
        "claim": "同所在地・0178-38-8420・地域交流施設として案内。 公開HTMLの埋込地図の識別子対が元Maps URLと完全一致。"
      }
    ],
    "notes": [
      "単一のレストランに狭めない。2026-10-05の追加照合で、観光案内の埋込地図にあるURLエンコードされた完全ID一致を確認。"
    ]
  },
  {
    "name": "奇跡の鳥居",
    "urls": [
      "https://www.google.com/maps/place/%E5%A5%87%E8%B7%A1%E3%81%AE%E9%B3%A5%E5%B1%85/data=!4m2!3m1!1s0x5f84ad6622dafe0f:0xcc9c28b6eb5514a8"
    ],
    "observedAt": "2026-10-05",
    "identity": "unresolved",
    "confidence": "同定未確認（候補出典）",
    "currentStatus": "元URLの施設の現況は不明。候補神社の紹介記事を元施設の営業・存在保証にしない。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 9
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 9
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 9
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 9
      },
      "address": {
        "status": "unknown",
        "reason": "同一施設のID照合を完了できないため、候補情報を補完しない"
      },
      "phone": {
        "status": "unknown",
        "reason": "同一施設のID照合を完了できないため、候補情報を補完しない"
      },
      "genre": {
        "status": "unknown",
        "reason": "同一施設のID照合を完了できないため、候補情報を補完しない"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "07a",
        "url": "https://visithachinohe.com/stories/okuki-area/",
        "title": "VISITはちのへ 大久喜エリア",
        "type": "tourism_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "八戸大久喜の厳島神社の鳥居を同じ呼称で紹介。神社所在地は大字鮫町字大作平45だが、元CSVとの同一性は未確定。"
      },
      {
        "id": "07b",
        "url": "https://hachinoheminamihama.com/fr/3",
        "title": "八戸南浜漁師直送市場",
        "type": "local_operator",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "大久喜漁港の厳島神社に同呼称を使用。"
      }
    ],
    "notes": [
      "3補完欄を空欄で保持し、11件から削除しない。候補の神社と鳥居は別ピンの可能性があるが、それを一致と断定しない。観光記事にある別施設『浜小屋』の博物館電話は転記しない。"
    ]
  },
  {
    "name": "八戸グランドホテル",
    "urls": [
      "https://www.google.com/maps/place/%E5%85%AB%E6%88%B8%E3%82%B0%E3%83%A9%E3%83%B3%E3%83%89%E3%83%9B%E3%83%86%E3%83%AB/data=!4m2!3m1!1s0x6000df9043f5435d:0x9bb01ec23eed0db6"
    ],
    "observedAt": "2026-10-05",
    "identity": "corroborated_candidate_maps_unverified",
    "confidence": "同定未確認（候補出典）",
    "currentStatus": "公式サイトに宿泊予約導線と2026-08-27付の設備案内あり。当日の営業は未確認。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 10
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 10
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 10
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 10
      },
      "address": {
        "status": "unknown",
        "reason": "同一施設のID照合を完了できないため、候補情報を補完しない"
      },
      "phone": {
        "status": "unknown",
        "reason": "同一施設のID照合を完了できないため、候補情報を補完しない"
      },
      "genre": {
        "status": "unknown",
        "reason": "同一施設のID照合を完了できないため、候補情報を補完しない"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "08a",
        "url": "https://hachinohegrandhotel.com/access/",
        "title": "八戸グランドホテル 公式アクセス",
        "type": "hotel_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "番町14番地・0178-46-1234を掲載。"
      },
      {
        "id": "08b",
        "url": "https://hachinohegrandhotel.com/",
        "title": "八戸グランドホテル 公式",
        "type": "hotel_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "宿泊・レストラン等を案内し、2026年の新着案内を掲載。"
      }
    ],
    "notes": [
      "CSVメモは検索・外部サイトに送信していない。滞在・予約の実行を推定しない。Maps IDは要確認。"
    ]
  },
  {
    "name": "元祖長浜屋台ラーメン一心亭 八戸分店",
    "urls": [
      "https://www.google.com/maps/place/%E5%85%83%E7%A5%96%E9%95%B7%E6%B5%9C%E5%B1%8B%E5%8F%B0%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%E4%B8%80%E5%BF%83%E4%BA%AD+%E5%85%AB%E6%88%B8%E5%88%86%E5%BA%97/data=!4m2!3m1!1s0x5f9b53f8afa8e6f5:0xa65b832879dfaafd"
    ],
    "observedAt": "2026-10-05",
    "identity": "public_maps_encoded_id_matched",
    "confidence": "公開リンクID対応による同定（推論・Google公式仕様の保証なし）",
    "currentStatus": "複数の現行公開店舗案内に掲載。現在の店舗公式案内は取得できず、当日の営業・閉店有無は未確認。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 11
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 11
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 11
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 11
      },
      "address": {
        "status": "researched",
        "sources": [
          "09a",
          "09b",
          "09c",
          "09d"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "public_maps_encoded_id_matched"
      },
      "phone": {
        "status": "researched",
        "sources": [
          "09a",
          "09b"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "public_maps_encoded_id_matched"
      },
      "genre": {
        "status": "researched",
        "sources": [
          "09a",
          "09b",
          "09c",
          "09d"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "ジャンルは出典の事業・提供品目を短い分類語へ整理",
        "identityMethod": "public_maps_encoded_id_matched"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "09a",
        "url": "https://tabelog.com/aomori/A0203/A020301/2000834/",
        "title": "食べログ 一心亭 八戸分店",
        "type": "secondary_restaurant_directory",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "ラーメン・六日町33-1・0178-22-6090を掲載。"
      },
      {
        "id": "09b",
        "url": "https://r.gnavi.co.jp/811n5u3m0000/",
        "title": "ぐるなび 一心亭 八戸分店",
        "type": "secondary_restaurant_directory",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "同所在地・電話、ラーメン店として紹介。"
      },
      {
        "id": "09c",
        "url": "https://www.ubereats.com/jp/store/%E4%B8%80%E5%BF%83%E4%BA%AD-%E5%85%AB%E6%88%B8%E5%88%86%E5%BA%97/Hm-zcLaYXXeWjMU-IqESvw",
        "title": "Uber Eats 一心亭 八戸分店",
        "type": "merchant_platform_listing",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "六日町33-1の店舗とラーメンメニューが掲載。配達利用不可表示は閉店の証拠にしない。"
      },
      {
        "id": "09d",
        "url": "https://www.taveri.jp/store/ChIJ9eaor_hTm18R_arfeSiDW6Y",
        "title": "Taveri 公開店舗ページ・Google Mapsリンク",
        "type": "secondary_place_directory",
        "observedAt": "2026-10-05",
        "accessRoute": "curl_text_body",
        "claim": "元名称・所在地・ラーメン屋の構造化データと、同一識別子に対応する公開Google Mapsリンクを確認。"
      }
    ],
    "notes": [
      "補完情報は複数案内一致で採用するが、店舗自身の最新確認は未了。旧公式として紹介されたjin-foods.net/issin/shop/は404。rootは別のサイトへ転送後タイムアウトし、後継企業とは判断しない。公開地図リンクの符号化識別子対応を確認。Google公式仕様による保証は未確認。",
      "地図リンクの文字列・符号化された識別子対応を照合。Google Mapsの現況本文は取得できない。"
    ]
  },
  {
    "name": "末廣ラーメン本舗 八戸長横町分店",
    "urls": [
      "https://www.google.com/maps/place/%E6%9C%AB%E5%BB%A3%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%E6%9C%AC%E8%88%97+%E5%85%AB%E6%88%B8%E9%95%B7%E6%A8%AA%E7%94%BA%E5%88%86%E5%BA%97/data=!4m2!3m1!1s0x5f9b53004a9d0791:0xe89fb34426f5c519"
    ],
    "observedAt": "2026-10-05",
    "identity": "public_maps_encoded_id_matched",
    "confidence": "公開リンクID対応による同定（推論・Google公式仕様の保証なし）",
    "currentStatus": "店舗関連SNS検索結果に2026年5月1日の開店告知。現時点の営業状態は未確認。公式チェーン一覧未掲載は閉店証拠にしない。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 12
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 12
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 12
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 12
      },
      "address": {
        "status": "researched",
        "sources": [
          "10a",
          "10b",
          "10e"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "public_maps_encoded_id_matched"
      },
      "phone": {
        "status": "unknown",
        "reason": "出典で電話番号を確認できない"
      },
      "genre": {
        "status": "researched",
        "sources": [
          "10a",
          "10c",
          "10e"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "ジャンルは出典の事業・提供品目を短い分類語へ整理",
        "identityMethod": "public_maps_encoded_id_matched"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "10a",
        "url": "https://tabelog.com/aomori/A0203/A020301/2013787/",
        "title": "食べログ 末廣ラーメン 八戸長横町分店",
        "type": "secondary_restaurant_directory",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "長横町4-10・ラーメン、電話は不明。suehiro_ramen.21 を公式アカウントとして案内。"
      },
      {
        "id": "10b",
        "url": "https://www.navitime.co.jp/category/03/02203065000/",
        "title": "NAVITIME 長横町一覧",
        "type": "secondary_location_directory",
        "observedAt": "2026-10-05",
        "accessRoute": "web_search_snippet",
        "claim": "完全支店名と長横町4-10を掲載。"
      },
      {
        "id": "10c",
        "url": "https://www.instagram.com/p/DXp-PbPialt/",
        "title": "suehiro_ramen.21 開店告知",
        "type": "store_social_account_listing",
        "observedAt": "2026-10-05",
        "accessRoute": "web_search_snippet",
        "claim": "2026-04-27付の投稿検索結果が、八戸長横町分店の5月1日開店を告知。直接本文取得は制限。"
      },
      {
        "id": "10d",
        "url": "https://suehiro-ramen-honpo.com/pages/shop",
        "title": "末廣ラーメン本舗 公式店舗一覧",
        "type": "chain_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "八戸石堂分店の所在地は長苗代2-16-27。閲覧した一覧に長横町分店はない。"
      },
      {
        "id": "10e",
        "url": "https://www.taveri.jp/store/ChIJkQedSgBTm18RGcX1JkSzn-g",
        "title": "Taveri 公開店舗ページ・Google Mapsリンク",
        "type": "secondary_place_directory",
        "observedAt": "2026-10-05",
        "accessRoute": "curl_text_body",
        "claim": "元名称・所在地・ラーメン屋の構造化データと、同一識別子に対応する公開Google Mapsリンクを確認。"
      }
    ],
    "notes": [
      "電話は不明のため空欄。店舗SNSの最新本文未取得。石堂分店と合併しない。公開地図リンクの符号化識別子対応を確認。Google公式仕様による保証は未確認。",
      "地図リンクの文字列・符号化された識別子対応を照合。Google Mapsの現況本文は取得できない。"
    ]
  },
  {
    "name": "南部民芸料理 蔵",
    "urls": [
      "https://www.google.com/maps/place/%E5%8D%97%E9%83%A8%E6%B0%91%E8%8A%B8%E6%96%99%E7%90%86+%E8%94%B5/data=!4m2!3m1!1s0x5f9b5357af2e2b01:0x89a71f017196e84e"
    ],
    "observedAt": "2026-10-05",
    "identity": "maps_id_matched",
    "confidence": "地図ID同定確認",
    "currentStatus": "店舗関係者が公開する営業案内と2026年10月の予約案内が掲載。当日の営業は未確認。",
    "fieldEvidence": {
      "name": {
        "status": "copied_csv",
        "column": "タイトル",
        "sourceCsvRecordNumber": 13
      },
      "memo": {
        "status": "copied_csv",
        "column": "メモ",
        "sourceCsvRecordNumber": 13
      },
      "urls": {
        "status": "copied_csv",
        "column": "URL",
        "sourceCsvRecordNumber": 13
      },
      "tags": {
        "status": "copied_csv",
        "column": "タグ",
        "sourceCsvRecordNumber": 13
      },
      "address": {
        "status": "researched",
        "sources": [
          "11a",
          "11b",
          "11c"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "phone": {
        "status": "researched",
        "sources": [
          "11a",
          "11c"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "出典値の半角・空白表記を統一",
        "identityMethod": "maps_id_matched"
      },
      "genre": {
        "status": "researched",
        "sources": [
          "11a"
        ],
        "checkedAt": "2026-10-05T18:52:02Z",
        "rule": "ジャンルは出典の事業・提供品目を短い分類語へ整理",
        "identityMethod": "maps_id_matched"
      },
      "customValues": {
        "status": "copied_csv_default",
        "reason": "原データに定義なし。空オブジェクトを維持"
      }
    },
    "sources": [
      {
        "id": "11a",
        "url": "https://tabelog.com/aomori/A0203/A020301/2000500/dtlmap/",
        "title": "食べログ 南部民芸料理 蔵 地図",
        "type": "store_managed_platform",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "店舗関係者公開と明記。十三日町28花真ビル1F・0178-22-1027・郷土料理/海鮮/居酒屋。"
      },
      {
        "id": "11b",
        "url": "https://www.hotpepper.jp/strJ000100656/map/",
        "title": "ホットペッパー 南部民芸料理 蔵",
        "type": "merchant_reservation_listing",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body",
        "claim": "同所在地の予約案内が掲載。"
      },
      {
        "id": "11c",
        "url": "https://aomori-artsfest.com/spot/%E5%8D%97%E9%83%A8%E6%B0%91%E8%8A%B8%E6%96%99%E7%90%86-%E8%94%B5/",
        "title": "AOMORI GOKAN アートフェス2024 蔵",
        "type": "festival_official",
        "observedAt": "2026-10-05",
        "accessRoute": "web_text_body_and_link_redirect",
        "claim": "所在地・電話・郷土料理を紹介。公開地図リンクの転送先IDが元URLと一致。"
      }
    ],
    "notes": [
      "現在の営業時間に案内間の差があるためv2には入れない。公開イベント案内の地図リンクで元のMaps ID一致を確認。"
    ]
  }
]);

function freeze(value) {
 if(value && typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;
}
export function createInitialNotebook() {
 const fieldSettings=validateFieldSettings(structuredClone(initialNotebook.fieldSettings));
 const stores=initialNotebook.restaurants.map((record,index)=>({...normalizeRestaurant(structuredClone(record),fieldSettings),id:`initial-researched-${index+1}`,source:'CSV・保存済み調査',icon:'◌',tone:'green'}));
 const state={fieldSettings,stores};serializeState(state);return state;
}
export function initialResearchFor(store) {
 const stableIndex=initialNotebook.restaurants.findIndex((_,i)=>store.id===`initial-researched-${i+1}`);
 if(stableIndex>=0)return initialResearch[stableIndex];
 const matches=initialNotebook.restaurants.flatMap((record,i)=>record.urls.some(url=>store.urls.includes(url))?[i]:[]);
 return matches.length===1?initialResearch[matches[0]]:null;
}
export function isInitialReplay(stores,incoming) {
 const index=initialNotebook.restaurants.findIndex(record=>JSON.stringify(restaurantValue(record))===JSON.stringify(restaurantValue(incoming)));
 if(index<0)return false;
 return stores.some(store=>store.id===`initial-researched-${index+1}`||store.urls.some(url=>initialNotebook.restaurants[index].urls.includes(url)));
}
