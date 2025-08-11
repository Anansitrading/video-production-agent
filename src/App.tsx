import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { VideoAgentProvider } from './contexts/VideoAgentContext'
import { ChatPane } from './components/ChatPane'
import { ChatInputBox } from './components/ChatInputBox'
import { ExploreWall } from './components/ExploreWall'
import { useVideoAgent } from './contexts/VideoAgentContext'
import { useAuth } from './contexts/AuthContext'
import { RotateCcw, Sparkles, Menu, X } from 'lucide-react'

function AppContent() {
  const { 
    startNewProject, 
    sendMessage, 
    resetSession, 
    isProcessing, 
    approveStoryboard,
    currentStep,
    videoClips 
  } = useVideoAgent()
  const { signInAnonymously, user } = useAuth()
  const [showExploreWall, setShowExploreWall] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSendMessage = async (message: string) => {
    // Detect if this is a new project request
    const projectKeywords = [
      'create', 'make', 'generate', 'video about', 'video on', 'produce',
      'build', 'develop', 'design', 'I want', 'I need', 'help me'
    ]
    
    const isNewProject = projectKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (isNewProject) {
      await startNewProject(message)
    } else {
      await sendMessage(message)
    }
  }

  const handleApprove = () => {
    approveStoryboard()
  }

  const handleReset = () => {
    resetSession()
    setShowExploreWall(false)
  }

  // Sign in anonymously for demo if not authenticated
  React.useEffect(() => {
    if (!user) {
      signInAnonymously()
    }
  }, [user, signInAnonymously])

  return (
    <div className="min-h-screen bg-gradient-cosmic bg-pattern-dots">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="glass-button p-3"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      <div className="flex h-screen">
        {/* Chat Panel */}
        <div className={`flex-1 flex flex-col ${
          showExploreWall ? 'lg:w-2/3' : 'w-full'
        } transition-all duration-300`}>
          <div className="flex-1 p-4">
            <ChatPane className="h-full" />
          </div>
          
          {/* Input area */}
          <div className="flex-shrink-0 p-4 space-y-4">
            {/* Approval panel for video previews */}
            {currentStep === 4 && videoClips.length > 0 && (
              <div className="glass-approval-panel">
                <h3 className="glass-text-primary text-lg font-semibold mb-2">
                  🎆 Ready to Generate Final Videos?
                </h3>
                <p className="glass-text-secondary mb-4">
                  The video previews look great! Click approve to generate the final high-quality videos.
                </p>
                <button
                  onClick={handleApprove}
                  className="glass-approve-button"
                  disabled={isProcessing}
                >
                  <Sparkles className="inline w-5 h-5 mr-2" />
                  Approve & Generate Final Videos
                </button>
              </div>
            )}
            
            {/* Control buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="glass-button inline-flex items-center gap-2"
                  disabled={isProcessing}
                >
                  <RotateCcw size={16} />
                  New Project
                </button>
                
                <button
                  onClick={() => setShowExploreWall(!showExploreWall)}
                  className="glass-button"
                >
                  {showExploreWall ? 'Hide' : 'Show'} Explore Wall
                </button>
              </div>
              
              {isProcessing && (
                <div className="flex items-center gap-2 glass-text-secondary text-sm">
                  <div className="glass-loading-spinner w-4 h-4" />
                  AI Pipeline Running...
                </div>
              )}
            </div>
            
            <ChatInputBox 
              onSendMessage={handleSendMessage}
              disabled={isProcessing}
            />
          </div>
        </div>
        
        {/* Explore Wall Panel */}
        <div className={`transition-all duration-300 ${
          showExploreWall 
            ? 'lg:w-1/3 w-full lg:relative absolute inset-0 z-40' 
            : 'w-0 overflow-hidden'
        } ${isMobileMenuOpen && showExploreWall ? 'block' : 'lg:block hidden'}`}>
          {showExploreWall && (
            <div className="h-full p-4">
              <ExploreWall />
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && showExploreWall && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <VideoAgentProvider>
        <AppContent />
      </VideoAgentProvider>
    </AuthProvider>
  )
}