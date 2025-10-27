<script lang="ts">
	import * as Sheet from '@/components/ui/sheet';
	import * as Accordion from '@/components/ui/accordion';
	import { Menu, X } from '@lucide/svelte';
	import { Button } from '@/components/ui/button';
	import { cn } from '@/utils';
	import { NAV_LINKS } from '@/constants';

	let isOpen = $state(false);
</script>

<div class="flex items-center justify-end lg:hidden">
	<Sheet.Root bind:open={isOpen} onOpenChange={(open) => (isOpen = open)}>
		<Sheet.Trigger>
			{#snippet children()}
				<Button variant="ghost" size="icon">
					<Menu class="h-5 w-5" />
				</Button>
			{/snippet}
		</Sheet.Trigger>
		<Sheet.Content side="right" class="w-full">
			{#snippet children()}
				<Sheet.Close>
					{#snippet children()}
						<div class="bg-background absolute right-5 top-3 z-20 flex items-center justify-center">
							<X class="h-5 w-5" />
						</div>
					{/snippet}
				</Sheet.Close>
				<div class="mt-10 flex max-w-3xl flex-col items-start py-2">
					<div class="flex w-full items-center justify-center gap-4">
						<Button href="/auth/sign-in" variant="outline" class="w-[43%]">Sign In</Button>
						<Button href="/auth/sign-up" class="w-[43%]">Sign Up</Button>
					</div>
					<ul class="mt-6 flex w-full flex-col items-start">
						<Accordion.Root type="single" class="w-full">
							{#each NAV_LINKS as link (link.title)}
								<Accordion.Item value={link.title} class="last:border-none! px-5">
									{#if link.menu}
										<Accordion.Trigger class="w-full justify-start py-4">
											{link.title}
										</Accordion.Trigger>
										<Accordion.Content class="w-full">
											<div
												role="button"
												tabindex="0"
												aria-label={`${link.title} menu`}
												class={cn('w-full cursor-pointer')}
												onclick={() => (isOpen = false)}
												onkeydown={(e) => {
													if (e.key === 'Enter') {
														isOpen = false;
													}
												}}
											>
												{#each link.menu as item (item.title)}
													<a
														href={item.href}
														title={item.title}
														class={cn(
															'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors'
														)}
													>
														<div class="text-foreground flex items-center space-x-2">
															<item.icon class="h-5 w-5" />
															<h6 class="leading-none! text-sm">{item.title}</h6>
														</div>
														<p
															title={item.tagline}
															class="text-muted-foreground line-clamp-1 text-sm leading-snug"
														>
															{item.tagline}
														</p>
													</a>
												{/each}
											</div>
										</Accordion.Content>
									{:else}
										<a
											href={link.href}
											class="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-lg py-4 leading-none no-underline outline-none transition-colors"
											onclick={() => (isOpen = false)}
											onkeydown={(e) => {
												if (e.key === 'Enter') {
													isOpen = false;
												}
											}}
										>
											<span class="block w-full text-left">{link.title}</span>
										</a>
									{/if}
								</Accordion.Item>
							{/each}
						</Accordion.Root>
					</ul>
				</div>
			{/snippet}
		</Sheet.Content>
	</Sheet.Root>
</div>
