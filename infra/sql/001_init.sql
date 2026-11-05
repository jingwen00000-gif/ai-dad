-- =============================================================================
-- 001_init.sql — 账号、孩子、成长档案、兴趣
-- PostgreSQL 15+，兼容 Supabase（只用 public schema、内置 gen_random_uuid）
-- 约定：
--   * 所有表 uuid 主键 + created_at + updated_at（由触发器维护）
--   * 枚举类取值用 text + CHECK，便于以后加值且不需要 ALTER TYPE
--   * 所有表开启 RLS 且不建策略：只允许 BFF（表 owner / service role）访问，
--     部署在 Supabase 时 anon / authenticated 角色无法通过 REST 直接读写
-- =============================================================================

-- ---------- 通用函数 ----------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 月龄：生日到今天的整月数
CREATE OR REPLACE FUNCTION child_age_months(p_birthday date, p_today date DEFAULT current_date)
RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT (extract(year FROM age(p_today, p_birthday)) * 12
        + extract(month FROM age(p_today, p_birthday)))::integer;
$$;

-- 年龄阶段：S1 萌芽(<60月) / S2 探索(60-83) / S3 求知(84-107) / S4 冒险(>=108)
CREATE OR REPLACE FUNCTION child_age_stage(p_age_months integer)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_age_months < 60  THEN 'S1'
    WHEN p_age_months < 84  THEN 'S2'
    WHEN p_age_months < 108 THEN 'S3'
    ELSE 'S4'
  END;
$$;

-- ---------- users：家长账号（微信） ----------

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wx_openid      text NOT NULL,
  wx_unionid     text,
  phone_enc      text,                       -- 加密后的手机号，明文不落库
  nickname       text,
  avatar_url     text,
  status         text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'disabled', 'deleted')),
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_wx_openid_key  UNIQUE (wx_openid),
  CONSTRAINT users_wx_unionid_key UNIQUE (wx_unionid)
);

-- ---------- parent_settings：家长设置（1:1） ----------

CREATE TABLE parent_settings (
  user_id              uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  daily_minutes_limit  integer NOT NULL DEFAULT 30
                       CHECK (daily_minutes_limit BETWEEN 5 AND 240),
  allowed_start_time   time NOT NULL DEFAULT '07:00',
  allowed_end_time     time NOT NULL DEFAULT '21:00',
  english_enabled      boolean NOT NULL DEFAULT true,
  story_mode_default   text NOT NULL DEFAULT 'adventure'
                       CHECK (story_mode_default IN ('bedtime', 'adventure', 'knowledge', 'interactive', 'bilingual')),
  values_themes        text[] NOT NULL DEFAULT '{}',
  kid_pin_hash         text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (allowed_start_time < allowed_end_time)
);

-- ---------- children：孩子档案（一个家长多个孩子） ----------

CREATE TABLE children (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  nickname    text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),  -- 只存昵称，不存真实姓名
  birthday    date NOT NULL CHECK (birthday > DATE '2000-01-01'),
  gender      text NOT NULL DEFAULT 'unspecified'
              CHECK (gender IN ('boy', 'girl', 'unspecified')),
  avatar_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX children_user_id_idx ON children (user_id);

-- 年龄不存储，实时计算；security_invoker 让视图遵守调用者的 RLS（Supabase 推荐）
CREATE VIEW children_view WITH (security_invoker = true) AS
SELECT c.*,
       child_age_months(c.birthday)                   AS age_months,
       child_age_months(c.birthday) / 12              AS age_years,
       child_age_stage(child_age_months(c.birthday))  AS age_stage
FROM children c
WHERE c.deleted_at IS NULL;

-- ---------- growth_profiles：成长档案（1:1，建孩子时自动创建） ----------

CREATE TABLE growth_profiles (
  child_id                uuid PRIMARY KEY REFERENCES children (id) ON DELETE CASCADE,
  english_level           smallint NOT NULL DEFAULT 0 CHECK (english_level BETWEEN 0 AND 6),     -- E0-E6
  english_content_offset  smallint NOT NULL DEFAULT 0 CHECK (english_content_offset BETWEEN -2 AND 0),
  chinese_level           smallint NOT NULL DEFAULT 1 CHECK (chinese_level BETWEEN 1 AND 5),     -- C1-C5
  knowledge_level         smallint NOT NULL DEFAULT 1 CHECK (knowledge_level BETWEEN 1 AND 5),   -- K1-K5
  confidence_score        numeric(4,2) NOT NULL DEFAULT 5 CHECK (confidence_score BETWEEN 0 AND 10),
  stage_offset            smallint NOT NULL DEFAULT 0 CHECK (stage_offset BETWEEN -1 AND 1),
  evaluated_at            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION create_growth_profile_for_child() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO growth_profiles (child_id) VALUES (NEW.id)
  ON CONFLICT (child_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER children_create_growth_profile
AFTER INSERT ON children
FOR EACH ROW EXECUTE FUNCTION create_growth_profile_for_child();

-- ---------- interest_categories / interest_tags：兴趣字典 ----------

CREATE TABLE interest_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL,
  name_zh     text NOT NULL,
  name_en     text NOT NULL,
  sort        integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interest_categories_code_key UNIQUE (code)
);

CREATE TABLE interest_tags (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  uuid NOT NULL REFERENCES interest_categories (id) ON DELETE RESTRICT,
  code         text NOT NULL,              -- 如 'dinosaur'，也是 POST /stories 的 theme
  name_zh      text NOT NULL,
  name_en      text NOT NULL,
  emoji        text,
  age_min      smallint NOT NULL DEFAULT 3,
  age_max      smallint NOT NULL DEFAULT 10,
  safety_note  text,                       -- 生成内容时的安全提示，如“火山不写灾难细节”
  is_system    boolean NOT NULL DEFAULT true,
  is_active    boolean NOT NULL DEFAULT true,
  sort         integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interest_tags_code_key UNIQUE (code),
  CHECK (age_min <= age_max)
);

CREATE INDEX interest_tags_category_id_idx ON interest_tags (category_id);

-- ---------- child_interests：孩子的兴趣及权重 ----------

CREATE TABLE child_interests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    uuid NOT NULL REFERENCES children (id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES interest_tags (id) ON DELETE CASCADE,
  weight      numeric(6,3) NOT NULL DEFAULT 3,      -- 家长设置的初始分 +3
  status      text NOT NULL DEFAULT 'stable'
              CHECK (status IN ('emerging', 'stable', 'fading')),
  source      text NOT NULL DEFAULT 'parent'
              CHECK (source IN ('parent', 'child', 'inferred')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT child_interests_child_id_tag_id_key UNIQUE (child_id, tag_id)
);

CREATE INDEX child_interests_child_id_weight_idx ON child_interests (child_id, weight DESC);
CREATE INDEX child_interests_tag_id_idx ON child_interests (tag_id);

-- ---------- updated_at 触发器 + RLS ----------

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users', 'parent_settings', 'children', 'growth_profiles',
                           'interest_categories', 'interest_tags', 'child_interests']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;
