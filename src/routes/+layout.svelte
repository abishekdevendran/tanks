<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { page } from '$app/stores';

	let { children } = $props();
	const appName = 'TANKS!';

	let title = $state(
		[appName, ...$page.url.pathname.split('/').slice(1)].filter(Boolean).join(' - ')
	);
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>
<Toaster />
{@render children()}
