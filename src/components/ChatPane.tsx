import React, { useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { useVideoAgent } from '../contexts/VideoAgentContext'

interface ChatPaneProps {
  className?: string
}

export function ChatPane({ className = '' }: ChatPaneProps) {
  const { messages, regenerateFrame } = useVideoAgent()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={`glass-chat-container h-full ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-glass-border-subtle">
          <h1 className="glass-text-primary text-2xl font-bold mb-2">
            🎬 Video Production Agent
          </h1>
          <p className="glass-text-secondary text-sm">
            AI-powered video creation with real-time collaboration
          </p>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 glass-scrollbar">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="glass-loading-spinner mb-4" />
                <p className="glass-text-secondary">Loading...</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                onEditFrame={regenerateFrame}
              />
            ))
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}