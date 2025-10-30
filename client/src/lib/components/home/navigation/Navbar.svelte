<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '@/utils';
	import { HomeAnimationContainer, HomeMaxWidthWrapper, HomeMobileNavbar } from '..';
	import { ToggleTheme } from '@/components';
	import * as NavigationMenu from '@/components/ui/navigation-menu';
	import { ZapIcon } from '@lucide/svelte';
	import { Button } from '@/components/ui/button';
	import { NAV_LINKS } from '@/constants';

	let isScroll = $state(false);

	const handleScroll = () => {
		isScroll = window.scrollY > 0;
	};

	onMount(() => {
		if (browser) {
			window.addEventListener('scroll', handleScroll);
		}
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('scroll', handleScroll);
		}
	});
</script>

<header
	class={cn(
		'z-99999 sticky inset-x-0 top-0 h-14 w-full select-none border-b border-transparent',
		isScroll && 'border-background/80 bg-background/40 backdrop-blur-md'
	)}
>
	<HomeAnimationContainer delay={0.1} class="size-full py-3">
		<HomeMaxWidthWrapper class="flex items-center justify-between">
			<nav class="flex items-center space-x-12">
				<Button href="/" class="flex items-center" variant="link">
					<img src="/images/logo-1.png" alt="logo" class="h-13 w-auto" />
				</Button>
				<NavigationMenu.Root class="hidden lg:flex">
					<NavigationMenu.List>
						{#each NAV_LINKS as link (link.title)}
							<NavigationMenu.Item>
								{#if link.menu}
									<NavigationMenu.Trigger
										class="bg-transparent hover:bg-transparent active:bg-transparent"
									>
										{link.title}
									</NavigationMenu.Trigger>
									<NavigationMenu.Content>
										<ul
											class={cn(
												'grid gap-1 rounded-xl p-4 md:w-[400px] lg:w-[500px]',
												link.title === 'Features' ? 'lg:grid-cols-[.75fr_1fr]' : 'lg:grid-cols-2'
											)}
										>
											{#if link.title === 'Features'}
												<li class="relative row-span-4 overflow-hidden rounded-lg pr-2">
													<div
														class="z-10! bg-size-[1rem_1rem] absolute inset-0 h-full w-[calc(100%-10px)] bg-[linear-gradient(to_right,rgb(38,38,38,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgb(38,38,38,0.5)_1px,transparent_1px)]"
													></div>
													<NavigationMenu.Link class="relative z-20 h-full">
														{#snippet children()}
															<!-- svelte-ignore a11y_invalid_attribute -->
															<a
																href="#"
																class="bg-linear-to-b from-muted/50 to-muted flex h-full w-full select-none flex-col justify-end rounded-lg p-4 no-underline outline-none focus:shadow-md"
															>
																<h6 class="mb-2 mt-4 text-lg font-medium">All Features</h6>
																<p class="text-muted-foreground text-sm leading-tight">
																	Manage links, track performance, and more.
																</p>
															</a>
														{/snippet}
													</NavigationMenu.Link>
												</li>
											{/if}
											{#each link.menu as subItem}
												<li>
													<NavigationMenu.Link
														href={subItem.href}
														class={cn(
															'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-100 ease-out'
														)}
													>
														<div
															class="flex items-center space-x-2 text-neutral-600 dark:text-neutral-300"
														>
															<subItem.icon class="h-4 w-4" />
															<h6 class="leading-none! text-sm font-medium">
																{subItem.title}
															</h6>
														</div>
														<p
															title={subItem.tagline}
															class="text-muted-foreground line-clamp-1 text-sm leading-snug"
														>
															{subItem.tagline}
														</p>
													</NavigationMenu.Link>
												</li>
											{/each}
										</ul>
									</NavigationMenu.Content>
								{:else}
									<NavigationMenu.Link href={link.href}>
										{link.title}
									</NavigationMenu.Link>
								{/if}
							</NavigationMenu.Item>
						{/each}
					</NavigationMenu.List>
				</NavigationMenu.Root>
			</nav>
			<div class="hidden items-center lg:flex">
				<div class="flex items-center gap-x-4">
					<Button href="/auth/sign-in" size="sm" variant="ghost">Sign In</Button>
					<Button href="/auth/sign-up" size="sm">
						Get Started
						<ZapIcon class="ml-1.5 size-3.5 fill-orange-500 text-orange-500" />
					</Button>
					<ToggleTheme />
				</div>
			</div>
			<HomeMobileNavbar />
		</HomeMaxWidthWrapper>
	</HomeAnimationContainer>
</header>

<style scoped>
	/* Your styles here */
</style>
