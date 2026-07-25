export const policies = {
  ChannelPolicy: () => import('#policies/channel_policy'),
  DivisionPolicy: () => import('#policies/division_policy'),
  TeamPolicy: () => import('#policies/team_policy'),
}

