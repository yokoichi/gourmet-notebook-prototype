export const samples = [
  { name: 'ひだまり珈琲（サンプル）', genre: 'カフェ', address: '架空市 / 青葉通り', tags: ['コーヒー', 'ひとり時間'], memo: '窓際でのんびり。次は季節のタルトを。', tone: 'green', icon: '☕' },
  { name: '食堂 こより（サンプル）', genre: '和食', address: '架空市 / 駅の西側', tags: ['ランチ', '定食'], memo: '炊きたてのごはんと、日替わりのおかず。', tone: '', icon: '♨' },
  { name: 'TRATTORIA 雨音（サンプル）', genre: 'イタリアン', address: '架空市 / 川沿い', tags: ['パスタ', '週末'], memo: '友人とのごはんに。手打ちパスタが気になる。', tone: 'red', icon: '♧' },
  { name: '麺屋 青風（サンプル）', genre: 'ラーメン', address: '架空市 / 北口商店街', tags: ['ひとりごはん', 'つけ麺'], memo: 'お昼の寄り道候補。すっきりしたスープ。', tone: 'blue', icon: '≋' },
  { name: 'パンと日々（サンプル）', genre: 'パン・スイーツ', address: '架空市 / けやき坂', tags: ['パン', 'テイクアウト'], memo: '朝の散歩のついでに。焼きたてを持ち帰りたい。', tone: '', icon: '◒' },
  { name: '喫茶 余白（サンプル）', genre: 'カフェ', address: '架空市 / 路地の奥', tags: ['読書', 'プリン'], memo: '本を一冊持っていく、小さな週末の楽しみ。', tone: 'green', icon: '☕' },
  { name: '小料理 月灯（サンプル）', genre: '和食', address: '架空市 / 花見小路', tags: ['夜ごはん', '季節の料理'], memo: 'ゆっくり話したい日に。季節の一皿を。', tone: 'blue', icon: '♨' },
  { name: '焼菓子 こむぎ（サンプル）', genre: 'パン・スイーツ', address: '架空市 / 南の住宅街', tags: ['焼菓子', '手みやげ'], memo: '小さなお土産に。クッキーの詰め合わせ。', tone: 'red', icon: '◒' },
].map((sample, index) => ({ ...sample, id: `sample-${index + 1}`, phone: '', mapsURL: '', source: '合成サンプル' }));
