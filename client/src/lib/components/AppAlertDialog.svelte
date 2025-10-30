<script lang="ts">
	import * as AlertDialog from './ui/alert-dialog';
	import Icon from '@iconify/svelte';

	let {
		open = $bindable(),
		title = 'Modal Title',
		message = 'Modal Message',
		type = 'info',
		labelAction,
		labelClose = 'Close',
		onclose,
		onaction
	}: {
		open: boolean;
		title?: string;
		message?: string;
		type: 'success' | 'error' | 'warning' | 'info';
		labelAction?: string;
		labelClose?: string;
		onclose?: () => void;
		onaction?: () => void;
	} = $props();

	function handleClose() {
		open = false;
		onclose?.();
	}

	function handleAction() {
		open = false;
		onaction?.();
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content
		class="mx-auto flex w-[448px] flex-col items-center justify-center gap-10 bg-neutral-100 py-12 dark:bg-neutral-800"
	>
		<AlertDialog.Header>
			<AlertDialog.Title class="flex  w-full flex-col items-center">
				<div class="flex h-16 w-16 items-center justify-center rounded-full p-px">
					{#if type === 'warning'}
						<Icon icon="fluent-color:warning-48" class="h-full w-full" />
					{:else if type === 'info'}
						<Icon icon="flat-color-icons:info" class="h-full w-full" />
					{:else if type === 'error'}
						<Icon icon="fluent-color:dismiss-circle-48" class="h-full w-full" />
					{:else if type === 'success'}
						<Icon icon="fluent-color:checkmark-circle-48" class="h-full w-full" />
					{:else}
						<Icon icon="flat-color-icons:info" class="h-full w-full" />
					{/if}
				</div>
			</AlertDialog.Title>
			<AlertDialog.Description>
				<div class="flex w-full flex-col items-center">
					<div
						class="text-center text-xl font-bold {type === 'warning'
							? 'text-yellow-500'
							: type === 'info'
								? 'text-blue-600'
								: type === 'error'
									? 'text-red-600'
									: type === 'success'
										? 'text-green-600'
										: 'text-blue-600'}"
					>
						{title}
					</div>
					<div
						class="line-clamp-3 max-w-[320px] text-center text-sm text-neutral-600 dark:text-neutral-200"
					>
						{message}
					</div>
				</div>
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="max-w-[448px]">
			<div class="flex max-w-[448px] items-center justify-center gap-2">
				<AlertDialog.Cancel class="w-full" onclick={handleClose}>{labelClose}</AlertDialog.Cancel>
				{#if labelAction}
					<AlertDialog.Action class="w-full" onclick={handleAction}>
						{labelAction}
					</AlertDialog.Action>
				{/if}
			</div>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
s
