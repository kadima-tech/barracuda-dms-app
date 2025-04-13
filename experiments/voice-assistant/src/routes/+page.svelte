<script lang="ts">
	import VoiceAssistant from '$lib/components/VoiceAssistant.svelte';
</script>

<div class="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white p-4 py-6">
	<div class="container mx-auto max-w-6xl px-4">
		<header class="mb-8 text-center">
			<h1
				class="mb-3 bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-3xl font-semibold text-transparent"
			>
				Voice Assistant
			</h1>
			<p class="mx-auto max-w-md text-sm text-gray-500">
				A modern speech recognition interface with speaker detection
			</p>
		</header>

		<VoiceAssistant />

		<footer class="mx-auto mt-10 max-w-xl text-center">
			<div class="rounded-xl bg-white p-4 shadow-sm">
				<div class="mb-4 flex items-center justify-center space-x-6">
					<div class="flex flex-col items-center">
						<div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
							<svg class="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none">
								<path
									d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<p class="text-xs font-medium text-gray-700">Built with</p>
						<p class="text-xs text-gray-500">Svelte 5 & TailwindCSS</p>
					</div>

					<div class="flex flex-col items-center">
						<div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
							<svg class="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none">
								<path
									d="M9 3H15M9 3C7.89543 3 7 3.89543 7 5V19C7 20.1046 7.89543 21 9 21H15C16.1046 21 17 20.1046 17 19V5C17 3.89543 16.1046 3 15 3M9 3H8M15 3H16M12 18H12.01"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								/>
							</svg>
						</div>
						<p class="text-xs font-medium text-gray-700">Compatibility</p>
						<p class="text-xs text-gray-500">Chrome, Edge, Safari</p>
					</div>
				</div>
				<p class="text-xs text-gray-400">
					Voice Assistant with Speaker Detection • Powered by Svelte 5
				</p>
			</div>
		</footer>
	</div>
</div>
