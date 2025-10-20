/**
 * Message Grouping Utilities
 * Groups messages by date and clusters consecutive messages from the same sender
 */

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
  [key: string]: any
}

export interface GroupedMessage extends Message {
  showTimestamp: boolean
  showSender: boolean
  isFirstInGroup: boolean
  isLastInGroup: boolean
}

export interface MessageGroup {
  date: string
  dateLabel: string
  messages: GroupedMessage[]
}

/**
 * Get formatted date label for message grouping
 */
export function getDateLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Reset time to midnight for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today'
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }
}

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Check if two messages should be clustered together
 * Messages cluster if:
 * - Same sender
 * - Within 5 minutes of each other
 */
function shouldCluster(msg1: Message, msg2: Message, clusterWindowMinutes: number = 5): boolean {
  if (msg1.senderId !== msg2.senderId) return false

  const time1 = new Date(msg1.createdAt).getTime()
  const time2 = new Date(msg2.createdAt).getTime()
  const diffMinutes = Math.abs(time2 - time1) / (1000 * 60)

  return diffMinutes <= clusterWindowMinutes
}

/**
 * Group messages by date and cluster consecutive messages from same sender
 */
export function groupMessages(messages: Message[]): MessageGroup[] {
  if (!messages || messages.length === 0) {
    return []
  }

  // Sort messages by creation time (ascending - oldest first)
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const groups: MessageGroup[] = []
  let currentGroup: MessageGroup | null = null

  sortedMessages.forEach((message, index) => {
    const messageDate = new Date(message.createdAt)
    const dateKey = messageDate.toDateString()

    // Create new group if date changed or this is the first message
    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = {
        date: dateKey,
        dateLabel: getDateLabel(messageDate),
        messages: []
      }
      groups.push(currentGroup)
    }

    // Determine if this message should show timestamp and sender
    const prevMessage = index > 0 ? sortedMessages[index - 1] : null
    const nextMessage = index < sortedMessages.length - 1 ? sortedMessages[index + 1] : null

    const isFirstInCluster = !prevMessage || !shouldCluster(prevMessage, message)
    const isLastInCluster = !nextMessage || !shouldCluster(message, nextMessage)

    const groupedMessage: GroupedMessage = {
      ...message,
      showTimestamp: isFirstInCluster, // Show timestamp on first message in cluster
      showSender: isFirstInCluster,    // Show sender on first message in cluster
      isFirstInGroup: isFirstInCluster,
      isLastInGroup: isLastInCluster
    }

    currentGroup.messages.push(groupedMessage)
  })

  return groups
}

/**
 * Format time for display in message
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format date and time for full timestamp display
 */
export function formatFullTimestamp(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  if (isSameDay(date, today)) {
    return `Today at ${timeStr}`
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, yesterday)) {
    return `Yesterday at ${timeStr}`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
