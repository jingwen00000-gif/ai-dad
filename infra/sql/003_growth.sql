-- =============================================================================
-- 003_growth.sql — 词汇、长期记忆、学习事件、每日用量
-- 需要 pgvector（Supabase 自带；本地用 pgvector/pgvector:pg15 镜像）
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------- vocab_words：英语词库（child_vocab 的依赖） ----------

CREATE TABLE vocab_words (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word        text NOT NULL,
  pos         text NOT NULL DEFAULT '',            -- 词性；'' 表示未区分
  zh          text NOT NULL,
  level       smallint NOT NULL CHECK (level BETWEEN 1 AND 6),   -- 对应 E1-E6
  theme       text,
  age_min     smallint NOT NULL DEFAULT 3,
  audio_url   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vocab_words_word_pos_key UNIQUE (word, pos)
);

CREATE INDEX vocab_words_level_theme_idx ON vocab_words (level, theme);

-- ---------- child_vocab：每个孩子的单词掌握状态 + 间隔复习 ----------

CREATE TABLE child_vocab (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        uuid NOT NULL REFERENCES children (id) ON DELETE CASCADE,
  word_id         uuid NOT NULL REFERENCES vocab_words (id) ON DELETE CASCADE,
  state           text NOT NULL DEFAULT 'exposed'
                  CHECK (state IN ('exposed', 'recognized', 'produced', 'mastered')),
  box             smallint NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),   -- 复习间隔 1/2/4/7/15 天
  next_review_at  timestamptz,
  exposures       integer NOT NULL DEFAULT 0 CHECK (exposures >= 0),
  correct_count   integer NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  wrong_count     integer NOT NULL DEFAULT 0 CHECK (wrong_count >= 0),
  produced_count  integer NOT NULL DEFAULT 0 CHECK (produced_count >= 0),
  produced_days   integer NOT NULL DEFAULT 0 CHECK (produced_days >= 0),
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz,
  mastered_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT child_vocab_child_id_word_id_key UNIQUE (child_id, word_id)
);

CREATE INDEX child_vocab_child_id_next_review_at_idx ON child_vocab (child_id, next_review_at);
CREATE INDEX child_vocab_child_id_state_idx ON child_vocab (child_id, state);
CREATE INDEX child_vocab_word_id_idx ON child_vocab (word_id);

-- ---------- memories：长期记忆（RAG） ----------

CREATE TABLE memories (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id           uuid NOT NULL REFERENCES children (id) ON DELETE CASCADE,
  type               text NOT NULL DEFAULT 'semantic' CHECK (type IN ('semantic', 'episode')),
  category           text NOT NULL CHECK (category IN
                     ('like', 'dislike', 'fear', 'learned', 'recent_topic', 'fact', 'wish', 'milestone', 'episode')),
  content            text NOT NULL,
  embedding          vector(1024),
  embedding_model    text,
  importance         numeric(3,2) NOT NULL DEFAULT 0.5 CHECK (importance BETWEEN 0 AND 1),
  confidence         numeric(3,2) NOT NULL DEFAULT 0.8 CHECK (confidence BETWEEN 0 AND 1),
  strength           integer NOT NULL DEFAULT 1 CHECK (strength >= 1),
  source_message_id  uuid REFERENCES messages (id) ON DELETE SET NULL,
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  expires_at         timestamptz,
  last_seen_at       timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX memories_child_id_category_status_idx ON memories (child_id, category, status);
CREATE INDEX memories_source_message_id_idx ON memories (source_message_id);
CREATE INDEX memories_embedding_hnsw_idx ON memories USING hnsw (embedding vector_cosine_ops);

-- ---------- learning_events：成长证据 ----------

CREATE TABLE learning_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         uuid NOT NULL REFERENCES children (id) ON DELETE CASCADE,
  dimension        text NOT NULL CHECK (dimension IN ('english', 'chinese', 'knowledge', 'confidence')),
  signal           text NOT NULL,           -- 如 'quiz_correct', 'word_produced', 'initiated_turn'
  value            numeric NOT NULL,
  weight           numeric NOT NULL DEFAULT 1,
  source           text NOT NULL CHECK (source IN ('chat', 'story', 'quiz', 'assessment')),
  ref_id           uuid,                    -- 关联的 story / message / session，不加外键（多态）
  idempotency_key  text,
  occurred_at      timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learning_events_idempotency_key_key UNIQUE (idempotency_key)
);

CREATE INDEX learning_events_child_id_dimension_occurred_at_idx
  ON learning_events (child_id, dimension, occurred_at DESC);

-- ---------- usage_daily：每日用量（防沉迷 + 成本） ----------

CREATE TABLE usage_daily (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id           uuid NOT NULL REFERENCES children (id) ON DELETE CASCADE,
  date               date NOT NULL,
  active_seconds     integer NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
  chat_turns         integer NOT NULL DEFAULT 0 CHECK (chat_turns >= 0),
  stories_generated  integer NOT NULL DEFAULT 0 CHECK (stories_generated >= 0),
  tokens_in          bigint NOT NULL DEFAULT 0 CHECK (tokens_in >= 0),
  tokens_out         bigint NOT NULL DEFAULT 0 CHECK (tokens_out >= 0),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usage_daily_child_id_date_key UNIQUE (child_id, date)
);

-- ---------- updated_at 触发器 + RLS ----------

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vocab_words', 'child_vocab', 'memories', 'learning_events', 'usage_daily']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;
