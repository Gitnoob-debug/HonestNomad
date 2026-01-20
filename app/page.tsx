import { ChatContainer } from '@/components/chat/ChatContainer';

export default function HomePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <ChatContainer />
    </div>
  );
}
