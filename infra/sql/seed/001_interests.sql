-- 兴趣字典种子数据（可重复执行）
INSERT INTO interest_categories (code, name_zh, name_en, sort) VALUES
  ('animals',   '动物',     'Animals',        10),
  ('vehicles',  '交通工具', 'Vehicles',       20),
  ('science',   '太空科学', 'Space & Science', 30),
  ('fantasy',   '童话幻想', 'Fantasy',        40),
  ('nature',    '自然',     'Nature',         50),
  ('culture',   '中国文化', 'Chinese Culture', 60)
ON CONFLICT (code) DO UPDATE
  SET name_zh = EXCLUDED.name_zh, name_en = EXCLUDED.name_en, sort = EXCLUDED.sort;

INSERT INTO interest_tags (category_id, code, name_zh, name_en, emoji, sort, safety_note)
SELECT c.id, t.code, t.name_zh, t.name_en, t.emoji, t.sort, t.safety_note
FROM (VALUES
  ('animals',  'dinosaur',    '恐龙',     'Dinosaur',     '🦖', 10, '不描写捕食和流血'),
  ('animals',  'ocean',       '海洋动物', 'Ocean Animals', '🐳', 20, NULL),
  ('animals',  'cats_dogs',   '猫和狗',   'Cats & Dogs',  '🐶', 30, NULL),
  ('vehicles', 'fire_truck',  '消防车',   'Fire Truck',   '🚒', 10, '火灾只写救援，不写伤亡'),
  ('vehicles', 'excavator',   '挖掘机',   'Excavator',    '🚜', 20, NULL),
  ('vehicles', 'train',       '火车',     'Train',        '🚂', 30, NULL),
  ('science',  'robot',       '机器人',   'Robot',        '🤖', 10, NULL),
  ('science',  'space',       '太空',     'Space',        '🚀', 20, NULL),
  ('fantasy',  'princess',    '公主',     'Princess',     '👑', 10, NULL),
  ('fantasy',  'magic',       '魔法',     'Magic',        '🪄', 20, NULL),
  ('nature',   'volcano',     '火山',     'Volcano',      '🌋', 10, '不写灾难和伤亡细节'),
  ('nature',   'plants',      '植物',     'Plants',       '🌱', 20, NULL),
  ('culture',  'festivals',   '传统节日', 'Festivals',    '🏮', 10, NULL)
) AS t(category_code, code, name_zh, name_en, emoji, sort, safety_note)
JOIN interest_categories c ON c.code = t.category_code
ON CONFLICT (code) DO UPDATE
  SET name_zh = EXCLUDED.name_zh, name_en = EXCLUDED.name_en, emoji = EXCLUDED.emoji,
      sort = EXCLUDED.sort, safety_note = EXCLUDED.safety_note, category_id = EXCLUDED.category_id;
