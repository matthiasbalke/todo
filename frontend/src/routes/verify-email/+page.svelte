<script lang="ts">
	import { onMount } from 'svelte';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { ApiError, refreshAccessToken } from '$lib/api/auth';
	import {
		getEmailVerificationState,
		requestVerificationEmail,
		submitVerificationToken,
		type EmailVerificationState,
	} from '$lib/api/verification';
	import Button from '$lib/components/Button.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { setSession } from '$lib/stores/auth.svelte';
	import { VERIFIED_LANDING_ROUTE } from '$lib/routes';
	import { signalCurrentUserDetails } from '$lib/passkeys/signals';

	type Mode = 'idle' | 'sending' | 'submitting' | 'success' | 'error';

	let { data }: { data: { state: EmailVerificationState; validationToken: string } } = $props();

	let verificationState = $state<EmailVerificationState>(untrack(() => data.state));
	let validationToken = $state(untrack(() => data.validationToken));
	let mode = $state<Mode>('idle');
	let message = $state('');

	const activeAttempt = $derived(verificationState.registrationVerification ?? verificationState.pendingEmailChange);
	const isExpired = $derived(activeAttempt?.expired === true);
	const targetEmail = $derived(activeAttempt?.email ?? verificationState.activeEmail);

	onMount(async () => {
		if (validationToken.trim()) {
			await submitToken();
		}
	});

	function apiMessage(error: unknown): string {
		if (error instanceof ApiError) {
			if (error.code === 'VALIDATION_TOKEN_EXPIRED') return 'Verification token is no longer valid.';
			if (error.code === 'VALIDATION_TOKEN_INVALID') return 'Verification token is invalid.';
			if (error.code === 'VALIDATION_TOKEN_REQUIRED') return 'Verification token is required.';
			if (error.code === 'EMAIL_DELIVERY_UNAVAILABLE') return 'Email delivery is unavailable.';
			if (error.code === 'EMAIL_DELIVERY_FAILED') return error.message;
			return error.message;
		}
		console.error(error);
		return 'Something went wrong. Try again.';
	}

	async function refreshState() {
		verificationState = await getEmailVerificationState();
	}

	async function sendEmail() {
		mode = 'sending';
		message = '';
		try {
			await requestVerificationEmail();
			await refreshState();
			mode = 'idle';
			message = 'Verification email sent.';
		} catch (error) {
			mode = 'error';
			message = apiMessage(error);
		}
	}

	async function submitToken() {
		if (!validationToken.trim()) return;
		mode = 'submitting';
		message = '';
		try {
			await submitVerificationToken(validationToken.trim());
			const session = await refreshAccessToken();
			setSession(session);
			await signalCurrentUserDetails(session.user);
			mode = 'success';
			message = 'Email address verified.';
		} catch (error) {
			mode = 'error';
			message = apiMessage(error);
		}
	}

	async function continueToApp() {
		await goto(VERIFIED_LANDING_ROUTE);
	}
</script>

<div class="flex-1 flex items-center justify-center p-4">
	<div class="w-full max-w-sm bg-surface rounded-2xl shadow-sm border border-border-subtle p-8">
		<h1 class="text-2xl font-bold text-heading mb-2">Verify email</h1>
		<p class="text-muted text-sm mb-6">{targetEmail}</p>

		{#if message}
			<div class="mb-4 p-3 rounded-lg text-sm {mode === 'error' ? 'bg-danger-surface border border-danger-soft text-danger-strong' : 'bg-success-surface border border-success-border text-success-strong'}">
				{message}
			</div>
		{/if}

		{#if mode === 'success'}
			<Button tone="primary" appearance="solid" size="large" class="w-full" onclick={continueToApp}>
				Continue
			</Button>
		{:else if !activeAttempt?.tokenRequested}
			<div class="space-y-4">
				<Button tone="primary" appearance="solid" size="large" class="w-full" onclick={sendEmail} loading={mode === 'sending'} loadingLabel="Sending…">
					Send verification email
				</Button>
			</div>
		{:else}
			<form
				class="space-y-4"
				onsubmit={(event) => {
					event.preventDefault();
					void submitToken();
				}}
			>
				{#if isExpired}
					<p class="text-sm text-danger-strong">Verification token is no longer valid.</p>
				{/if}

				<TextInput
					id="validation-token"
					bind:value={validationToken}
					label="Verification token"
					required
					class="w-full"
					autocomplete="one-time-code"
				/>

				<Button tone="primary" appearance="solid" type="submit" size="large" class="w-full" loading={mode === 'submitting'} loadingLabel="Verifying…">
					Verify
				</Button>

				<Button tone="neutral" appearance="outline" type="button" size="large" class="w-full" onclick={sendEmail} loading={mode === 'sending'} loadingLabel="Sending…">
					Resend email
				</Button>
			</form>
		{/if}
	</div>
</div>
