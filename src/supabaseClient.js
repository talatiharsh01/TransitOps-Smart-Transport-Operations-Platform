import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iwexmgdpmyafebvjgmyy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZXhtZ2RwbXlhZmVidmpnbXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzIzMTUsImV4cCI6MjA5OTQwODMxNX0.fDNR-fDtPukgwCgpn3dhzBKy8bHh0beTXcnV97gQANU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);