
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://olnbxdpnfbjfmnjmjvxs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmJ4ZHBuZmJqZm1uam1qdnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTg4OTAsImV4cCI6MjA5MjQzNDg5MH0.oMwwjL-M1x1KAquowcXyPoN-LLJ20escw9JuMietHfE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkProfiles() {
  console.log('Checking profiles...')
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles(*)')
  
  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Profiles found:', data?.length)
    console.log('Data:', JSON.stringify(data, null, 2))
  }
}

checkProfiles()
