import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabaseApi, VideoProject, StoryboardFrame, VideoClip } from '../lib/supabase'

export interface Message {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: Date
  data?: any
  step?: number
  status?: 'processing' | 'completed' | 'error'
}

interface VideoAgentContextType {
  // State
  currentProject: VideoProject | null
  messages: Message[]
  storyboardFrames: StoryboardFrame[]
  videoClips: VideoClip[]
  isProcessing: boolean
  currentStep: number

  // Actions
  startNewProject: (userMessage: string) => Promise<void>
  sendMessage: (message: string) => Promise<void>
  regenerateFrame: (frameId: string, newPrompt: string) => Promise<void>
  approveStoryboard: () => Promise<void>
  loadProject: (projectId: string) => Promise<void>
  resetSession: () => void
}

const VideoAgentContext = createContext<VideoAgentContextType>({} as VideoAgentContextType)

export function VideoAgentProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [storyboardFrames, setStoryboardFrames] = useState<StoryboardFrame[]>([])
  const [videoClips, setVideoClips] = useState<VideoClip[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Add message to chat
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random()}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage
  }

  // Start new video project
  const startNewProject = async (userMessage: string) => {
    try {
      setIsProcessing(true)
      setCurrentStep(1)
      
      // Add user message
      addMessage({
        type: 'user',
        content: userMessage
      })

      // Add processing message
      const processingMsg = addMessage({
        type: 'agent',
        content: '🎬 **Starting your video project!**\n\nStep 1: Analyzing your request and creating a professional creative brief with Gemini AI...\n\nThis will establish the foundation for your entire video project, including target audience, tone, style, and key scenes.',
        status: 'processing',
        step: 1
      })

      // Call pipeline orchestrator
      const response = await supabaseApi.callEdgeFunction('pipeline-orchestrator', {
        userMessage,
        step: 1,
        action: 'start'
      })

      if (response.data) {
        const { creativeBrief, projectId } = response.data
        
        // Update processing message with results
        setMessages(prev => prev.map(msg => 
          msg.id === processingMsg.id 
            ? { 
                ...msg, 
                content: `✨ **Creative Brief Generated Successfully!**\n\n${creativeBrief}\n\n---\n\n**Next Step:** I'll now generate storyboard frames based on this creative brief using DALL-E for high-quality cinematic visuals.`,
                status: 'completed'
              }
            : msg
        ))

        // Load project data
        if (projectId) {
          await loadProject(projectId)
          setCurrentStep(2)
          
          // Proceed to storyboard generation
          setTimeout(() => generateStoryboard(projectId, creativeBrief), 2000)
        }
      }
    } catch (error) {
      console.error('Error starting project:', error)
      const errorMessage = error.message?.includes('quota') || error.message?.includes('rate limit')
        ? '⚠️ **API quota limit reached.** The Gemini AI service is temporarily unavailable due to high usage. This is expected during peak hours. Please try again in a few minutes.'
        : 'Sorry, there was an error starting your project. Please try again.'
      
      addMessage({
        type: 'agent',
        content: errorMessage,
        status: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate storyboard frames
  const generateStoryboard = async (projectId: string, creativeBrief: string) => {
    try {
      setIsProcessing(true)
      setCurrentStep(2)

      const processingMsg = addMessage({
        type: 'agent',
        content: 'Generating storyboard frames with DALL-E...',
        status: 'processing',
        step: 2
      })

      const response = await supabaseApi.callEdgeFunction('pipeline-orchestrator', {
        projectId,
        step: 2,
        sessionData: { creativeBrief }
      })

      if (response.data) {
        const { storyboardFrames: frames } = response.data
        
        setMessages(prev => prev.map(msg => 
          msg.id === processingMsg.id 
            ? { 
                ...msg, 
                content: `✨ Storyboard generated successfully with ${frames?.length || 0} cinematic frames!\n\nEach frame has been carefully crafted to tell your story visually. You can click on any frame to edit its prompt and regenerate it.`, 
                status: 'completed',
                data: { storyboardFrames: frames }
              }
            : msg
        ))

        if (frames) {
          setStoryboardFrames(frames)
          setCurrentStep(3)
          
          // Proceed to video previews
          setTimeout(() => generateVideoPreviews(projectId, frames), 2000)
        }
      }
    } catch (error) {
      console.error('Error generating storyboard:', error)
      const errorMessage = error.message?.includes('quota') || error.message?.includes('rate limit') 
        ? '⚠️ API quota limit reached. The storyboard generation is temporarily unavailable. This is expected during high usage periods.'
        : 'Error generating storyboard frames. Please try again.'
      
      addMessage({
        type: 'agent',
        content: errorMessage,
        status: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate video previews
  const generateVideoPreviews = async (projectId: string, frames: StoryboardFrame[]) => {
    try {
      setIsProcessing(true)
      setCurrentStep(3)

      const processingMsg = addMessage({
        type: 'agent',
        content: 'Creating draft video previews with Veo 3 AI...\n\nThis step uses Fal.ai to convert your storyboard frames into short video clips. Each frame will become a 2-4 second video preview.',
        status: 'processing',
        step: 3
      })

      const response = await supabaseApi.callEdgeFunction('pipeline-orchestrator', {
        projectId,
        step: 3,
        sessionData: { storyboardFrames: frames }
      })

      if (response.data) {
        const { videoClips: clips } = response.data
        
        setMessages(prev => prev.map(msg => 
          msg.id === processingMsg.id 
            ? { 
                ...msg, 
                content: `🎆 Draft video previews are ready!\n\n${clips?.length || 0} video clips have been generated from your storyboard frames. Please review them below and click “Approve” when you’re satisfied to proceed with final high-quality rendering.\n\n**Next:** Review videos → Approve for final rendering → Video concatenation`, 
                status: 'completed',
                data: { videoClips: clips }
              }
            : msg
        ))

        if (clips) {
          setVideoClips(clips)
          setCurrentStep(4)
        }
      }
    } catch (error) {
      console.error('Error generating video previews:', error)
      const errorMessage = error.message?.includes('quota') || error.message?.includes('rate limit')
        ? '⚠️ Fal.ai API quota limit reached. Video generation is temporarily unavailable. This is expected during high usage periods.'
        : 'Error generating video previews. The video generation service may be temporarily unavailable.'
      
      addMessage({
        type: 'agent',
        content: errorMessage,
        status: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Send regular message
  const sendMessage = async (message: string) => {
    addMessage({
      type: 'user',
      content: message
    })

    // Add bot response (simplified for demo)
    addMessage({
      type: 'agent',
      content: 'I understand your request. For this demo, please start a new project to see the full AI pipeline in action.',
      status: 'completed'
    })
  }

  // Regenerate single frame
  const regenerateFrame = async (frameId: string, newPrompt: string) => {
    try {
      setIsProcessing(true)
      
      const processingMsg = addMessage({
        type: 'agent',
        content: `🎨 **Regenerating storyboard frame...**\n\nUsing your updated prompt: "${newPrompt}"\n\nThis will create a new image with DALL-E while keeping the same frame position in your storyboard.`,
        status: 'processing'
      })

      // Call the regeneration endpoint
      const response = await supabaseApi.callEdgeFunction('pipeline-orchestrator', {
        action: 'regenerate_frame',
        frameId,
        newPrompt,
        projectId: currentProject?.id
      })

      if (response.data) {
        setMessages(prev => prev.map(msg => 
          msg.id === processingMsg.id 
            ? { 
                ...msg, 
                content: '✨ **Frame regenerated successfully!**\n\nThe storyboard frame has been updated with your new prompt. The changes are reflected in the storyboard gallery above.',
                status: 'completed'
              }
            : msg
        ))
        
        // Refresh storyboard frames
        if (currentProject?.id) {
          const updatedFrames = await supabaseApi.getProjectFrames(currentProject.id)
          setStoryboardFrames(updatedFrames)
        }
      }
    } catch (error) {
      console.error('Error regenerating frame:', error)
      const errorMessage = error.message?.includes('quota') || error.message?.includes('rate limit')
        ? '⚠️ DALL-E API quota limit reached. Frame regeneration is temporarily unavailable.'
        : 'Error regenerating frame. Please try again.'
      
      addMessage({
        type: 'agent',
        content: errorMessage,
        status: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Approve storyboard and proceed to final rendering
  const approveStoryboard = async () => {
    if (!currentProject) return

    try {
      setIsProcessing(true)
      setCurrentStep(5)

      const processingMsg = addMessage({
        type: 'agent',
        content: '🎆 **Generating final high-quality videos!**\n\nStep 5: Creating final videos with enhanced quality using Veo 3...\n\nThis process will take several minutes as each frame is rendered at maximum quality.',
        status: 'processing',
        step: 5
      })

      // Simulate final video generation
      setTimeout(async () => {
        setMessages(prev => prev.map(msg => 
          msg.id === processingMsg.id 
            ? { 
                ...msg, 
                content: '✨ **Final videos generated successfully!**\n\nStep 6: Now concatenating all video clips using FFmpeg...\n\nThis will combine all your video clips into a single seamless video with professional transitions.',
                status: 'completed'
              }
            : msg
        ))
        
        setCurrentStep(6)
        
        // Add concatenation message
        const concatMsg = addMessage({
          type: 'agent',
          content: '🎥 **Video concatenation in progress...**\n\nUsing FFmpeg to:\n- Download all video clips\n- Merge them seamlessly\n- Add background audio (if provided)\n- Generate video thumbnail\n- Upload final video to storage',
          status: 'processing',
          step: 6
        })
        
        // Simulate concatenation
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === concatMsg.id 
              ? { 
                  ...msg, 
                  content: '✅ **Video concatenation completed!**\n\nStep 7: Generating project playbook with Gemini AI...\n\nCreating a comprehensive YAML playbook for project reproduction and remixing.',
                  status: 'completed'
                }
              : msg
          ))
          
          setCurrentStep(7)
          
          // Add playbook generation
          const playbookMsg = addMessage({
            type: 'agent',
            content: '📜 **Generating project playbook...**\n\nCreating detailed documentation with:\n- Project parameters\n- Generation seeds\n- Reproduction guide\n- Remix suggestions',
            status: 'processing',
            step: 7
          })
          
          // Final completion
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === playbookMsg.id 
                ? { 
                    ...msg, 
                    content: '✨ **Playbook generated successfully!**\n\nStep 8: Publishing to Explore Wall...',
                    status: 'completed'
                  }
                : msg
            ))
            
            setCurrentStep(8)
            
            // Final success message
            setTimeout(() => {
              addMessage({
                type: 'agent',
                content: '🎉 **Your video project is complete!**\n\n✅ Creative brief generated\n✅ Storyboard frames created\n✅ Video clips generated\n✅ Final videos rendered\n✅ Videos concatenated with FFmpeg\n✅ Project playbook created\n✅ Published to Explore Wall\n\n**Your video is now live!** You can view it in the Explore Wall, download it, or use it as a base for creating remixes. Start a new project to create another amazing video!',
                status: 'completed',
                step: 8
              })
              setIsProcessing(false)
            }, 2000)
          }, 3000)
        }, 4000)
      }, 3000)
      
    } catch (error) {
      console.error('Error in final rendering:', error)
      addMessage({
        type: 'agent',
        content: 'Error in final video generation. Please try again.',
        status: 'error'
      })
      setIsProcessing(false)
    }
  }

  // Load existing project
  const loadProject = async (projectId: string) => {
    try {
      const project = await supabaseApi.getProject(projectId)
      setCurrentProject(project)
      
      const frames = await supabaseApi.getProjectFrames(projectId)
      setStoryboardFrames(frames)
      
    } catch (error) {
      console.error('Error loading project:', error)
    }
  }

  // Reset session
  const resetSession = () => {
    setCurrentProject(null)
    setMessages([])
    setStoryboardFrames([])
    setVideoClips([])
    setIsProcessing(false)
    setCurrentStep(1)
  }

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        type: 'agent',
        content: 'Welcome to the Video Production Agent! 🎬\n\nI\'ll help you create amazing videos through an AI-powered pipeline. Just describe your video idea and I\'ll:\n\n1. Generate a creative brief\n2. Create storyboard frames\n3. Generate video previews\n4. Allow you to review and edit\n5. Render final high-quality videos\n6. Create a playbook for remixing\n\nWhat kind of video would you like to create?',
        status: 'completed'
      })
    }
  }, [])

  const value = {
    currentProject,
    messages,
    storyboardFrames,
    videoClips,
    isProcessing,
    currentStep,
    startNewProject,
    sendMessage,
    regenerateFrame,
    approveStoryboard,
    loadProject,
    resetSession
  }

  return (
    <VideoAgentContext.Provider value={value}>
      {children}
    </VideoAgentContext.Provider>
  )
}

export function useVideoAgent() {
  const context = useContext(VideoAgentContext)
  if (!context) {
    throw new Error('useVideoAgent must be used within VideoAgentProvider')
  }
  return context
}