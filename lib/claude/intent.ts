import { openrouter, MODEL, MAX_TOKENS } from './client';
import { SYSTEM_PROMPT } from './prompts';
import type { ParsedIntent, ConversationMessage, ConversationContext } from '@/types/intent';

export async function parseIntent(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  currentState: ConversationContext
): Promise<ParsedIntent> {
  // Build context with current state
  const stateContext = currentState
    ? `
Current conversation state:
- Stage: ${currentState.stage || 'initial'}
- Known preferences: ${JSON.stringify(currentState.preferences || {})}
- Last search results count: ${currentState.lastSearchResultsCount || 0}
${currentState.selectedHotelId ? `- Selected hotel ID: ${currentState.selectedHotelId}` : ''}
`
    : '';

  const messages = [
    {
      role: 'system' as const,
      content: SYSTEM_PROMPT + '\n\n' + stateContext,
    },
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages,
  });

  // Extract text content
  const textContent = response.choices[0]?.message?.content;
  if (!textContent) {
    throw new Error('No text response from LLM');
  }

  // Parse JSON response
  try {
    // Try to extract JSON from the response
    let jsonText = textContent.trim();

    // Handle case where model wraps JSON in markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText);

    return {
      intent: parsed.intent || 'other',
      message: parsed.message || textContent,
      extractedParams: parsed.extractedParams || {},
      missingRequired: parsed.missingRequired || [],
      readyToSearch: parsed.readyToSearch || false,
      selectedHotelId: parsed.selectedHotelId,
      action: parsed.action || null,
    };
  } catch (e) {
    // If model didn't return valid JSON, wrap the response
    console.error('Failed to parse LLM response as JSON:', textContent);
    return {
      intent: 'other',
      message: textContent,
      extractedParams: {},
      missingRequired: [],
      readyToSearch: false,
      action: null,
    };
  }
}

export function buildConversationHistory(
  messages: Array<{ role: string; content: string }>
): ConversationMessage[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
}
