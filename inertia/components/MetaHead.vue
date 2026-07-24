<script setup lang="ts">
import { Head, usePage } from '@inertiajs/vue3'

interface MetaProps {
  title?: string
  description?: string
  robot?: string
  image?: string
  keywords?: string
}
const props = defineProps<MetaProps>()
const page = usePage()

const currentUrl = computed(() => {
  const url = page.url || ''
  const baseUrl = 'https://socialforge.io'
  return `${baseUrl}${url}`
})
const metaTitle = computed(() =>
  props.title
    ? `${props.title} - Social Forge`
    : 'Social Forge - Multi-agent Customer Service and Omnichannel CRM'
)
const metaDesc = computed(
  () =>
    props.description ||
    'Social Forge is the best multi-agent and multi-channel WhatsApp CRM to serve customers on WhatsApp, Instagram, Facebook, and your website.'
)
const metaRobot = computed(() => props.robot || 'index, follow')
const metaKeywords = computed(
  () =>
    props.keywords ||
    'crm whatsapp, omnichannel crm, multi-agent customer service, whatsapp blast, integrasi instagram facebook'
)
const metaImage = computed(() => props.image || 'https://socialforge.id') // Ganti dengan path gambar OG default kamu
</script>

<template>
  <Head>
    <!-- 1. Standard SEO Tags -->
    <title>{{ metaTitle }}</title>
    <meta name="description" :content="metaDesc" />
    <meta name="keywords" :content="metaKeywords" />
    <meta name="robots" :content="metaRobot" />
    <link rel="canonical" :href="currentUrl" />

    <!-- 2. Open Graph / Facebook / WhatsApp / LinkedIn -->
    <meta property="og:type" content="website" />
    <meta property="og:url" :content="currentUrl" />
    <meta property="og:title" :content="metaTitle" />
    <meta property="og:description" :content="metaDesc" />
    <meta property="og:image" :content="metaImage" />
    <meta property="og:site_name" content="Social Forge" />

    <!-- 3. Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" :content="currentUrl" />
    <meta name="twitter:title" :content="metaTitle" />
    <meta name="twitter:description" :content="metaDesc" />
    <meta name="twitter:image" :content="metaImage" />

    <!-- 4. Google Verification (Opsional) -->
    <!-- <meta name="google-site-verification" content="KODE_VERIFIKASI_GOOGLE_KAMU" /> -->
  </Head>
</template>
