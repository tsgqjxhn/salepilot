<template>
  <div class="guest-shell">
    <header class="guest-header">
      <div class="guest-header__inner">
        <router-link to="/home" class="brand">
          <img :src="logoUrl" alt="SalePilot logo" class="brand__logo" />
          <div>
            <strong>SalePilot</strong>
            <span>{{ bilingual("", "AI Sales Workspace") }}</span>
          </div>
        </router-link>

        <nav class="guest-nav">
          <router-link
            to="/"
            class="guest-nav__item"
            :class="{
              'guest-nav__item--active':
                route.path === '/' || route.path === '/home',
            }"
          >
            {{ text("首页", "Home") }}
          </router-link>
          <router-link
            to="/developers"
            class="guest-nav__item"
            :class="{ 'guest-nav__item--active': route.path === '/developers' }"
          >
            {{ bilingual("", "Developers") }}
          </router-link>
          <router-link
            to="/pricing"
            class="guest-nav__item"
            :class="{ 'guest-nav__item--active': route.path === '/pricing' }"
          >
            {{ bilingual("", "Pricing") }}
          </router-link>
        </nav>

        <div class="auth-switch">
          <router-link
            to="/auth/login"
            class="auth-switch__item"
            :class="{ 'auth-switch__item--active': route.path === '/auth/login' }"
          >
            {{ text("登录", "Log in") }}
          </router-link>
          <router-link
            to="/auth/register"
            class="auth-switch__item auth-switch__item--cta"
            :class="{ 'auth-switch__item--active': route.path === '/auth/register' }"
          >
            {{ text("注册", "Sign up") }}
          </router-link>
        </div>
      </div>
    </header>

    <main class="guest-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { useLocalizedText } from "@/composables/useLocalizedText";
import logoUrl from "../../assets/headericon.svg";

defineOptions({
  name: "GuestLayout",
});

const route = useRoute();
const { text, bilingual } = useLocalizedText();
</script>

<style scoped>
.guest-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    var(--gradient-mesh),
    radial-gradient(
      circle at top left,
      rgba(96, 171, 255, 0.12),
      transparent 26%
    ),
    linear-gradient(
      180deg,
      var(--surface-primary) 0%,
      var(--surface-secondary) 100%
    );
}

/* ── Premium frosted glass header ──────────────────────────────────────── */
.guest-header {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-light);
  backdrop-filter: blur(var(--blur-xl));
  -webkit-backdrop-filter: blur(var(--blur-xl));
  background: var(--surface-glass-strong);
  box-shadow:
    var(--shadow-sm),
    0 1px 0 rgba(255, 255, 255, 0.6) inset;
  transition:
    box-shadow var(--transition-base),
    border-color var(--transition-base);
}

.guest-header__inner {
  width: min(1220px, calc(100vw - 40px));
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

/* ── Brand ─────────────────────────────────────────────────────────────── */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand__logo {
  width: 34px;
  height: 34px;
}

.brand strong,
.brand span {
  display: block;
}

.brand strong {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.brand span {
  color: var(--text-tertiary);
  font-size: 11px;
  letter-spacing: 0.02em;
}

/* ── Nav pills ─────────────────────────────────────────────────────────── */
.guest-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guest-nav__item {
  text-decoration: none;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  background: transparent;
  transition:
    transform var(--transition-base),
    color var(--transition-base),
    background-color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.guest-nav__item:hover {
  color: var(--text-primary);
  background: var(--surface-glass);
  border-color: var(--border-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-xs);
}

.guest-nav__item--active {
  color: var(--text-primary);
  border-color: var(--border-default);
  background: var(--surface-white);
  box-shadow: var(--shadow-sm);
}

/* ── Auth switch ───────────────────────────────────────────────────────── */
.auth-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: var(--surface-glass-weak);
  backdrop-filter: blur(var(--blur-sm));
  -webkit-backdrop-filter: blur(var(--blur-sm));
}

.auth-switch__item {
  min-width: 92px;
  padding: 10px 18px;
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  text-decoration: none;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition:
    background-color var(--transition-base),
    color var(--transition-base),
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.auth-switch__item:hover {
  color: var(--text-primary);
  background: var(--surface-glass);
  transform: translateY(-1px);
}

.auth-switch__item--active {
  color: var(--text-primary);
  background: var(--surface-white);
  box-shadow: var(--shadow-soft);
}

.auth-switch__item--cta,
.auth-switch__item--cta.auth-switch__item--active {
  min-width: 120px;
  background: linear-gradient(135deg, #1d5fa0, #2371c4);
  color: #fff;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 14px rgba(35, 113, 196, 0.22);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    filter var(--transition-base);
}

.auth-switch__item--cta:hover {
  color: #fff;
  background: linear-gradient(135deg, #2471b8, #2984d8);
  filter: brightness(1.08);
  transform: translateY(-2px);
  box-shadow:
    0 12px 32px rgba(35, 113, 196, 0.32),
    0 4px 12px rgba(35, 113, 196, 0.18);
}

.auth-switch__item--cta:active {
  transform: translateY(0);
  background: linear-gradient(135deg, #1d5fa0, #2371c4);
}

/* ── Main content area with mesh gradient ──────────────────────────────── */
.guest-main {
  width: min(1220px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 32px 0 56px;
  flex: 1;
  position: relative;
}

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .guest-header {
    padding: 10px 16px;
  }

  .guest-header__inner {
    width: min(100%, calc(100vw - 28px));
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .guest-nav {
    justify-content: center;
    flex-wrap: wrap;
  }

  .auth-switch {
    align-self: center;
  }

  .guest-main {
    width: min(100%, calc(100vw - 28px));
    padding-top: 26px;
  }
}

@media (max-width: 640px) {
  .auth-switch {
    width: 100%;
  }

  .auth-switch__item {
    flex: 1;
    min-width: 0;
  }
}
</style>
