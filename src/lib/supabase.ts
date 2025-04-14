import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://afkexjvijzuwohaiyfly.supabase.co/"; // ← hier deine URL
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFma2V4anZpanp1d29oYWl5Zmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NzcyODksImV4cCI6MjA2MDE1MzI4OX0.HQFM8JuVf6DycTwjOQ2n4SkgKTNata-J_1XKH1dqBQk"; // ← hier dein Key

export const supabase = createClient(supabaseUrl, supabaseKey);
