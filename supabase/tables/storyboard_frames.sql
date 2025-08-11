CREATE TABLE storyboard_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID,
    frame_number INTEGER,
    scene_description TEXT,
    image_prompt TEXT,
    image_url TEXT,
    image_seed VARCHAR(255),
    duration REAL DEFAULT 4.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);