import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zdknecztzfomgnumgpth.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GFNqoHGRokEdwRd7JIZKPA_vZdWwt2q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseTranscriptRecord {
  id?: string;
  room_id: string;
  sender_name: string;
  sender_role?: string;
  content: string;
  timestamp?: string;
  created_at?: string;
}

export interface SupabaseSummaryRecord {
  id?: string;
  room_id: string;
  title: string;
  key_takeaways: string[];
  decisions: string[];
  action_items: { assignee: string; task: string }[];
  raw_summary?: string;
  created_at?: string;
}

export interface SupabaseDocumentRecord {
  id?: string;
  room_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  uploaded_by: string;
  uploaded_role?: string;
  total_pages?: number;
  current_page?: number;
  created_at?: string;
}

// 1. Save live transcript entry to Supabase
export async function saveTranscriptToSupabase(record: SupabaseTranscriptRecord) {
  try {
    const { data, error } = await supabase
      .from('meeting_transcripts')
      .insert([
        {
          room_id: record.room_id,
          sender_name: record.sender_name,
          sender_role: record.sender_role || 'student',
          content: record.content,
          timestamp: record.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        }
      ]);
    
    if (error) {
      console.warn('[Supabase] Transcript insert warning:', error.message);
    }
    return { data, error };
  } catch (err: any) {
    console.warn('[Supabase] Save transcript caught error:', err.message);
    return { data: null, error: err };
  }
}

// 2. Fetch all transcripts for a room
export async function fetchTranscriptsFromSupabase(roomId: string) {
  try {
    const { data, error } = await supabase
      .from('meeting_transcripts')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase] Fetch transcripts warning:', error.message);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.warn('[Supabase] Fetch transcripts error:', err.message);
    return [];
  }
}

// 3. Save generated AI Summary to Supabase
export async function saveSummaryToSupabase(record: SupabaseSummaryRecord) {
  try {
    const { data, error } = await supabase
      .from('meeting_summaries')
      .insert([
        {
          room_id: record.room_id,
          title: record.title,
          key_takeaways: record.key_takeaways,
          decisions: record.decisions,
          action_items: record.action_items,
          raw_summary: record.raw_summary || '',
        }
      ]);

    if (error) {
      console.warn('[Supabase] Summary insert warning:', error.message);
    }
    return { data, error };
  } catch (err: any) {
    console.warn('[Supabase] Save summary caught error:', err.message);
    return { data: null, error: err };
  }
}

// 4. Fetch latest AI Summary for a room
export async function fetchLatestSummaryFromSupabase(roomId: string) {
  try {
    const { data, error } = await supabase
      .from('meeting_summaries')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }
    return data[0];
  } catch (err: any) {
    console.warn('[Supabase] Fetch summary error:', err.message);
    return null;
  }
}

// 5. Save shared document/PPT metadata to Supabase
export async function saveDocumentToSupabase(record: SupabaseDocumentRecord) {
  try {
    const { data, error } = await supabase
      .from('meeting_documents')
      .insert([
        {
          room_id: record.room_id,
          file_name: record.file_name,
          file_url: record.file_url,
          file_type: record.file_type || 'application/pdf',
          uploaded_by: record.uploaded_by,
          uploaded_role: record.uploaded_role || 'teacher',
          total_pages: record.total_pages || 1,
          current_page: record.current_page || 1,
        }
      ])
      .select();

    if (error) {
      console.warn('[Supabase] Document insert warning:', error.message);
    }
    return { data, error };
  } catch (err: any) {
    console.warn('[Supabase] Save document caught error:', err.message);
    return { data: null, error: err };
  }
}

// 6. Fetch documents shared in a room
export async function fetchDocumentsFromSupabase(roomId: string) {
  try {
    const { data, error } = await supabase
      .from('meeting_documents')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Fetch documents warning:', error.message);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.warn('[Supabase] Fetch documents error:', err.message);
    return [];
  }
}
