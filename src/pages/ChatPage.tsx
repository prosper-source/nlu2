import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getChatMessages, sendMessage, deleteMessage, joinPresenceRoom, leavePresenceRoom } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Send, Trash2, MessageSquare, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types';

interface PresenceUser {
  id: string;
  username: string;
  avatar_url: string;
  online_at: string;
}

export default function ChatPage() {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try { const data = await getChatMessages(100); setMessages(data); setTimeout(scrollToBottom, 100); }
      catch (err) { console.error(err); } finally { setLoading(false); }
    }
    load();

    const channel = supabase
      .channel('chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          const { data: userData } = await supabase.from('users').select('*').eq('id', newMsg.user_id || newMsg.author_id).maybeSingle();
          setMessages((prev) => [...prev, { ...newMsg, user: userData || undefined }]);
          setTimeout(scrollToBottom, 50);
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        (payload) => { setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id)); })
      .subscribe();

    const presenceChannel = joinPresenceRoom('chat-presence', user);
    presenceChannelRef.current = presenceChannel;
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const users: PresenceUser[] = [];
      for (const presences of Object.values(state)) { for (const p of presences) { users.push(p as unknown as PresenceUser); } }
      setOnlineUsers(users);
    });

    return () => { supabase.removeChannel(channel); if (presenceChannelRef.current) { leavePresenceRoom(presenceChannelRef.current); } };
  }, [user, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !input.trim()) return;
    const msg = input.trim(); setInput(''); setSending(true);
    try { await sendMessage(user.id, msg); } catch (err: any) { toast({ title: err.message || 'Failed to send', variant: 'destructive' }); } finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteMessage(id); } catch (err: any) { toast({ title: err.message || 'Failed to delete', variant: 'destructive' }); }
  };

  if (loading) return <LoadingSpinner />;

  const canDelete = (msg: ChatMessage) => msg.user_id === user?.id || msg.author_id === user?.id || isAdmin;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="top-glow pt-2">
          <h1 className="text-2xl font-display font-bold text-white gradient-text">Clan Chat</h1>
          <p className="text-slate-500 text-sm font-body">Real-time squad communication</p>
        </motion.div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-card-glow border-white/[0.06]">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-400 font-display">{onlineUsers.length} online</span>
          </div>
          {onlineUsers.length > 0 && (
            <div className="hidden sm:flex items-center -space-x-2">
              {onlineUsers.slice(0, 5).map((u) => (
                <Avatar key={u.id} className="w-6 h-6 border-2 border-surface-950">
                  <AvatarImage src={u.avatar_url} />
                  <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-[8px]">{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
              {onlineUsers.length > 5 && (
                <span className="w-6 h-6 rounded-full glass-card border-2 border-surface-950 flex items-center justify-center text-[8px] text-slate-500 font-display">+{onlineUsers.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-xl glass-card-glow border-white/[0.06] flex flex-col overflow-hidden top-glow">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full py-20">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-body">No messages yet. Say hello!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((msg) => {
                  const msgUserId = msg.user_id || msg.author_id;
                  const isOwn = msgUserId === user?.id;
                  const isOnline = onlineUsers.some((u) => u.id === msgUserId);
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <div className="relative shrink-0">
                        <Avatar className="w-8 h-8 border border-crimson-500/15">
                          <AvatarImage src={msg.user?.avatar_url} />
                          <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-xs">{(msg.user?.username || 'U')[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-900" />}
                      </div>
                      <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                        <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-display font-medium text-slate-400">{msg.user?.display_name || msg.user?.username || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-600 font-body">{new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          {canDelete(msg) && !isOwn && (
                            <button onClick={() => handleDelete(msg.id)} className="text-slate-700 hover:text-rose-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                          )}
                        </div>
                        <div className={`inline-block px-3 py-2 rounded-xl text-sm font-body ${
                          isOwn ? 'bg-crimson-500/12 text-crimson-100 border border-crimson-500/12' : 'bg-white/[0.03] text-slate-300 border border-white/[0.06]'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSend} className="p-3 border-t border-white/[0.06] flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." maxLength={500}
            className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
          <Button type="submit" size="icon" disabled={sending || !input.trim()} className="bg-crimson-500 hover:bg-crimson-600 text-white shrink-0 glow-btn">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
