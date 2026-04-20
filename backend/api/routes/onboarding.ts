import {Router} from 'express';

import {requireUser} from '../middleware/auth';
import {getOpenAI} from '../openai';
import {getSupabaseAdmin} from '../supabase';

type PartialTraits = {
  display_name?: string;
  pronouns?: string;
  vibe?: string;
  dealbreakers?: string[];
};

type TranscriptMessage = {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

type AuthedRequest = Express.Request & {userId?: string};

type PostgrestResult<T> = Promise<{data: T | null; error: unknown}>;

type TableQuery<T> = {
  insert: (values: unknown) => TableQuery<T>;
  select: (columns: string) => TableQuery<T> & PostgrestResult<T>;
  single: () => PostgrestResult<T>;
  eq: (column: string, value: unknown) => TableQuery<T>;
  order: (
    column: string,
    options: {ascending: boolean}
  ) => TableQuery<T> & PostgrestResult<T>;
  update: (values: unknown) => TableQuery<T> & PostgrestResult<T>;
};

type SupabaseLike = {
  from: <T>(table: string) => TableQuery<T>;
};

const router = Router();

router.post('/session', requireUser, async (req, res) => {
  const userId = (req as AuthedRequest).userId as string;
  const supabaseAdmin = getSupabaseAdmin();
  const db = supabaseAdmin as unknown as SupabaseLike;

  const {data, error} = await db
    .from<{id: string}>('onboarding_sessions')
    .insert({user_id: userId, status: 'in_progress'})
    .select('id')
    .single();

  if (error || !data) {
    res.status(500).json({error: 'failed_to_create_session'});
    return;
  }

  res.json({id: data.id});
});

router.post('/message', requireUser, async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  const db = supabaseAdmin as unknown as SupabaseLike;
  const openai = getOpenAI();
  const {sessionId, content, traits} = req.body as {
    sessionId: string;
    content: string;
    traits?: PartialTraits;
  };

  if (!sessionId || !content) {
    res.status(400).json({error: 'missing_fields'});
    return;
  }

  await db
    .from<unknown>('onboarding_messages')
    .insert({session_id: sessionId, role: 'user', content});

  const {data: transcript} = await db
    .from<TranscriptMessage[]>('onboarding_messages')
    .select('role,content,created_at')
    .eq('session_id', sessionId)
    .order('created_at', {ascending: true});

  const system =
    'You are Wyrd, an onboarding assistant helping the user create an AI agent persona. Ask short, warm questions. Extract structured traits when possible.';

  const messages = [
    {role: 'system' as const, content: system},
    {
      role: 'system' as const,
      content: `Known structured fields (may be partial): ${JSON.stringify(traits ?? {})}`
    },
    ...((transcript as TranscriptMessage[] | null) ?? []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as string
    }))
  ];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages,
    temperature: 0.8
  });

  const assistantMessage =
    completion.choices[0]?.message?.content?.trim() ?? 'Tell me more.';

  await db.from<unknown>('onboarding_messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: assistantMessage
  });

  const extraction = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Extract onboarding traits from the conversation. Return STRICT JSON only with keys: display_name, pronouns, vibe, dealbreakers (array of strings). Omit unknown keys.'
      },
      {
        role: 'user',
        content: JSON.stringify({
          transcript: transcript ?? [],
          existing: traits ?? {}
        })
      }
    ],
    temperature: 0,
    response_format: {type: 'json_object'}
  });

  let parsed: PartialTraits | undefined;
  try {
    parsed = JSON.parse(
      extraction.choices[0]?.message?.content ?? '{}'
    ) as PartialTraits;
  } catch {
    parsed = undefined;
  }

  res.json({assistantMessage, traits: parsed});
});

router.post('/complete', requireUser, async (req, res) => {
  const userId = (req as AuthedRequest).userId as string;
  const supabaseAdmin = getSupabaseAdmin();
  const db = supabaseAdmin as unknown as SupabaseLike;
  const openai = getOpenAI();
  const {sessionId, traits} = req.body as {
    sessionId: string;
    traits?: PartialTraits;
  };

  if (!sessionId) {
    res.status(400).json({error: 'missing_sessionId'});
    return;
  }

  const {data: transcript} = await db
    .from<TranscriptMessage[]>('onboarding_messages')
    .select('role,content,created_at')
    .eq('session_id', sessionId)
    .order('created_at', {ascending: true});

  const finalization = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Create an agent persona prompt and traits JSON for a dating-app AI agent that lives a life. Return STRICT JSON with keys: persona_prompt (string), traits (object), display_name (string), pronouns (string optional), vibe (string optional), dealbreakers (array of strings optional).'
      },
      {
        role: 'user',
        content: JSON.stringify({
          transcript: transcript ?? [],
          structured: traits ?? {}
        })
      }
    ],
    temperature: 0.2,
    response_format: {type: 'json_object'}
  });

  const raw = finalization.choices[0]?.message?.content ?? '{}';

  let payload: {
    persona_prompt?: string;
    traits?: Record<string, unknown>;
    display_name?: string;
    pronouns?: string;
    vibe?: string;
    dealbreakers?: string[];
  };

  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    payload = {};
  }

  const displayName = payload.display_name ?? traits?.display_name ?? 'Agent';

  const {error: agentError} = await db
    .from<unknown>('agents')
    .insert({
      user_id: userId,
      display_name: displayName,
      pronouns: payload.pronouns ?? traits?.pronouns ?? null,
      vibe: payload.vibe ?? traits?.vibe ?? null,
      persona_prompt: payload.persona_prompt ?? '',
      traits: payload.traits ?? {},
      dealbreakers: payload.dealbreakers ?? traits?.dealbreakers ?? null
    })
    .select('id');

  if (agentError) {
    res.status(500).json({error: 'failed_to_create_agent'});
    return;
  }

  await db
    .from<unknown>('onboarding_sessions')
    .update({status: 'completed'})
    .eq('id', sessionId)
    .eq('user_id', userId);

  res.json({ok: true});
});

export default router;
