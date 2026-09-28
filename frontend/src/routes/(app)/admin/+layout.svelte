<script lang="ts">
  import { appVersion } from '$lib/version';

  let { data, children } = $props();

  const sections = [
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/users', label: 'Users' },
  ];

  function isActive(href: string) {
    return data.activeAdminPath === href;
  }

  function linkClass(href: string) {
    return [
      'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive(href)
        ? 'bg-primary-surface text-primary-strong'
        : 'text-label hover:bg-canvas hover:text-heading',
    ].join(' ');
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-heading">Admin</h1>
    <p class="text-sm text-muted mt-1">Manage this Todo instance.</p>
  </div>

  <nav class="md:hidden" aria-label="Admin sections">
    <div class="grid grid-cols-2 gap-2">
      {#each sections as section}
        <a
          href={section.href}
          class="{linkClass(section.href)} text-center"
          aria-current={isActive(section.href) ? 'page' : undefined}
        >
          {section.label}
        </a>
      {/each}
    </div>
  </nav>

  <div class="md:grid md:grid-cols-[10rem_minmax(0,1fr)] md:gap-6">
    <aside class="hidden md:block">
      <nav class="sticky top-20 space-y-1" aria-label="Admin sections">
        {#each sections as section}
          <a
            href={section.href}
            class={linkClass(section.href)}
            aria-current={isActive(section.href) ? 'page' : undefined}
          >
            {section.label}
          </a>
        {/each}
      </nav>
    </aside>

    <div class="min-w-0">
      {@render children()}
    </div>
  </div>

  <footer class="py-2 text-center text-xs text-subdued">
    v{appVersion}{data.buildNumber !== '0' ? `.${data.buildNumber}` : ''}
  </footer>
</div>
