-- =============================================================================
-- 004_voice.sql — 家人的声音（声音克隆的 Voice ID）+ 生成音频缓存
-- 不存声音模型文件，只存服务商返回的 voice_id。
-- =============================================================================

-- ---------- voice_profiles：一个家长账号下的家人声音（爸爸 / 妈妈 / 奶奶 / 爷爷…） ----------

CREATE TABLE voice_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider     text NOT NULL CHECK (provider IN ('elevenlabs', 'doubao', 'cosyvoice', 'openai')),
  voice_id     text NOT NULL,                    -- 服务商的声音 ID，如 ElevenLabs 的 JBFqnCBsd6RMkjVDRZzb
  voice_name   text NOT NULL CHECK (char_length(voice_name) BETWEEN 1 AND 60),
  relation     text NOT NULL DEFAULT 'dad'
               CHECK (relation IN ('dad', 'mum', 'grandma', 'grandpa', 'other')),
  language     text NOT NULL DEFAULT 'multi',    -- 'zh' / 'en' / 'multi'
  is_default   boolean NOT NULL DEFAULT false,   -- 故事、聊天不指定声音时用它
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  consent_at   timestamptz NOT NULL,             -- 声音本人同意克隆和使用的时间（声纹属于敏感个人信息）
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_profiles_user_id_provider_voice_id_key UNIQUE (user_id, provider, voice_id)
);

CREATE INDEX voice_profiles_user_id_idx ON voice_profiles (user_id);

-- ---------- voice_audio：生成过的音频（同一声音 + 同一段文字只生成一次，省钱） ----------

CREATE TABLE voice_audio (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id  uuid NOT NULL REFERENCES voice_profiles (id) ON DELETE CASCADE,
  text_hash         text NOT NULL,     -- sha256(服务商 + 模型 + 声音 + 文字)
  storage_key       text NOT NULL,     -- 存储中的路径，如 voice/<profile>/<hash>.mp3
  content_type      text NOT NULL DEFAULT 'audio/mpeg',
  bytes             integer NOT NULL CHECK (bytes >= 0),
  characters        integer NOT NULL CHECK (characters >= 0),
  model             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_audio_voice_profile_id_text_hash_key UNIQUE (voice_profile_id, text_hash)
);

-- ---------- updated_at 触发器 + RLS ----------

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['voice_profiles', 'voice_audio']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;
