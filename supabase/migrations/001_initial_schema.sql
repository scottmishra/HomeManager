-- Enable pgvector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- HOMES
-- ============================================================
CREATE TABLE homes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    home_type TEXT NOT NULL DEFAULT 'single_family',
    year_built INTEGER,
    square_footage INTEGER,
    builder TEXT,
    num_bedrooms INTEGER,
    num_bathrooms NUMERIC(3,1),
    climate_zone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPLIANCES
-- ============================================================
CREATE TABLE appliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    model_number TEXT,
    serial_number TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    purchase_date DATE,
    warranty_expiry DATE,
    install_date DATE,
    location_in_home TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MAINTENANCE TASKS
-- ============================================================
CREATE TABLE maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    appliance_id UUID REFERENCES appliances(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'annual',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending',
    due_date DATE,
    completed_date DATE,
    completion_notes TEXT,
    estimated_duration_minutes INTEGER,
    estimated_cost NUMERIC(10,2),
    how_to_guide_id UUID,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MAINTENANCE LOGS (history of completed tasks)
-- ============================================================
CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_by TEXT,
    completion_date DATE NOT NULL,
    notes TEXT,
    cost NUMERIC(10,2),
    contractor_name TEXT,
    photos TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT CHUNKS (RAG vector store)
-- ============================================================
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    source_file TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_homes_user_id ON homes(user_id);
CREATE INDEX idx_appliances_home_id ON appliances(home_id);
CREATE INDEX idx_appliances_user_id ON appliances(user_id);
CREATE INDEX idx_maintenance_tasks_home_id ON maintenance_tasks(home_id);
CREATE INDEX idx_maintenance_tasks_user_id ON maintenance_tasks(user_id);
CREATE INDEX idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX idx_maintenance_tasks_due_date ON maintenance_tasks(due_date);
CREATE INDEX idx_maintenance_logs_task_id ON maintenance_logs(task_id);
CREATE INDEX idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX idx_document_chunks_home_id ON document_chunks(home_id);

-- Vector similarity search index (IVFFlat for pgvector)
CREATE INDEX idx_document_chunks_embedding ON document_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can manage their own homes"
    ON homes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own appliances"
    ON appliances FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own maintenance tasks"
    ON maintenance_tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own maintenance logs"
    ON maintenance_logs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own document chunks"
    ON document_chunks FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER homes_updated_at
    BEFORE UPDATE ON homes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER appliances_updated_at
    BEFORE UPDATE ON appliances FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER maintenance_tasks_updated_at
    BEFORE UPDATE ON maintenance_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VECTOR SIMILARITY SEARCH FUNCTION (for RAG)
-- ============================================================
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(384),
    match_count INT DEFAULT 5,
    filter_user_id UUID DEFAULT NULL,
    filter_home_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source_file TEXT,
    chunk_index INT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.content,
        dc.source_file,
        dc.chunk_index,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE
        (filter_user_id IS NULL OR dc.user_id = filter_user_id)
        AND (filter_home_id IS NULL OR dc.home_id = filter_home_id)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================
-- STORAGE BUCKET for documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', FALSE)
ON CONFLICT (id) DO NOTHING;
