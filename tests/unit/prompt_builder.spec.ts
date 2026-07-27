import { test } from '@japa/runner'
import AiAgent from '#models/ai_agent'
import AiPlaybook from '#models/ai_playbook'
import PromptBuilder from '#services/ai/prompt_builder'

function makeAgent(overrides: Partial<Record<string, any>> = {}): AiAgent {
  const agent = new AiAgent()
  agent.systemPrompt = overrides.systemPrompt ?? 'Sell our coffee subscription.'
  agent.persona = overrides.persona ?? null
  agent.safety = overrides.safety ?? null
  agent.guardrails = overrides.guardrails ?? null
  return agent
}

function makePlaybook(data: Partial<Record<string, any>>): AiPlaybook {
  const pb = new AiPlaybook()
  pb.name = data.name ?? 'PB'
  pb.keywords = data.keywords ?? []
  pb.instruction = data.instruction ?? ''
  pb.assetIds = data.assetIds ?? []
  pb.priority = data.priority ?? 0
  pb.isActive = data.isActive ?? true
  return pb
}

test.group('PromptBuilder.matchPlaybooks', () => {
  test('matches by keyword (case-insensitive) and sorts by priority', ({ assert }) => {
    const pbs = [
      makePlaybook({ name: 'price', keywords: ['harga', 'price'], priority: 1 }),
      makePlaybook({ name: 'proof', keywords: ['testimoni', 'bukti'], priority: 5 }),
    ]
    const matched = PromptBuilder.matchPlaybooks(pbs, 'Boleh minta BUKTI dan harga nya kak?')
    assert.lengthOf(matched, 2)
    assert.equal(matched[0].name, 'proof') // higher priority first
  })

  test('ignores inactive playbooks and non-matches', ({ assert }) => {
    const pbs = [
      makePlaybook({ name: 'off', keywords: ['diskon'], isActive: false }),
      makePlaybook({ name: 'x', keywords: ['warranty'] }),
    ]
    assert.lengthOf(PromptBuilder.matchPlaybooks(pbs, 'ada diskon?'), 0)
  })
})

test.group('PromptBuilder.touchesAvoidTopic', () => {
  test('detects a configured sensitive topic', ({ assert }) => {
    const agent = makeAgent({ safety: { avoidTopics: ['refund', 'lawsuit'] } })
    assert.isTrue(PromptBuilder.touchesAvoidTopic(agent, 'I want a REFUND now'))
    assert.isFalse(PromptBuilder.touchesAvoidTopic(agent, 'what colors are available?'))
  })

  test('no topics configured → never sensitive', ({ assert }) => {
    assert.isFalse(PromptBuilder.touchesAvoidTopic(makeAgent(), 'refund please'))
  })
})

test.group('PromptBuilder.build', () => {
  test('assembles identity, mission, guardrails, safety, playbooks & knowledge', ({ assert }) => {
    const agent = makeAgent({
      systemPrompt: 'Help customers buy our coffee.',
      persona: { agentName: 'Kopiko', gender: 'female', styleTone: 'Friendly, use "Kak".' },
      guardrails: ['Never promise same-day delivery'],
      safety: { avoidTopics: ['medical claims'], onSensitive: 'handoff' },
    })
    const matched = [makePlaybook({ name: 'Proof', instruction: 'Share a testimonial image.' })]
    const knowledge = [{ title: 'Shipping', content: 'We ship nationwide.', score: 0.9 }]

    const prompt = PromptBuilder.build(agent, matched, knowledge)

    assert.include(prompt, 'Kopiko')
    assert.include(prompt, 'Help customers buy our coffee.')
    assert.include(prompt, 'Friendly, use "Kak".')
    assert.include(prompt, 'Never promise same-day delivery')
    assert.include(prompt, 'medical claims')
    assert.include(prompt, 'a human teammate will take over')
    assert.include(prompt, 'Share a testimonial image.')
    assert.include(prompt, 'We ship nationwide.')
    // Always sales-oriented.
    assert.include(prompt, 'closing')
  })

  test('disclaimer mode changes the safety instruction', ({ assert }) => {
    const agent = makeAgent({ safety: { avoidTopics: ['legal'], onSensitive: 'disclaimer' } })
    const prompt = PromptBuilder.build(agent, [], [])
    assert.include(prompt, 'brief, safe disclaimer')
  })
})
