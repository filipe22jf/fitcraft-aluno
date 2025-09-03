// supabase-client.js (VERSÃO FINAL E SEGURA)

const SUPABASE_URL = 'https://uzyfbrmxcciqyieoktow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWZicm14Y2NpcXlpZW9rdG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMTQ5MTAsImV4cCI6MjA3MTU5MDkxMH0.x8GV2vqz_ZMeLMINRsY8B_-9NvUYv0wIb0nEIjQeFTY';

// Usamos o objeto global 'supabase' (que vem da CDN ) e seu método 'createClient'.
// A nossa conexão será armazenada em uma variável com um nome diferente para garantir que não haja conflito.
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


