import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://gxxrzxctnzllfgghljkg.supabase.co';
const SUPABASE_ANON_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4eHJ6eGN0bnpsbGZnZ2hsamtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNzIxODcsImV4cCI6MjA3MTY0ODE4N30.Bab5gwYWdHKiVbOvkUbj4Abub5B0OIeGHCbEC-4g2lU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
