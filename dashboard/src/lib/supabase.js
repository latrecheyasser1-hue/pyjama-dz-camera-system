import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://phfdqukhfvwuqeybnxsu.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZmRxdWtoZnZ3dXFleWJueHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODYyMzAsImV4cCI6MjEwMzc2MjIzMH0.pNSjn0gcR-THE059EJDTXRZ6z9bL7wMkqHvBws3OvIc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
