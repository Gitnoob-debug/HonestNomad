import { createServiceRoleClient } from './server';

export async function createConversation(
  sessionId: string,
  userId?: string
): Promise<any> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      session_id: sessionId,
      user_id: userId,
      state: { stage: 'gathering_info' },
      preferences: {},
      last_search_results: [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data;
}

export async function getConversation(id: string): Promise<any | null> {
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

  return data;
}

export async function getConversationBySession(sessionId: string): Promise<any | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get conversation: ${error.message}`);
  }

  return data;
}

export async function updateConversation(
  id: string,
  updates: {
    state?: any;
    preferences?: any;
    lastSearchResults?: any[];
  }
): Promise<any> {
  const supabase = createServiceRoleClient();

  // Get current conversation
  const current = await getConversation(id);
  if (!current) {
    throw new Error('Conversation not found');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.state) {
    updateData.state = { ...current.state, ...updates.state };
  }

  if (updates.preferences) {
    updateData.preferences = { ...current.preferences, ...updates.preferences };
  }

  if (updates.lastSearchResults) {
    updateData.last_search_results = updates.lastSearchResults;
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

  return data;
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata: Record<string, any> = {},
  tokens?: { input?: number; output?: number }
): Promise<any> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata,
      input_tokens: tokens?.input,
      output_tokens: tokens?.output,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add message: ${error.message}`);
  }

  return data;
}

export async function getMessages(conversationId: string): Promise<any[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return data || [];
}

export async function linkConversationToUser(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('conversations')
    .update({ user_id: userId })
    .eq('id', conversationId);

  if (error) {
    throw new Error(`Failed to link conversation to user: ${error.message}`);
  }
}
