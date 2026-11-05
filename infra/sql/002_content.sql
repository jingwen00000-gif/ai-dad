-- =============================================================================
-- 002_content.sql — 对话、消息、故事、故事播放记录
-- =============================================================================

-- ---------- conversations：一次聊天会话 ----------

CREATE TABLE conversations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          uuid NOT NULL REFERENCES children (id) ON DELETE CASCADE,
  started_at        timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz,
  turn_count        integer NOT NULL DEFAULT 0 CHECK (turn_count >= 0),
  summary           text,
  memory_extracted  boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversations_child_id_started_at_idx ON conversations (child_id, started_at DESC);

-- ---------- messages：对话消息 ----------

CREATE TABLE messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  child_id         uuid NOT NULL REFERENCES children (id) ON DELETE CASCADE,  -- 冗余，便于按孩子查询
  role             text NOT NULL CHECK (role IN ('child', 'assistant', 'system')),
  content          text NOT NULL,
  input_type       text NOT NULL DEFAULT 'text' CHECK (input_type IN ('text', 'voice')),
  audio_url        text,                                  -- 语音预留
  lang_ratio_en    numeric(4,3) CHECK (lang_ratio_en BETWEEN 0 AND 1),
  provider         text,
  model            text,
  tokens_in        integer,
  tokens_out       integer,
  latency_ms       integer,
  moderation       text NOT NULL DEFAULT 'pass'
                   CHECK (moderation IN ('pending', 'pass', 'replaced', 'blocked')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_id_created_at_idx ON messages (conversation_id, created_at);
CREATE INDEX messages_child_id_created_at_idx ON messages (child_id, created_at DESC);

-- ---------- stories：生成的故事 ----------

CREATE TABLE stories (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         uuid NOT NULL REFERENCES children (id) ON DELETE CASCADE,
  title_zh         text,
  title_en         text,
  mode             text NOT NULL DEFAULT 'adventure'
                   CHECK (mode IN ('bedtime', 'adventure', 'knowledge', 'interactive', 'bilingual')),
  theme            text,                                   -- 兴趣标签 code，如 'dinosaur'
  theme_tag_ids    uuid[] NOT NULL DEFAULT '{}',
  age_stage        text NOT NULL CHECK (age_stage IN ('S1', 'S2', 'S3', 'S4')),
  english_level    smallint CHECK (english_level BETWEEN 0 AND 6),
  en_ratio_target  numeric(4,3) CHECK (en_ratio_target BETWEEN 0 AND 1),
  en_ratio_actual  numeric(4,3) CHECK (en_ratio_actual BETWEEN 0 AND 1),
  outline          jsonb,
  content          jsonb,                                  -- 段落、互动、词汇卡
  plain_text       text,
  word_count       integer CHECK (word_count >= 0),
  status           text NOT NULL DEFAULT 'generating'
                   CHECK (status IN ('generating', 'ready', 'failed', 'blocked')),
  provider         text,
  model            text,
  prompt_version   text,
  error            text,
  cover_url        text,
  audio_url        text,                                   -- 语音预留
  is_favorite      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stories_child_id_created_at_idx ON stories (child_id, created_at DESC);
CREATE INDEX stories_child_id_status_idx ON stories (child_id, status);
CREATE INDEX stories_theme_tag_ids_idx ON stories USING gin (theme_tag_ids);

-- ---------- story_sessions：故事历史（每次阅读/收听） ----------

CREATE TABLE story_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id           uuid NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
  child_id           uuid NOT NULL REFERENCES children (id) ON DELETE CASCADE,
  client_session_id  text,                     -- 客户端生成，离线补传时幂等
  started_at         timestamptz NOT NULL DEFAULT now(),
  ended_at           timestamptz,
  progress           numeric(4,3) NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
  duration_seconds   integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  completed          boolean NOT NULL DEFAULT false,
  rating             smallint CHECK (rating BETWEEN 1 AND 3),   -- 表情打分：1 一般 / 2 喜欢 / 3 超喜欢
  exit_segment       integer,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT story_sessions_client_session_id_key UNIQUE (client_session_id)
);

CREATE INDEX story_sessions_child_id_started_at_idx ON story_sessions (child_id, started_at DESC);
CREATE INDEX story_sessions_story_id_idx ON story_sessions (story_id);

-- ---------- updated_at 触发器 + RLS ----------

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['conversations', 'messages', 'stories', 'story_sessions']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;
