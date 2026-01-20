import { createServiceRoleClient } from './server';
import type { Conversation, ConversationState, ConversationPreferences, DbMessage } from '@/types/database';

export async function createConversation(
  sessionId: string,
  userId?: string
): Promise<Conversation> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      sessionId,
      userId,
      state: { stage: 'gathering_info' } as ConversationState,
      preferences: {} as ConversationPreferences,
      lastSearchResults: [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data as Conversation;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get conversation: ${error.message}`);
  }

  return data as Conversation;
}

export async function getConversationBySession(sessionId: string): Promise<Conversation | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('sessionId', sessionId)
    .order('createdAt', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get conversation: ${error.message}`);
  }

  return data as Conversation;
}

export async function updateConversation(
  id: string,
  updates: {
    state?: Partial<ConversationState>;
    preferences?: Partial<ConversationPreferences>;
    lastSearchResults?: any[];
  }
): Promise<Conversation> {
  const supabase = createServiceRoleClient();

  // Get current conversation
  const current = await getConversation(id);
  if (!current) {
    throw new Error('Conversation not found');
  }

  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.state) {
    updateData.state = { ...current.state, ...updates.state };
  }

  if (updates.preferences) {
    updateData.preferences = { ...current.preferences, ...updates.preferences };
  }

  if (updates.lastSearchResults) {
    updateData.lastSearchResults = updates.lastSearchResults;
  }

  const { data, error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update conversation: ${error.message}`);
  }

  return data as Conversation;
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata: Record<string, any> = {},
  tokens?: { input?: number; output?: number }
): Promise<DbMessage> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversationId,
      role,
      content,
      metadata,
      inputTokens: tokens?.input,
      outputTokens: tokens?.output,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add message: ${error.message}`);
  }

  return data as DbMessage;
}

export async function getMessages(conversationId: string): Promise<DbMessage[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversationId', conversationId)
    .order('createdAt', { ascending: true });

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return data as DbMessage[];
}

export async function linkConversationToUser(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('conversations')
    .update({ userId })
    .eq('id', conversationId);

  if (error) {
    throw new Error(`Failed to link conversation to user: ${error.message}`);
  }
}
