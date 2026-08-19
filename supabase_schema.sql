-- ===================================================================
-- AI Zoom Meeting - Supabase SQL Schema
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query
-- ===================================================================

-- 1. Create table for Meeting Transcripts (Speech-to-Text records)
CREATE TABLE IF NOT EXISTS public.meeting_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT DEFAULT 'student',
    content TEXT NOT NULL,
    timestamp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create table for Meeting AI Summaries
CREATE TABLE IF NOT EXISTS public.meeting_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    title TEXT NOT NULL,
    key_takeaways JSONB DEFAULT '[]'::jsonb,
    decisions JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    raw_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create table for Shared Documents / PPT / PDF presentations
CREATE TABLE IF NOT EXISTS public.meeting_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT DEFAULT 'application/pdf',
    uploaded_by TEXT NOT NULL,
    uploaded_role TEXT DEFAULT 'teacher',
    total_pages INTEGER DEFAULT 1,
    current_page INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) and grant open public access for meeting participants
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_documents ENABLE ROW LEVEL SECURITY;

-- Allow anonymous/authenticated read & insert access on transcripts
CREATE POLICY "Allow public select on meeting_transcripts" 
ON public.meeting_transcripts FOR SELECT USING (true);

CREATE POLICY "Allow public insert on meeting_transcripts" 
ON public.meeting_transcripts FOR INSERT WITH CHECK (true);

-- Allow anonymous/authenticated read & insert access on summaries
CREATE POLICY "Allow public select on meeting_summaries" 
ON public.meeting_summaries FOR SELECT USING (true);

CREATE POLICY "Allow public insert on meeting_summaries" 
ON public.meeting_summaries FOR INSERT WITH CHECK (true);

-- Allow anonymous/authenticated read & insert access on documents
CREATE POLICY "Allow public select on meeting_documents" 
ON public.meeting_documents FOR SELECT USING (true);

CREATE POLICY "Allow public insert on meeting_documents" 
ON public.meeting_documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on meeting_documents" 
ON public.meeting_documents FOR UPDATE USING (true);

-- Create indexes for ultra fast lookups by room_id
CREATE INDEX IF NOT EXISTS idx_transcripts_room_id ON public.meeting_transcripts(room_id);
CREATE INDEX IF NOT EXISTS idx_summaries_room_id ON public.meeting_summaries(room_id);
CREATE INDEX IF NOT EXISTS idx_documents_room_id ON public.meeting_documents(room_id);
