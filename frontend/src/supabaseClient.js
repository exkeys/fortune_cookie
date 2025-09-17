import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rudiauwvjsczsfbtjfoz.supabase.co'; // 여기에 본인 프로젝트 URL 입력
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZGlhdXd2anNjenNmYnRqZm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMDYxODcsImV4cCI6MjA3MzU4MjE4N30.S5ziYTl7mQVMaBXLPm2VCpT5lgL5VjxwZAsgoEn1vrc'; // 여기에 본인 프로젝트 anon key 입력

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
