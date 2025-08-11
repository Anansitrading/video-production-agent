import React, { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Copy, CheckCircle } from 'lucide-react'

interface PlaybookDisplayProps {
  playbook: string
  title?: string
}

export function PlaybookDisplay({ playbook, title = 'Project Playbook' }: PlaybookDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(playbook)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy playbook:', error)
    }
  }

  return (
    <div className="glass-playbook-container">
      <div 
        className="glass-playbook-header cursor-pointer hover:bg-glass-white-subtle transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        <FileText size={20} className="text-accent-primary" />
        <h4 className="glass-text-primary font-semibold text-lg">{title}</h4>
        <span className="glass-text-secondary text-sm ml-auto">
          Click to {isExpanded ? 'collapse' : 'expand'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="glass-text-secondary text-sm">
              This YAML playbook contains all the steps and parameters used to create your video. 
              Use it to remix and recreate similar projects.
            </p>
            <button
              onClick={handleCopy}
              className="glass-button inline-flex items-center gap-2 text-sm"
            >
              {isCopied ? (
                <>
                  <CheckCircle size={14} className="text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy YAML
                </>
              )}
            </button>
          </div>
          
          <div className="glass-playbook-content">
            {playbook}
          </div>
          
          <div className="glass p-3 rounded-lg">
            <p className="glass-text-secondary text-xs mb-2">
              🔄 <strong>Remix this project:</strong>
            </p>
            <ul className="glass-text-secondary text-xs space-y-1 list-disc list-inside">
              <li>Modify scene descriptions for different content</li>
              <li>Change visual styles and cinematography</li>
              <li>Adjust duration and pacing</li>
              <li>Use different AI models or parameters</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}