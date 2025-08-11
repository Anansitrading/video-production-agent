import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, Upload, MicOff } from 'lucide-react'
import { useVideoAgent } from '../contexts/VideoAgentContext'

interface ChatInputBoxProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInputBox({ onSendMessage, disabled = false }: ChatInputBoxProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isProcessing } = useVideoAgent()

  // Handle send message
  const handleSend = () => {
    if (message.trim() && !disabled && !isProcessing) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle voice recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder) {
        mediaRecorder.stop()
        setIsRecording(false)
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        
        recorder.ondataavailable = (event) => {
          // Handle audio data - for demo, we'll just show a message
          if (event.data.size > 0) {
            setMessage('Voice input recorded (demo mode)')
          }
        }
        
        recorder.onstart = () => {
          setIsRecording(true)
        }
        
        recorder.onstop = () => {
          setIsRecording(false)
          stream.getTracks().forEach(track => track.stop())
        }
        
        setMediaRecorder(recorder)
        recorder.start()
      } catch (error) {
        console.error('Error accessing microphone:', error)
        alert('Unable to access microphone. Please check permissions.')
      }
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // For demo, just show file name
      setMessage(`Uploaded file: ${file.name}`)
    }
  }

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <div className="glass-chat-input-container">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Describe your video idea..."
        className="glass-chat-input"
        disabled={disabled || isProcessing}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="glass-upload-button"
        disabled={disabled || isProcessing}
        title="Upload reference file"
      >
        <Upload size={18} />
      </button>
      
      <button
        onClick={toggleRecording}
        className={`glass-mic-button ${isRecording ? 'recording' : ''}`}
        disabled={disabled || isProcessing}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
      </button>
      
      <button
        onClick={handleSend}
        className="glass-send-button"
        disabled={!message.trim() || disabled || isProcessing}
        title="Send message"
      >
        <Send size={18} />
      </button>
    </div>
  )
}