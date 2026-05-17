<script lang="ts">
	import { dev } from '$app/environment';
	import TextInput from '$lib/components/TextInput.svelte';

	let email = '';
	let password = '';
	let username = '';
	let searchQuery = '';

	function validateEmail(value: string): string | null {
		if (!value) return 'Email is required';
		if (!value.includes('@')) return 'Email must include @';
		if (!value.includes('.')) return 'Email must include a domain';
		return null;
	}

	function validatePassword(value: string): string | null {
		if (!value) return 'Password is required';
		if (value.length < 8) return 'Password must be at least 8 characters';
		return null;
	}

	function validateUsername(value: string): string | null {
		if (!value) return 'Username is required';
		if (value.length < 3) return 'Username must be at least 3 characters';
		if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, - and _';
		return null;
	}

	const basicInputCode = `<TextInput
  bind:value={myValue}
  label="Name"
  placeholder="Enter your name"
/>`;

	const validatedInputCode = `function validateEmail(value: string) {
  if (!value.includes('@')) return 'Invalid email';
  return null;
}

<TextInput
  bind:value={email}
  type="email"
  validate={validateEmail}
  required
/>`;
</script>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="max-w-4xl mx-auto">
		<div class="mb-12">
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Component Library Showcase</h1>
			<p class="text-gray-600">
				{#if dev}
					<span class="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded text-sm">
						<span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
						Development mode — this route is hidden in production
					</span>
				{/if}
			</p>
		</div>

		<!-- TextInput Section -->
		<section class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-8">TextInput Component</h2>
			<p class="text-gray-600 mb-8">
				A reusable text input with optional custom validation. Displays error messages and applies error styling automatically.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
				<!-- Basic Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Input</h3>
					<TextInput
						bind:value={searchQuery}
						label="Search"
						placeholder="Type something..."
					/>
					<p class="text-xs text-gray-500 mt-2">Value: <code>{searchQuery || '(empty)'}</code></p>
				</div>

				<!-- Email Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Email with Validation</h3>
					<TextInput
						bind:value={email}
						label="Email Address"
						type="email"
						placeholder="you@example.com"
						validate={validateEmail}
						required
					/>
					<p class="text-xs text-gray-500 mt-2">Value: <code>{email || '(empty)'}</code></p>
				</div>

				<!-- Password Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Password with Validation</h3>
					<TextInput
						bind:value={password}
						label="Password"
						type="password"
						placeholder="Enter a secure password"
						validate={validatePassword}
						required
					/>
					<p class="text-xs text-gray-500 mt-2">Value: <code>{password || '(empty)'}</code></p>
				</div>

				<!-- Username Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Username with Custom Rules</h3>
					<TextInput
						bind:value={username}
						label="Username"
						placeholder="alphanumeric, -, _"
						validate={validateUsername}
						required
					/>
					<p class="text-xs text-gray-500 mt-2">Value: <code>{username || '(empty)'}</code></p>
				</div>

				<!-- Disabled Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Disabled State</h3>
					<TextInput
						label="Read-only Field"
						value="Cannot edit this"
						disabled
					/>
				</div>

				<!-- No Label Example -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-4">Minimal (No Label)</h3>
					<TextInput
						placeholder="Just a placeholder"
					/>
				</div>
			</div>

			<!-- Code Examples -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Usage Examples</h3>
				<div class="space-y-4">
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">Basic input:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{basicInputCode}</code></pre>
					</div>
					<div>
						<p class="text-sm font-mono text-gray-600 mb-2">With validation:</p>
						<pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{validatedInputCode}</code></pre>
					</div>
				</div>
			</div>

			<!-- Props Reference -->
			<div class="mt-12 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Props Reference</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Prop</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Type</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Default</th>
								<th class="text-left px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">value</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">The input value</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">label</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">''</td>
								<td class="px-4 py-2 text-gray-600">Label displayed above input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">type</td>
								<td class="px-4 py-2 text-gray-600">string</td>
								<td class="px-4 py-2 text-gray-600">'text'</td>
								<td class="px-4 py-2 text-gray-600">HTML input type (text, email, password, etc.)</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">validate</td>
								<td class="px-4 py-2 text-gray-600">function | null</td>
								<td class="px-4 py-2 text-gray-600">null</td>
								<td class="px-4 py-2 text-gray-600">Optional validator: (value) => error | null</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">disabled</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Disable the input</td>
							</tr>
							<tr>
								<td class="px-4 py-2 font-mono text-blue-600">required</td>
								<td class="px-4 py-2 text-gray-600">boolean</td>
								<td class="px-4 py-2 text-gray-600">false</td>
								<td class="px-4 py-2 text-gray-600">Mark as required (shows * in label)</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</section>

		<!-- Future Components Notice -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
			<h3 class="font-semibold text-blue-900 mb-2">Coming Soon</h3>
			<p class="text-blue-800 text-sm">
				Button, Select, DatePicker, ItemCard, and other components will be added to this showcase as they are implemented.
			</p>
		</div>
	</div>
</div>
