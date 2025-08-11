import React from 'react'
import { Play, Clock, Download } from 'lucide-react'
import { VideoClip } from '../lib/supabase'

interface VideoPreviewGridProps {
  clips: VideoClip[]
  onApprove?: () => void
}

export function VideoPreviewGrid({ clips, onApprove }: VideoPreviewGridProps) {
  if (!clips || clips.length === 0) {
    return (
      <div className="glass p-8 text-center">
        <Play className="w-12 h-12 mx-auto mb-4 text-glass-text-secondary" />
        <p className="glass-text-secondary">No video clips available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-video-preview-grid">
        <div className="col-span-full mb-4">
          <h3 className="glass-text-primary text-lg font-semibold mb-2">
            🎬 Video Previews
          </h3>
          <p className="glass-text-secondary text-sm">
            Review the generated video clips below. Click approve when ready to proceed.
          </p>
        </div>
        
        {clips.map((clip, index) => (
          <div key={clip.id} className="glass-video-preview-card">
            <div className="relative">
              {/* Video player or placeholder */}
              <div className="w-full aspect-video bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                {clip.video_url ? (
                  <video 
                    className="w-full h-full object-cover rounded-lg"
                    controls
                    loop
                    muted
                    autoPlay={false}
                  >
                    <source src={clip.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center">
                    <Play className="w-12 h-12 mx-auto mb-2 text-glass-text-secondary" />
                    <p className="text-sm glass-text-secondary">Video generating...</p>
                    <p className="text-xs glass-text-secondary mt-1">This may take a few minutes</p>
                  </div>
                )}
                
                {/* Status badge */}
                <div className="absolute top-2 left-2">
                  <span className={`glass-status-badge ${
                    clip.status === 'completed' ? 'completed' :
                    clip.status === 'pending' ? 'processing' : 'draft'
                  }`}>
                    {clip.clip_type === 'draft' ? 'Draft' : 'Final'} Clip {index + 1}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Clip details */}
            <div className="glass-video-controls">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-accent-primary" />
                <span className="glass-text-secondary text-sm">
                  {clip.duration}s
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {clip.video_url && (
                  <a
                    href={clip.video_url}
                    download
                    className="glass-button p-2"
                    title="Download clip"
                  >
                    <Download size={14} />
                  </a>
                )}
              </div>
            </div>
            
            {/* Generation info */}
            <div className="mt-3">
              <p className="glass-text-secondary text-xs">
                Generated with: <span className="glass-text-accent">Veo 3</span>
              </p>
              {clip.generation_seed && (
                <p className="glass-text-secondary text-xs mt-1 font-mono">
                  Seed: {clip.generation_seed.slice(0, 8)}...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Approval panel */}
      {onApprove && (
        <div className="glass-approval-panel">
          <h3 className="glass-text-primary text-lg font-semibold mb-2">
            Ready to Proceed?
          </h3>
          <p className="glass-text-secondary mb-4">
            Review the video previews above. If you're satisfied with the results, click approve to generate the final high-quality videos.
          </p>
          <button
            onClick={onApprove}
            className="glass-approve-button"
          >
            🎆 Approve & Generate Final Videos
          </button>
        </div>
      )}
    </div>
  )
}