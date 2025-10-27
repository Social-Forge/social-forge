<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />
<main
	class="bg-background text-foreground scrollbar-primary min-h-screen overflow-x-hidden antialiased"
>
	{@render children?.()}
</main>
