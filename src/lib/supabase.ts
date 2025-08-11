import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://deuqjwneopetvlucvwzo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldXFqd25lb3BldHZsdWN2d3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NzExODMsImV4cCI6MjA0OTU0NzE4M30.uN4Oq7hKRIFvVvk3lJsNZYDHF8YMZ4YiLHcT8xHxzek'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database schema
export interface VideoProject {
  id: string
  user_id?: string
  title: string
  creative_brief?: string
  status: string
  total_duration: number
  scene_count: number
  final_video_url?: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

export interface StoryboardFrame {
  id: string
  project_id: string
  frame_number: number
  scene_description: string
  image_prompt: string
  image_url: string
  image_seed: string
  duration: number
  created_at: string
  updated_at: string
}

export interface VideoClip {
  id: string
  frame_id: string
  clip_type: 'draft' | 'final'
  video_url: string
  duration: number
  generation_seed: string
  status: string
  created_at: string
  updated_at: string
}

export interface Playbook {
  id: string
  project_id: string
  playbook_yaml: string
  tools_used: Record<string, any>
  generation_params: Record<string, any>
  is_published: boolean
  published_at?: string
  created_at: string
}

export interface ChatSession {
  id: string
  user_id?: string
  project_id: string
  session_data: Record<string, any>
  last_active: string
  created_at: string
}

// API call helpers
export const supabaseApi = {
  // Projects
  async createProject(projectData: Partial<VideoProject>) {
    const { data, error } = await supabase
      .from('video_projects')
      .insert(projectData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateProject(id: string, updates: Partial<VideoProject>) {
    const { data, error } = await supabase
      .from('video_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getProject(id: string) {
    const { data, error } = await supabase
      .from('video_projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getPublishedProjects() {
    const { data, error } = await supabase
      .from('video_projects')
      .select(`
        *,
        playbooks!inner(
          playbook_yaml,
          tools_used,
          is_published
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Storyboard frames
  async getProjectFrames(projectId: string) {
    const { data, error } = await supabase
      .from('storyboard_frames')
      .select('*')
      .eq('project_id', projectId)
      .order('frame_number')
    
    if (error) throw error
    return data
  },

  async updateFrame(id: string, updates: Partial<StoryboardFrame>) {
    const { data, error } = await supabase
      .from('storyboard_frames')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Video clips
  async getFrameClips(frameId: string) {
    const { data, error } = await supabase
      .from('video_clips')
      .select('*')
      .eq('frame_id', frameId)
      .order('created_at')
    
    if (error) throw error
    return data
  },

  // Edge function calls
  async callEdgeFunction(functionName: string, body: any) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (error) throw error
    return data
  }
}