import { supabase } from '@/lib/supabase';
import type { UserProfile, JoinRequest, WarSubmission, Announcement, ChatMessage } from '@/types';

// ========== PROFILE ==========

export async function updateProfile(userId: string, updates: Partial<Pick<UserProfile, 'username' | 'display_name' | 'full_name' | 'bio' | 'avatar_url' | 'game_tag'>>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  return publicUrl;
}

// ========== MEMBERS ==========

export async function getApprovedMembers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('role', ['member', 'admin'])
    .order('total_points', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// ========== JOIN REQUESTS ==========

export async function getJoinRequests(): Promise<JoinRequest[]> {
  const { data, error } = await supabase
    .from('join_requests')
    .select('*, user:users(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function approveJoinRequest(requestId: string) {
  const { data, error } = await supabase.rpc('approve_join_request', { request_id: requestId });
  if (error) throw new Error(error.message);
  return data;
}

export async function rejectJoinRequest(requestId: string) {
  const { data, error } = await supabase.rpc('reject_join_request', { request_id: requestId });
  if (error) throw new Error(error.message);
  return data;
}

export async function getMyJoinRequest(userId: string): Promise<JoinRequest | null> {
  const { data, error } = await supabase
    .from('join_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ========== WAR SUBMISSIONS ==========

export async function submitWarPoints(userId: string, points: number, warDate: string, note: string = '') {
  const { data, error } = await supabase
    .from('war_submissions')
    .insert({ user_id: userId, points, war_date: warDate, note })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getWarSubmissions(): Promise<WarSubmission[]> {
  const { data, error } = await supabase
    .from('war_submissions')
    .select('*, user:users(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getMyWarSubmissions(userId: string): Promise<WarSubmission[]> {
  const { data, error } = await supabase
    .from('war_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function approveWarSubmission(submissionId: string) {
  const { data, error } = await supabase.rpc('approve_war_submission', { submission_id: submissionId });
  if (error) throw new Error(error.message);
  return data;
}

export async function rejectWarSubmission(submissionId: string) {
  const { data, error } = await supabase.rpc('reject_war_submission', { submission_id: submissionId });
  if (error) throw new Error(error.message);
  return data;
}

export async function getPendingSubmissions(): Promise<WarSubmission[]> {
  const { data, error } = await supabase
    .from('war_submissions')
    .select('*, user:users(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// ========== ANNOUNCEMENTS ==========

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, user:users!announcements_created_by_fkey(*)')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createAnnouncement(title: string, content: string, createdBy: string, pinned: boolean = false) {
  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, content, created_by: createdBy, author_id: createdBy, pinned })
    .select('*, user:users!announcements_created_by_fkey(*)')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAnnouncement(id: string, updates: Partial<Pick<Announcement, 'title' | 'content' | 'pinned'>>) {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select('*, user:users!announcements_created_by_fkey(*)')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ========== CHAT ==========

export async function getChatMessages(limit = 50): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, user:users(*)')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function sendMessage(userId: string, message: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, author_id: userId, message })
    .select('*, user:users(*)')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from('chat_messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ========== LEADERBOARD ==========

export async function getLeaderboard(period: 'weekly' | 'alltime' = 'alltime'): Promise<UserProfile[]> {
  if (period === 'alltime') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['member', 'admin'])
      .order('total_points', { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data || [];
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('role', ['member', 'admin'])
    .order('weekly_points', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data || [];
}

// ========== ADMIN ==========

export async function updateUserRole(userId: string, role: 'pending' | 'member' | 'admin') {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getDashboardStats() {
  const [membersResult, weeklyResult, pendingResult, requestsResult] = await Promise.all([
    supabase.from('users').select('id, total_points, weekly_points, role, username, avatar_url, display_name', { count: 'exact' }).in('role', ['member', 'admin']),
    supabase.from('users').select('weekly_points').in('role', ['member', 'admin']),
    supabase.from('war_submissions').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('join_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
  ]);

  if (membersResult.error) throw new Error(membersResult.error.message);
  if (weeklyResult.error) throw new Error(weeklyResult.error.message);

  const totalMembers = membersResult.count || 0;
  const weeklyPoints = (weeklyResult.data || []).reduce((sum, u) => sum + (u.weekly_points || 0), 0);
  const pendingSubmissions = pendingResult.count || 0;
  const pendingRequests = requestsResult.count || 0;
  const topContributors = (membersResult.data || [])
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 5);

  return { totalMembers, weeklyPoints, pendingSubmissions, pendingRequests, topContributors };
}

// ========== PRESENCE ==========

export function joinPresenceRoom(roomName: string, user: UserProfile) {
  const channel = supabase.channel(roomName, {
    config: { presence: { key: user.id } },
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        online_at: new Date().toISOString(),
      });
    }
  });

  return channel;
}

export function leavePresenceRoom(channel: ReturnType<typeof supabase.channel>) {
  supabase.removeChannel(channel);
}
