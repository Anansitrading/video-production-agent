CREATE TABLE video_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title VARCHAR(255),
    creative_brief TEXT,
    status VARCHAR(50) DEFAULT 'in_progress',
    total_duration REAL DEFAULT 0,
    scene_count INTEGER DEFAULT 0,
    final_video_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);