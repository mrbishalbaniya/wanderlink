// src/components/chat/ChatInterface.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, SendHorizonal, Smile } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Mock data - replace with actual data fetching and state management
const mockUsers = [
  { id: 'user1', name: 'Alice Wonderland', avatar: 'https://placehold.co/100x100.png?text=AW', lastMessage: 'See you there!', time: '10:30 AM', unread: 2 },
  { id: 'user2', name: 'Bob The Builder', avatar: 'https://placehold.co/100x100.png?text=BB', lastMessage: 'Sounds good!', time: 'Yesterday', unread: 0 },
  { id: 'user3', name: 'Charlie Brown', avatar: 'https://placehold.co/100x100.png?text=CB', lastMessage: 'Okay, let me check.', time: 'Mon', unread: 0 },
];

const mockMessages = {
  user1: [
    { id: 'msg1', text: 'Hey, how are you?', sender: 'other', time: '10:25 AM' },
    { id: 'msg2', text: 'Doing great! Excited for the trip.', sender: 'me', time: '10:26 AM' },
    { id: 'msg3', text: 'Me too! Packing my bags now.', sender: 'other', time: '10:28 AM' },
    { id: 'msg4', text: 'See you there!', sender: 'other', time: '10:30 AM' },
  ],
  user2: [
    { id: 'msg5', text: 'Can we reschedule?', sender: 'other', time: 'Yesterday' },
    { id: 'msg6', text: 'Sounds good!', sender: 'me', time: 'Yesterday' },
  ],
   user3: [
    { id: 'msg7', text: 'Okay, let me check.', sender: 'other', time: 'Mon' },
  ]
};

type Message = { id: string; text: string; sender: 'me' | 'other'; time: string };
type User = typeof mockUsers[0];

export default function ChatInterface() {
  const [selectedUser, setSelectedUser] = useState<User | null>(mockUsers[0]);
  const [messages, setMessages] = useState<Message[]>(selectedUser ? mockMessages[selectedUser.id as keyof typeof mockMessages] : []);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedUser) {
      setMessages(mockMessages[selectedUser.id as keyof typeof mockMessages] || []);
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedUser) return;
    const msg: Message = {
      id: `msg${Date.now()}`,
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    // Here you would also send the message to your backend/Firebase
  };


  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)]  border border-border/70 rounded-xl shadow-2xl overflow-hidden bg-card/50 dark:bg-card/40 backdrop-blur-lg">
      {/* Sidebar with contacts */}
      <div className="w-1/4 min-w-[280px] border-r border-border/50 bg-background/30 dark:bg-background/20 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b border-border/50">
          <Input placeholder="Search contacts..." className="bg-background/70 dark:bg-muted/50 rounded-lg shadow-sm" />
        </div>
        <ScrollArea className="flex-1">
          {mockUsers.map(user => (
            <div
              key={user.id}
              className={`flex items-center p-3 hover:bg-muted/50 dark:hover:bg-muted/30 cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-muted/70 dark:bg-muted/40' : ''}`}
              onClick={() => setSelectedUser(user)}
            >
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person avatar" />
                <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.lastMessage}</p>
              </div>
              <div className="text-right ml-2">
                <p className="text-xs text-muted-foreground">{user.time}</p>
                {user.unread > 0 && (
                  <span className="mt-1 inline-block bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {user.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-background/10 dark:bg-transparent">
        {selectedUser ? (
          <>
            <div className="flex items-center p-4 border-b border-border/50 bg-background/30 dark:bg-background/20 backdrop-blur-sm shadow-sm">
              <Avatar className="h-10 w-10 mr-3">
                 <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} data-ai-hint="person avatar" />
                <AvatarFallback>{selectedUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-base">{selectedUser.name}</p>
                <p className="text-xs text-green-500">Online</p> {/* Replace with actual status */}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 space-y-4 bg-transparent">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl shadow-md ${msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none dark:bg-muted'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 bg-background/30 dark:bg-background/20 backdrop-blur-sm flex items-center space-x-3">
              <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Smile className="h-5 w-5" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-background/70 dark:bg-muted/50 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                autoComplete="off"
              />
              <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 rounded-lg shadow-md">
                <SendHorizonal className="h-5 w-5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-lg text-muted-foreground">Select a chat to start messaging</p>
              <p className="text-sm text-muted-foreground/80">Or find friends and start a new conversation.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
