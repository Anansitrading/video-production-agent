import React from 'react'
import { Play, Edit, Download, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Message } from '../contexts/VideoAgentContext'
import { StoryboardGallery } from './StoryboardGallery'
import { VideoPreviewGrid } from './VideoPreviewGrid'
import { PlaybookDisplay } from './PlaybookDisplay'

interface MessageBubbleProps {
  message: Message
  onEditFrame?: (frameId: string, newPrompt: string) => void
}

export function MessageBubble({ message, onEditFrame }: MessageBubbleProps) {
  const isUser = message.type === 'user'
  const isProcessing = message.status === 'processing'
  const isError = message.status === 'error'

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <div className={`glass-chat-message ${isUser ? 'user' : 'agent'} ${isError ? 'error' : ''}`}>
      <div className="flex items-start gap-3">
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
              AI
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="glass-text-primary font-semibold text-sm">
              {isUser ? 'You' : 'Video Production Agent'}
            </span>
            
            {message.step && (
              <span className={`glass-status-badge ${
                isProcessing ? 'processing' : 
                isError ? 'error' : 'completed'
              }`}>
                Step {message.step}
              </span>
            )}
            
            <span className="glass-text-secondary text-xs ml-auto">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          
          <div className="glass-text-primary">
            {isProcessing && (
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
            
            <ReactMarkdown 
              className="prose prose-invert prose-sm max-w-none"
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="glass-text-accent">{children}</strong>,
                em: ({ children }) => <em className="glass-text-secondary">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-3">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-3">{children}</ol>,
                li: ({ children }) => <li className="glass-text-primary">{children}</li>
              }}
            >
              {message.content}
            </ReactMarkdown>
            
            {/* Render special data types */}
            {message.data && (
              <div className="mt-4 space-y-4">
                {/* Storyboard frames */}
                {message.data.storyboardFrames && (
                  <StoryboardGallery 
                    frames={message.data.storyboardFrames}
                    onEditFrame={onEditFrame}
                  />
                )}
                
                {/* Video clips */}
                {message.data.videoClips && (
                  <VideoPreviewGrid clips={message.data.videoClips} />
                )}
                
                {/* Playbook */}
                {message.data.playbook && (
                  <PlaybookDisplay playbook={message.data.playbook} />
                )}
                
                {/* Final video */}
                {message.data.finalVideoUrl && (
                  <div className="glass-video-player">
                    <video 
                      controls 
                      className="w-full rounded-lg"
                      poster={message.data.thumbnailUrl}
                    >
                      <source src={message.data.finalVideoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    
                    <div className="flex justify-center mt-3">
                      <a
                        href={message.data.finalVideoUrl}
                        download
                        className="glass-button inline-flex items-center gap-2"
                      >
                        <Download size={16} />
                        Download Video
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold text-sm">
              U
            </div>
          </div>
        )}
      </div>
    </div>
  )
}