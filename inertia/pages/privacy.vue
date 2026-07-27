<script setup lang="ts">
const sections = [
  {
    h: '1. Information we collect',
    p: 'We collect account information you provide (name, email, workspace details), the content of conversations routed through the platform, channel credentials you connect (stored encrypted), and usage/technical data such as log and device information needed to operate the service.',
  },
  {
    h: '2. How we use information',
    p: 'To provide and maintain the service, deliver and route messages across your connected channels, power AI auto-reply features, process billing, provide support, and keep the platform secure and reliable.',
  },
  {
    h: '3. Multi-tenant isolation',
    p: 'Each workspace (tenant) is isolated. Your conversations, contacts, and settings are scoped to your workspace and are not accessible to other tenants. Provider credentials are encrypted at rest.',
  },
  {
    h: '4. Sub-processors & third parties',
    p: 'We use messaging providers (WhatsApp/WAHA, Meta, Telegram), AI providers you enable, payment gateways, and cloud infrastructure to deliver the service. Data is shared with these providers only to the extent necessary to perform the requested operation.',
  },
  {
    h: '5. Data retention',
    p: 'We retain your data for as long as your workspace is active and as needed to provide the service. You may request export or deletion of your data, subject to legal and operational requirements.',
  },
  {
    h: '6. Security',
    p: 'We apply industry-standard measures including encryption of secrets at rest, scoped access controls, and audit trails. No method of transmission or storage is 100% secure, but we work continuously to protect your data.',
  },
  {
    h: '7. Your rights',
    p: 'Depending on your jurisdiction, you may have rights to access, correct, export, or delete your personal data. Contact us to exercise these rights.',
  },
  {
    h: '8. Contact',
    p: 'For privacy questions, email privacy@socialforge.app.',
  },
]
</script>

<template>
  <MetaHead
    title="Privacy Policy"
    description="How Social Forge collects, uses, and protects your data."
  />
  <MarketingShell>
    <h1 class="text-3xl font-bold tracking-tight">Privacy Policy</h1>
    <p class="text-muted-foreground mt-2 text-sm">Effective date: 27 July 2026</p>
    <p class="text-muted-foreground mt-4 text-sm leading-relaxed">
      This Privacy Policy explains how Social Forge ("we", "us") handles information when you use
      our platform. This page is a plain-language summary and should be reviewed by legal counsel
      before commercial launch.
    </p>

    <div class="mt-8 space-y-6 text-sm leading-relaxed">
      <section v-for="s in sections" :key="s.h">
        <h2 class="text-foreground text-base font-semibold">{{ s.h }}</h2>
        <p class="text-muted-foreground mt-1.5">{{ s.p }}</p>
      </section>
    </div>
  </MarketingShell>
</template>
