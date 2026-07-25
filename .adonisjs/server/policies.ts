export const policies = {
  AiAgentPolicy: () => import('#policies/ai_agent_policy'),
  ChannelPolicy: () => import('#policies/channel_policy'),
  DivisionPolicy: () => import('#policies/division_policy'),
  TeamPolicy: () => import('#policies/team_policy'),
}

