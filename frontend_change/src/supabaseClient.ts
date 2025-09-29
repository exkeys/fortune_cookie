import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rudiauwvjsczsfbtjfoz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZGlhdXd2anNjenNmYnRqZm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMDYxODcsImV4cCI6MjA3MzU4MjE4N30.S5ziYTl7mQVMaBXLPm2VCpT5lgL5VjxwZAsgoEn1vrc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
	},
});


