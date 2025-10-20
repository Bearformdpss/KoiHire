'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Send, User, MoreVertical, Paperclip, Smile, Loader2, ExternalLink, X, FileText, Download } from 'lucide-react'
import { messagesApi } from '@/lib/api/messages'
import { socketService } from '@/lib/services/socketService'
import { useAuthStore } from '@/lib/store/authStore'
import { groupMessages, formatMessageTime, MessageGroup } from '@/lib/utils/messageGrouping'
import { validateFile, formatFileSize, isImage, getFileIcon } from '@/lib/utils/fileUpload'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface Message {
  id: string
  content: string
  type: string
  senderId: string
  conversationId: string
  createdAt: string
  attachments?: string[]
  sender: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

interface Conversation {
  id: string
  projectId: string
  project?: {
    id: string
    title: string
    status: string
    client?: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatar?: string
    }
    freelancer?: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatar?: string
    }
  }
  serviceOrder?: {
    id: string
    service: {
      id: string
      title: string
    }
  }
  participants: Array<{
    user: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatar?: string
    }
  }>
}

interface TypingUser {
  userId: string
  conversationId: string
  isTyping: boolean
}

interface ChatInterfaceProps {
  conversation: Conversation
}

export function ChatInterface({ conversation }: ChatInterfaceProps) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (conversation) {
      fetchMessages()
    }
  }, [conversation.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await messagesApi.getMessages(conversation.id)
      if (response.success) {
        setMessages(response.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest'
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!newMessage.trim() && selectedFiles.length === 0) || sending) return

    setSending(true)

    try {
      let attachmentUrls: string[] = []

      // Upload files first if any are selected
      if (selectedFiles.length > 0) {
        const uploadResponse = await messagesApi.uploadFiles(selectedFiles, setUploadProgress)
        console.log('Upload response:', uploadResponse)
        if (uploadResponse.success) {
          attachmentUrls = uploadResponse.files.map((file: any) => file.url)
          console.log('Attachment URLs:', attachmentUrls)
        }
      }

      // Send via HTTP API
      const messageData = {
        content: newMessage.trim() || '(File attachment)',
        type: selectedFiles.length > 0 ? 'FILE' : 'TEXT',
        attachments: attachmentUrls
      }
      console.log('Sending message with data:', messageData)
      const response = await messagesApi.sendMessage(conversation.id, messageData)

      if (response.success) {
        // Add the message to local state immediately for better UX
        const newMsg: Message = {
          id: response.message.id,
          content: newMessage.trim() || '(File attachment)',
          type: selectedFiles.length > 0 ? 'FILE' : 'TEXT',
          senderId: user!.id,
          conversationId: conversation.id,
          createdAt: new Date().toISOString(),
          attachments: attachmentUrls,
          sender: {
            id: user!.id,
            username: user!.username,
            firstName: user!.firstName,
            lastName: user!.lastName,
            avatar: user!.avatar
          }
        }
        setMessages(prev => [...prev, newMsg])
        setNewMessage('')
        setSelectedFiles([])
        setUploadProgress(0)
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    // For now, just update the message state without real-time typing indicators
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate each file
    const validFiles: File[] = []
    for (const file of files) {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        toast.error(`${file.name}: ${validation.error}`)
      }
    }

    // Limit to 5 files total
    const totalFiles = selectedFiles.length + validFiles.length
    if (totalFiles > 5) {
      toast.error('Maximum 5 files allowed per message')
      setSelectedFiles([...selectedFiles, ...validFiles].slice(0, 5))
    } else {
      setSelectedFiles([...selectedFiles, ...validFiles])
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success(`Downloaded ${fileName}`)
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download file')
    }
  }

  const getOtherParticipant = () => {
    return conversation.participants.find(p => p.user.id !== user?.id)?.user
  }

  const otherParticipant = getOtherParticipant()

  // Group messages by date and cluster consecutive messages from same sender
  const messageGroups: MessageGroup[] = useMemo(() => {
    return groupMessages(messages)
  }, [messages])

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              {otherParticipant?.avatar ? (
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown User'}
              </h3>
              {conversation.project && (
                <Link
                  href={`/projects/${conversation.project.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 w-fit"
                >
                  <span className="truncate">{conversation.project.title}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </Link>
              )}
              {!conversation.project && conversation.serviceOrder && (
                <Link
                  href={`/services/${conversation.serviceOrder.service.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 w-fit"
                >
                  <span className="truncate">{conversation.serviceOrder.service.title}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </Link>
              )}
              {!conversation.project && !conversation.serviceOrder && (
                <p className="text-sm text-gray-500">Direct conversation</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {conversation.project && (
              <Link href={`/projects/${conversation.project.id}`}>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  View Project
                </Button>
              </Link>
            )}
            {!conversation.project && conversation.serviceOrder && (
              <Link href={`/services/${conversation.serviceOrder.service.id}`}>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  View Service
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
              <p className="text-gray-600">Send a message to begin discussing your project.</p>
            </div>
          </div>
        ) : (
          <>
            {messageGroups.map((group, groupIndex) => (
              <div key={group.date} className="space-y-3">
                {/* Date Separator */}
                <div className="flex items-center justify-center py-2">
                  <div className="bg-gray-200 rounded-full px-3 py-1">
                    <span className="text-xs font-medium text-gray-600">{group.dateLabel}</span>
                  </div>
                </div>

                {/* Messages in this date group */}
                {group.messages.map((message, messageIndex) => {
                  const isOwn = message.senderId === user?.id
                  const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null
                  const isNewCluster = !prevMessage || prevMessage.senderId !== message.senderId

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                        message.isFirstInGroup ? 'mt-4' : 'mt-1'
                      }`}
                    >
                      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
                        {/* Show sender name for first message in cluster (for messages from others) */}
                        {message.showSender && !isOwn && (
                          <span className="text-xs text-gray-500 mb-1 px-1">
                            {message.sender.firstName} {message.sender.lastName}
                          </span>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`px-4 py-2 ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-tl-sm'
                          }`}
                        >
                          {/* File attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2 mb-2">
                              {message.attachments.map((attachment: string, index: number) => {
                                // Use Next.js API proxy instead of direct backend URL
                                const fullUrl = `/api${attachment}`
                                const fileName = attachment.split('/').pop() || 'file'
                                const isImageFile = isImage(attachment)

                                console.log('Attachment:', attachment, 'Full URL:', fullUrl, 'Is Image:', isImageFile)

                                return (
                                  <div key={index} className="relative group">
                                    {isImageFile ? (
                                      <div className="relative">
                                        <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                                          <img
                                            src={fullUrl}
                                            alt={fileName}
                                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                            style={{ maxHeight: '300px' }}
                                            onError={(e) => {
                                              console.error('Image failed to load:', fullUrl)
                                              e.currentTarget.style.display = 'none'
                                            }}
                                          />
                                        </a>
                                        {/* Download button overlay for images */}
                                        <button
                                          onClick={() => handleDownload(fullUrl, fileName)}
                                          className={`absolute top-2 right-2 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                                            isOwn ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-800 hover:bg-gray-900'
                                          } text-white`}
                                          title="Download image"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleDownload(fullUrl, fileName)}
                                        className={`flex items-center space-x-2 p-2 rounded w-full ${
                                          isOwn ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-100 hover:bg-gray-200'
                                        } transition-colors`}
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm truncate flex-1 text-left">{fileName}</span>
                                        <Download className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Message text */}
                          {message.content && message.content !== '(File attachment)' && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                        </div>

                        {/* Show timestamp on first message in cluster */}
                        {message.showTimestamp && (
                          <span
                            className={`text-xs mt-1 px-1 ${
                              isOwn ? 'text-gray-500' : 'text-gray-500'
                            }`}
                          >
                            {formatMessageTime(message.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start mt-2">
                <div className="bg-gray-200 rounded-lg px-4 py-2 max-w-xs">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{otherParticipant?.firstName} is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
        {/* File previews */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative bg-gray-100 rounded-lg p-2 flex items-center space-x-2 max-w-xs">
                <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{file.name}</span>
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex-1">
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={sending}>
              <Smile className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}