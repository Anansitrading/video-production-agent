import React, { useState, useEffect } from 'react'
import { Play, Shuffle, Calendar, Users, Eye } from 'lucide-react'
import { supabaseApi, VideoProject } from '../lib/supabase'
import { useVideoAgent } from '../contexts/VideoAgentContext'

export function ExploreWall() {
  const [publishedProjects, setPublishedProjects] = useState<VideoProject[]>([])
  const [loading, setLoading] = useState(true)
  const { resetSession, startNewProject } = useVideoAgent()

  useEffect(() => {
    loadPublishedProjects()
  }, [])

  const loadPublishedProjects = async () => {
    try {
      // For demo, we'll create some mock published projects
      const mockProjects: VideoProject[] = [
        {
          id: '1',
          title: 'Sustainable Technology Innovations',
          creative_brief: 'An inspiring video about eco-friendly tech solutions for the future',
          status: 'published',
          total_duration: 16,
          scene_count: 4,
          final_video_url: '/demo-video-1.mp4',
          thumbnail_url: '/demo-thumb-1.jpg',
          created_at: '2024-12-12T10:30:00Z',
          updated_at: '2024-12-12T10:45:00Z'
        },
        {
          id: '2', 
          title: 'AI-Powered Healthcare Revolution',
          creative_brief: 'Exploring how artificial intelligence is transforming medical care and patient outcomes',
          status: 'published',
          total_duration: 20,
          scene_count: 5,
          final_video_url: '/demo-video-2.mp4',
          thumbnail_url: '/demo-thumb-2.jpg',
          created_at: '2024-12-11T14:20:00Z',
          updated_at: '2024-12-11T14:35:00Z'
        },
        {
          id: '3',
          title: 'Future of Urban Mobility',
          creative_brief: 'A cinematic look at smart transportation systems reshaping cities worldwide',
          status: 'published', 
          total_duration: 12,
          scene_count: 3,
          final_video_url: '/demo-video-3.mp4',
          thumbnail_url: '/demo-thumb-3.jpg',
          created_at: '2024-12-10T09:15:00Z',
          updated_at: '2024-12-10T09:30:00Z'
        }
      ]
      
      setPublishedProjects(mockProjects)
    } catch (error) {
      console.error('Error loading published projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemix = async (project: VideoProject) => {
    // Reset current session and start with remix prompt
    resetSession()
    
    const remixPrompt = `Create a remix of "${project.title}". Original brief: ${project.creative_brief}. Please create a similar video with your own creative variations.`
    
    setTimeout(() => {
      startNewProject(remixPrompt)
    }, 500)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const generateThumbnailGradient = (index: number) => {
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-green-500',
      'from-orange-500 to-red-500',
      'from-teal-500 to-blue-500',
      'from-indigo-500 to-purple-500'
    ]
    return gradients[index % gradients.length]
  }

  if (loading) {
    return (
      <div className="glass-explore-container h-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="glass-loading-spinner mb-4" />
            <p className="glass-text-secondary">Loading published videos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-explore-container h-full explore-wall-bg">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 mb-6">
          <h2 className="glass-text-primary text-2xl font-bold mb-2">
            🌌 Explore Wall
          </h2>
          <p className="glass-text-secondary text-sm">
            Discover and remix amazing AI-generated videos from the community
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="glass p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Eye size={16} className="text-accent-primary" />
              <span className="glass-text-secondary text-sm">Total Videos</span>
            </div>
            <span className="glass-text-primary text-lg font-semibold">
              {publishedProjects.length}
            </span>
          </div>
          
          <div className="glass p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-accent-success" />
              <span className="glass-text-secondary text-sm">Creators</span>
            </div>
            <span className="glass-text-primary text-lg font-semibold">
              {Math.ceil(publishedProjects.length * 0.7)}
            </span>
          </div>
        </div>
        
        {/* Projects grid */}
        <div className="flex-1 overflow-y-auto glass-scrollbar">
          {publishedProjects.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-16 h-16 mx-auto mb-4 text-glass-text-secondary" />
              <p className="glass-text-secondary text-lg mb-2">No published videos yet</p>
              <p className="glass-text-secondary text-sm">
                Create and publish your first video to see it here!
              </p>
            </div>
          ) : (
            <div className="glass-explore-grid">
              {publishedProjects.map((project, index) => (
                <div key={project.id} className="glass-explore-card">
                  {/* Video thumbnail/preview */}
                  <div className="glass-explore-card-media">
                    <div className={`w-full h-full bg-gradient-to-br ${generateThumbnailGradient(index)} flex items-center justify-center relative`}>
                      <div className="text-center">
                        <Play className="w-12 h-12 text-white/80 mb-2" />
                        <p className="text-white/90 font-semibold text-sm">
                          {project.scene_count} Scenes
                        </p>
                        <p className="text-white/70 text-xs">
                          {project.total_duration}s total
                        </p>
                      </div>
                    </div>
                    
                    <div className="glass-play-overlay">
                      <Play size={24} className="text-white ml-1" />
                    </div>
                  </div>
                  
                  {/* Project info */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="glass-text-primary font-semibold text-lg mb-1 line-clamp-2">
                        {project.title}
                      </h4>
                      <p className="glass-text-secondary text-sm line-clamp-2 leading-relaxed">
                        {project.creative_brief}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 glass-text-secondary">
                        <Calendar size={12} />
                        {formatDate(project.created_at)}
                      </div>
                      <div className="glass-status-badge completed">
                        Published
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemix(project)}
                      className="glass-remix-button w-full"
                    >
                      <Shuffle size={16} />
                      Remix This Video
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}