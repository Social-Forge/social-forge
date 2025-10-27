<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { HomeNavbar, HomeMaxWidthWrapper, HomeAnimationContainer } from '@/components/home';
	import { ArrowRight } from '@lucide/svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { BorderBeam, MagicBadge } from '@/components';
	import { COMPANIES } from '@/constants/misc.js';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);
</script>

<MetaTags {...metaTags} />
<div
	class="bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] min-full absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)]"
></div>
<HomeNavbar />
<main class="relative z-0 mx-auto mt-20 w-full">
	<div class="scrollbar-hide size-full overflow-x-hidden">
		<HomeMaxWidthWrapper>
			<div
				class="from-background bg-linear-to-t flex w-full flex-col items-center justify-center text-center"
			>
				<HomeAnimationContainer
					variant="fade-up"
					delay={0.2}
					once={false}
					duration={1}
					distance={60}
					class="flex w-full flex-col items-center justify-center text-center"
				>
					<button
						class="group relative grid overflow-hidden rounded-full px-4 py-1 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors duration-200"
					>
						<span>
							<span
								class="spark mask-gradient animate-flip before:animate-rotate absolute inset-0 h-full w-full overflow-hidden rounded-full [mask:linear-gradient(white,transparent_50%)] before:absolute before:inset-[0_auto_auto_50%] before:aspect-square before:w-[200%] before:-rotate-90 before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[translate:-50%_-15%]"
							></span>
						</span>
						<span
							class="backdrop absolute inset-px rounded-full bg-neutral-950 transition-colors duration-200 group-hover:bg-neutral-900"
						></span>
						<span
							class="from-primary/20 bg-linear-to-tr absolute inset-x-0 bottom-0 h-full w-full blur-md"
						></span>
						<span
							class="z-10 flex items-center justify-center gap-1 py-0.5 text-sm text-neutral-100"
						>
							✨ Smart CRM and Web Builder
							<ArrowRight
								class="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
							/>
						</span>
					</button>
					<h1
						class="text-foreground leading-[1.15]! font-heading w-full text-balance py-6 text-center text-5xl font-medium tracking-normal sm:text-6xl md:text-7xl lg:text-8xl"
					>
						AI-powered <span
							class="bg-linear-to-r inline-bloc from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
						>
							Omnichannel CRM and Web Builder
						</span>
					</h1>
					<p class="text-muted-foreground mb-12 text-balance text-lg tracking-tight md:text-xl">
						Helps businesses to connect with customers across multiple channels, including email,
						chat, social media and web builder.
						<br class="hidden md:block" />
						<span class="hidden md:block"
							>Boosting marketing, customer service, and sales growth by up to 5x.</span
						>
					</p>
					<div class="z-50 flex items-center justify-center gap-4 whitespace-nowrap">
						<Button>
							<a href="/auth/sign-in" class="flex items-center">
								Book a Demo
								<ArrowRight class="ml-2 h-4 w-4" />
							</a>
						</Button>
					</div>
				</HomeAnimationContainer>
				<HomeAnimationContainer
					variant="fade-up"
					delay={0.2}
					once={false}
					duration={1}
					distance={60}
					class="relative w-full bg-transparent px-2 pb-20 pt-20 md:py-32"
				>
					<div
						class="mask-gradient animate-image-glow absolute inset-0 left-1/2 h-1/4 w-3/4 -translate-x-1/2 blur-[5rem] md:top-[10%] md:h-1/3"
					></div>
					<div
						class="ring-foreground/20 -m-2 rounded-xl bg-opacity-50 p-2 ring-1 ring-inset backdrop-blur-3xl lg:-m-4 lg:rounded-2xl"
					>
						<BorderBeam size={250} duration={12} delay={9} />
						<img
							src="/assets/dashboard-dark.svg"
							alt="Dashboard"
							width={1200}
							height={1200}
							loading="eager"
							decoding="async"
							class="bg-foreground/10 ring-border rounded-md ring-1 lg:rounded-xl"
						/>
						<div
							class="bg-linear-to-t from-background absolute inset-x-0 -bottom-4 z-40 h-1/2 w-full"
						></div>
						<div
							class="bg-linear-to-t from-background absolute inset-x-0 bottom-0 z-50 h-1/4 w-full md:-bottom-8"
						></div>
					</div>
				</HomeAnimationContainer>
			</div>
		</HomeMaxWidthWrapper>
		<HomeMaxWidthWrapper>
			<HomeAnimationContainer
				variant="fade-up"
				delay={0.2}
				once={false}
				duration={1}
				distance={60}
				class="relative"
			>
				<div
					class="animate-image-glow bg-linear-to-b absolute inset-0 h-full w-full from-transparent via-green-800/20 to-green-900/30 blur-[10rem] md:top-[10%]"
				></div>
				<div class="container mx-auto w-full max-w-6xl px-4 py-14 md:px-8">
					<div
						class="bg-linear-to-b relative flex flex-col space-y-8 rounded-2xl from-transparent via-neutral-600/20 to-neutral-900/40 px-6 py-10 md:px-10 md:py-14 dark:from-neutral-900/50 dark:via-neutral-900/60 dark:to-neutral-900/80"
					>
						<h2
							class="font-heading text-center text-sm font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-400"
						>
							Trusted by the best in the industry
						</h2>
						<div class="relative w-full overflow-hidden">
							<div
								class="bg-linear-to-r pointer-events-none absolute left-0 top-0 z-10 h-full w-20 from-white/20 to-transparent dark:from-neutral-900"
							></div>
							<div
								class="bg-linear-to-l pointer-events-none absolute right-0 top-0 z-10 h-full w-20 from-white/20 to-transparent dark:from-neutral-900"
							></div>
							<ul class="animate-marquee flex items-center justify-center gap-x-8 md:gap-x-16">
								{#each COMPANIES as company}
									<li class="shrink-0">
										<img
											src={company.logo}
											alt={company.name}
											width={80}
											height={80}
											loading="eager"
											decoding="async"
											class="h-auto w-20 transition-opacity hover:opacity-75 md:w-28"
										/>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			</HomeAnimationContainer>
		</HomeMaxWidthWrapper>
		<HomeMaxWidthWrapper class="pt-10">
			<HomeAnimationContainer variant="fade-down" threshold={0.1} once={false}>
				<div class="flex w-full flex-col items-center justify-center py-8 lg:items-center">
					<MagicBadge title="Features" />
					<h2
						class="leading-[1.1]! font-heading text-foreground mt-6 text-center text-3xl font-medium md:text-5xl lg:text-center"
					>
						Manage Links Like a Pro
					</h2>
					<p class="text-muted-foreground mt-4 max-w-lg text-center text-lg lg:text-center">
						Linkify is a powerful link management tool that helps you shorten, track, and organize
						all your links in one place.
					</p>
				</div>
			</HomeAnimationContainer>
			<HomeAnimationContainer
				variant="fade-up"
				threshold={0.2}
				once={false}
				duration={1}
				distance={30}
			></HomeAnimationContainer>
		</HomeMaxWidthWrapper>
	</div>
</main>

<style scoped>
	.mask-gradient {
		background: conic-gradient(
			from 230.29deg at 51.63% 52.16%,
			rgb(36, 0, 255) 0deg,
			rgb(0, 135, 255) 67.5deg,
			rgb(108, 39, 157) 198.75deg,
			rgb(24, 38, 163) 251.25deg,
			rgb(54, 103, 196) 301.88deg,
			rgb(105, 30, 255) 360deg
		);
	}
</style>
