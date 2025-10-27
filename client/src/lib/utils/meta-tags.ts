import type { MetaTagsProps, MetaTag, LinkTag } from 'svelte-meta-tags';

export const defaultMetaTags = (options?: PageMetaProps): MetaTagsProps => ({
	title: options?.is_homepage
		? 'Social Forge - Omnichannel CRM, Customer Service Platform and Web Builder'
		: `${options?.title || ''} - Social Forge`,
	description: options?.is_homepage
		? 'Social Forge is an AI-powered omnichannel CRM and customer service platform that helps businesses to connect with customers across multiple channels, including email, chat, social media and web builder. Boosting marketing, customer service, and sales growth by up to 5x.'
		: options?.description || '',
	keywords: options?.is_homepage
		? ['social forge', 'omnichannel crm', 'customer service platform', 'web builder']
		: options?.keywords || [],
	robots: options?.is_homepage ? 'index, follow' : options?.robots || '',
	twitter: {
		cardType: 'summary_large_image',
		site: '@social_forge',
		image: '/images/cover.png'
	},
	additionalMetaTags: [
		{
			name: 'viewport',
			content: 'width=device-width, initial-scale=1.0'
		},
		{
			property: 'dc:creator',
			content: 'Social Forge'
		},
		{
			name: 'application-name',
			content: 'Social Forge'
		},
		{
			httpEquiv: 'x-ua-compatible',
			content: 'IE=edge'
		},
		{
			name: 'description',
			content: options?.description || ''
		}
	] as MetaTag[],
	additionalLinkTags: [
		{
			rel: 'canonical',
			href: options?.canonical || ''
		},
		{
			rel: 'icon',
			type: 'image/x-icon',
			sizes: '96x96',
			href: '/favicon.ico'
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '32x32',
			href: '/favicon-32x32.png'
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '16x16',
			href: '/favicon-16x16.png'
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '192x192',
			href: '/favicon-192x192.png'
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '512x512',
			href: '/favicon-512x512.png'
		},
		{
			rel: 'apple-touch-icon',
			type: 'image/png',
			sizes: '180x180',
			href: '/apple-touch-icon.png'
		}
	] as LinkTag[],
	openGraph: {
		type: options?.graph_type || 'website',
		url: options?.canonical || '',
		title: options?.title || '',
		description: options?.description || '',
		locale: 'en_IE',
		siteName: 'Social Forge',
		images: [
			{
				url: '/images/cover.png',
				width: 800,
				height: 600,
				alt: 'Social Forge Cover Image',
				type: 'image/png'
			},
			{
				url: '/favicon.ico',
				width: 512,
				height: 512,
				alt: 'Social Forge Android Chrome Icon',
				type: 'image/x-icon'
			}
		],
		profile: {
			firstName: 'Social',
			lastName: 'Forge',
			username: 'social_forge'
		}
	}
});
