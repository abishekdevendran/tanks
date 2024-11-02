<script>
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Avatar, AvatarFallback, AvatarImage } from "$lib/components/ui/avatar";
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
	import { Input } from "$lib/components/ui/input";
	import { Shield, CircleAlert, Target, Users, Menu } from "lucide-svelte";

	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">
	<header class="bg-white dark:bg-gray-800 shadow-sm">
		<nav class="container mx-auto px-4 py-3 flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<CircleAlert class="h-8 w-8 text-blue-500" />
				<span class="text-xl font-bold">Tank Royale</span>
			</div>
			<div class="hidden md:flex items-center space-x-4">
				<a href="#features" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Features</a>
				<a href="#gameplay" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Gameplay</a>
				<a href="#community" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Community</a>
				<Button>Play Now</Button>
			</div>
			<div class="md:hidden">
				<Button variant="ghost" size="icon" onclick={toggleMenu}>
					<Menu />
				</Button>
			</div>
		</nav>
	</header>

	{#if isMenuOpen}
		<div class="md:hidden bg-white dark:bg-gray-800 shadow-md">
			<div class="container mx-auto px-4 py-2 flex flex-col space-y-2">
				<a href="#features" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-2">Features</a>
				<a href="#gameplay" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-2">Gameplay</a>
				<a href="#community" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-2">Community</a>
				<Button class="w-full">Play Now</Button>
			</div>
		</div>
	{/if}

	<main class="container mx-auto px-4 py-8">
		<section class="text-center mb-16">
			<h1 class="text-4xl md:text-6xl font-bold mb-4">Welcome to Tank Royale</h1>
			<p class="text-xl mb-8">Experience intense 2D tank battles in real-time!</p>
			<Button size="lg">Start Playing Now</Button>
		</section>

		<section id="features" class="mb-16">
			<h2 class="text-3xl font-bold mb-8 text-center">Game Features</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center">
							<CircleAlert class="h-6 w-6 mr-2" />
							Customizable Tanks
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Choose from a variety of tanks and customize them to fit your playstyle.</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center">
							<Target class="h-6 w-6 mr-2" />
							Real-time Combat
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Engage in fast-paced, real-time battles with players from around the world.</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center">
							<Shield class="h-6 w-6 mr-2" />
							Strategic Gameplay
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Use terrain, power-ups, and tactics to outmaneuver your opponents.</p>
					</CardContent>
				</Card>
			</div>
		</section>

		<section id="gameplay" class="mb-16">
			<h2 class="text-3xl font-bold mb-8 text-center">Gameplay Preview</h2>
			<div class="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4">
				<!-- Replace with actual gameplay video or screenshot -->
				<div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Gameplay Video Placeholder</div>
			</div>
			<p class="text-center">Experience the thrill of tank warfare in our dynamic 2D battlegrounds!</p>
		</section>

		<section id="community" class="mb-16">
			<h2 class="text-3xl font-bold mb-8 text-center">Join Our Community</h2>
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center">
						<Users class="h-6 w-6 mr-2" />
						Tank Royale Community
					</CardTitle>
					<CardDescription>Connect with other players, share strategies, and stay updated on the latest news.</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
						<Button variant="outline">Join Discord</Button>
						<Button variant="outline">Follow on Twitter</Button>
						<Button variant="outline">Subscribe to Newsletter</Button>
					</div>
				</CardContent>
			</Card>
		</section>
	</main>

	<footer class="bg-white dark:bg-gray-800 shadow-md mt-16">
		<div class="container mx-auto px-4 py-6">
			<div class="flex flex-col md:flex-row items-center justify-between">
				<div class="flex items-center space-x-2 mb-4 md:mb-0">
					<CircleAlert class="h-6 w-6 text-blue-500" />
					<span class="font-bold">Tank Royale</span>
				</div>
				<div class="flex space-x-4">
					<a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Privacy Policy</a>
					<a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Terms of Service</a>
					<a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Contact Us</a>
				</div>
			</div>
		</div>
	</footer>
</div>