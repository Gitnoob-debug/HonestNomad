'use client';

import type { Message } from '@/types/chat';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3
          ${
            isUser
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }
        `}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        <div
          className={`
            text-xs mt-1
            ${isUser ? 'text-primary-200' : 'text-gray-400'}
          `}
        >
          {format(new Date(message.timestamp), 'h:mm a')}
        </div>
      </div>
    </div>
  );
}
