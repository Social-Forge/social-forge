<script setup lang="ts">
const sections = [
  {
    h: '1. Acceptance of terms',
    p: 'By creating a workspace or using Social Forge, you agree to these Terms of Service. If you use the service on behalf of an organization, you represent that you have authority to bind that organization.',
  },
  {
    h: '2. The service',
    p: 'Social Forge provides an omnichannel customer service inbox, an embeddable webchat widget, AI-assisted replies, and related tooling. Features and limits depend on your subscription plan.',
  },
  {
    h: '3. Accounts & responsibilities',
    p: 'You are responsible for maintaining the confidentiality of your credentials, for the activity of your team members, and for complying with the terms of the messaging providers you connect (WhatsApp, Meta, Telegram, etc.).',
  },
  {
    h: '4. Acceptable use',
    p: 'You must not use the service to send spam, unlawful, or abusive content, to violate any third-party platform policy, or to infringe others’ rights. We may suspend workspaces that violate these terms.',
  },
  {
    h: '5. Subscriptions, billing & AI credits',
    p: 'Paid plans and add-ons are billed via our payment provider. AI usage is metered in credits and debited as replies are generated. Fees are non-refundable except where required by law. Plans that lapse are downgraded to the free tier.',
  },
  {
    h: '6. AI-generated content',
    p: 'AI replies are generated automatically and may be inaccurate. You are responsible for reviewing and supervising automated responses in customer-facing use.',
  },
  {
    h: '7. Availability & changes',
    p: 'We strive for high availability but do not guarantee uninterrupted service. We may update features and these terms; material changes will be communicated in advance where practical.',
  },
  {
    h: '8. Limitation of liability',
    p: 'To the maximum extent permitted by law, Social Forge is provided "as is" and we are not liable for indirect or consequential damages arising from use of the service.',
  },
  {
    h: '9. Contact',
    p: 'Questions about these terms? Email legal@socialforge.app.',
  },
]
</script>

<template>
  <MetaHead
    title="Terms of Service"
    description="The terms governing your use of the Social Forge platform."
  />
  <MarketingShell>
    <h1 class="text-3xl font-bold tracking-tight">Terms of Service</h1>
    <p class="text-muted-foreground mt-2 text-sm">Effective date: 27 July 2026</p>
    <p class="text-muted-foreground mt-4 text-sm leading-relaxed">
      These terms govern your use of Social Forge. This page is a plain-language summary and should
      be reviewed by legal counsel before commercial launch.
    </p>

    <div class="mt-8 space-y-6 text-sm leading-relaxed">
      <section v-for="s in sections" :key="s.h">
        <h2 class="text-foreground text-base font-semibold">{{ s.h }}</h2>
        <p class="text-muted-foreground mt-1.5">{{ s.p }}</p>
      </section>
    </div>
  </MarketingShell>
</template>
