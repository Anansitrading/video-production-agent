import React, { useState } from 'react'
import { Edit, Image as ImageIcon, Sparkles } from 'lucide-react'
import { StoryboardFrame } from '../lib/supabase'
import { ImageFrameEditor } from './ImageFrameEditor'

interface StoryboardGalleryProps {
  frames: StoryboardFrame[]
  onEditFrame?: (frameId: string, newPrompt: string) => void
}

export function StoryboardGallery({ frames, onEditFrame }: StoryboardGalleryProps) {
  const [editingFrame, setEditingFrame] = useState<StoryboardFrame | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

  const handleEditClick = (frame: StoryboardFrame) => {
    setEditingFrame(frame)
  }

  const handleSaveEdit = (newPrompt: string) => {
    if (editingFrame && onEditFrame) {
      onEditFrame(editingFrame.id, newPrompt)
    }
    setEditingFrame(null)
  }

  const handleImageError = (frameId: string) => {
    setImageLoadErrors(prev => new Set([...prev, frameId]))
  }

  if (!frames || frames.length === 0) {
    return (
      <div className="glass p-8 text-center">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-glass-text-secondary" />
        <p className="glass-text-secondary">No storyboard frames available</p>
      </div>
    )
  }

  return (
    <>
      <div className="glass-gallery">
        <div className="col-span-full mb-4">
          <h3 className="glass-text-primary text-lg font-semibold mb-2">
            🎨 Storyboard Frames
          </h3>
          <p className="glass-text-secondary text-sm">
            Click the edit button on any frame to modify its prompt and regenerate
          </p>
        </div>
        
        {frames.map((frame, index) => (
          <div key={frame.id} className="glass-image-frame group">
            <div className="relative">
              {imageLoadErrors.has(frame.id) ? (
                <div className="w-full aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-glass-text-secondary" />
                    <p className="text-xs glass-text-secondary">Image unavailable</p>
                    <p className="text-xs glass-text-secondary mt-1">Demo placeholder</p>
                  </div>
                </div>
              ) : (
                <img 
                  src={frame.image_url} 
                  alt={`Storyboard frame ${index + 1}`}
                  className="w-full aspect-video object-cover rounded-lg"
                  onError={() => handleImageError(frame.id)}
                  loading="lazy"
                />
              )}
              
              {/* Edit overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                <button
                  onClick={() => handleEditClick(frame)}
                  className="glass-button inline-flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Prompt
                </button>
              </div>
              
              {/* Frame number badge */}
              <div className="absolute top-2 left-2 glass-status-badge completed">
                Frame {frame.frame_number}
              </div>
            </div>
            
            {/* Frame details */}
            <div className="mt-3">
              <p className="glass-text-primary text-sm font-medium mb-1">
                Scene {frame.frame_number}
              </p>
              <p className="glass-text-secondary text-xs leading-relaxed">
                {frame.scene_description || frame.image_prompt}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles size={12} className="text-accent-primary" />
                <span className="glass-text-secondary text-xs">
                  {frame.duration}s duration
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Edit modal */}
      {editingFrame && (
        <ImageFrameEditor
          frame={editingFrame}
          onSave={handleSaveEdit}
          onClose={() => setEditingFrame(null)}
        />
      )}
    </>
  )
}