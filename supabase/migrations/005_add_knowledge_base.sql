-- Create knowledge_base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    instance_name TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size TEXT,
    status TEXT DEFAULT 'processing', -- processing, ready, error
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own knowledge base"
    ON public.knowledge_base FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge base"
    ON public.knowledge_base FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge base"
    ON public.knowledge_base FOR DELETE
    USING (auth.uid() = user_id);
