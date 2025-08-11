import React, { useState } from 'react'
import { X, Sparkles, RotateCcw } from 'lucide-react'
import { StoryboardFrame } from '../lib/supabase'

interface ImageFrameEditorProps {
  frame: StoryboardFrame
  onSave: (newPrompt: string) => void
  onClose: () => void
}

export function ImageFrameEditor({ frame, onSave, onClose }: ImageFrameEditorProps) {
  const [prompt, setPrompt] = useState(frame.image_prompt || frame.scene_description || '')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSave = async () => {
    if (prompt.trim() === (frame.image_prompt || frame.scene_description || '').trim()) {
      onClose()
      return
    }
    
    setIsGenerating(true)
    
    // Simulate generation delay
    setTimeout(() => {
      onSave(prompt.trim())
      setIsGenerating(false)
    }, 2000)
  }

  const handleReset = () => {
    setPrompt(frame.image_prompt || frame.scene_description || '')
  }

  return (
    <div className="glass-frame-editor-overlay">
      <div className="glass-frame-editor-modal">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="glass-text-primary text-xl font-semibold">
            Edit Frame {frame.frame_number}
          </h3>
          <button
            onClick={onClose}
            className="glass-button p-2"
            disabled={isGenerating}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Current image preview */}
        <div className="glass-image-frame mb-6">
          <img 
            src={frame.image_url} 
            alt={`Frame ${frame.frame_number}`}
            className="w-full aspect-video object-cover rounded-lg"
          />
          <div className="absolute top-2 right-2 glass-status-badge draft">
            Current Version
          </div>
        </div>
        
        {/* Prompt editor */}
        <div className="space-y-4">
          <div>
            <label className="block glass-text-primary text-sm font-medium mb-2">
              <Sparkles className="inline w-4 h-4 mr-1" />
              Scene Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="glass-prompt-textarea"
              placeholder="Describe the scene in detail..."
              rows={4}
              disabled={isGenerating}
            />
          </div>
          
          <div className="glass p-3 rounded-lg">
            <p className="glass-text-secondary text-xs mb-2">
              💡 <strong>Tips for better results:</strong>
            </p>
            <ul className="glass-text-secondary text-xs space-y-1 list-disc list-inside">
              <li>Be specific about visual elements (lighting, colors, composition)</li>
              <li>Include camera angle and movement (close-up, wide shot, pan, etc.)</li>
              <li>Describe the mood and atmosphere</li>
              <li>Mention any specific style (cinematic, artistic, documentary)</li>
            </ul>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleReset}
            className="glass-button inline-flex items-center gap-2"
            disabled={isGenerating}
          >
            <RotateCcw size={16} />
            Reset to Original
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="glass-button"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="glass-regenerate-button inline-flex items-center gap-2"
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Regenerate Frame
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}