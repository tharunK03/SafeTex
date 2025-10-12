import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vuehwcpxvpalqyfnukes.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZWh3Y3B4dnBhbHF5Zm51a2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjcxNDgsImV4cCI6MjA3MDc0MzE0OH0.xTaIbpiW7Z7q5lWrB1y4d6-y3_WqGBeI5vgynfAVblU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const auth = {
  // Get current user
  getCurrentUser: () => supabase.auth.getUser(),
  
  // Sign in with email and password
  signInWithPassword: (email, password) => 
    supabase.auth.signInWithPassword({ email, password }),
  
  // Sign up with email and password
  signUp: (email, password, metadata = {}) => 
    supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: metadata }
    }),
  
  // Sign out
  signOut: () => supabase.auth.signOut(),
  
  // Get session
  getSession: () => supabase.auth.getSession(),
  
  // Listen to auth state changes
  onAuthStateChange: (callback) => 
    supabase.auth.onAuthStateChange(callback),
  
  // Get access token
  getAccessToken: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }
}

export default supabase

