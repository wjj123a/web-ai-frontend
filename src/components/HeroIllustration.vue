<script setup>
const props = defineProps({
  leftBadge: {
    type: Object,
    required: true,
  },
  rightBadge: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="hero-visual" aria-hidden="true">
    <div class="hero-orb hero-orb-left"></div>
    <div class="hero-orb hero-orb-right"></div>

    <div class="scene-badge scene-badge-left">
      <span>{{ props.leftBadge.label }}</span>
      <strong>{{ props.leftBadge.value }}</strong>
    </div>

    <div class="scene-badge scene-badge-right">
      <span>{{ props.rightBadge.label }}</span>
      <strong>{{ props.rightBadge.value }}</strong>
    </div>

    <svg class="scene-illustration" viewBox="0 0 1200 560" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shellGradient" x1="136" y1="106" x2="972" y2="506">
          <stop offset="0%" stop-color="#FFF8FB" />
          <stop offset="50%" stop-color="#F4EEFF" />
          <stop offset="100%" stop-color="#E6ECFF" />
        </linearGradient>
        <linearGradient id="baseGradient" x1="262" y1="426" x2="960" y2="548">
          <stop offset="0%" stop-color="#222A57" />
          <stop offset="100%" stop-color="#0F1536" />
        </linearGradient>
        <linearGradient id="panelGradient" x1="343" y1="162" x2="806" y2="416">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.96" />
          <stop offset="100%" stop-color="#F4F0FF" stop-opacity="0.84" />
        </linearGradient>
        <linearGradient id="beamGradient" x1="360" y1="246" x2="842" y2="246">
          <stop offset="0%" stop-color="#8466FF" />
          <stop offset="55%" stop-color="#FF7C9D" />
          <stop offset="100%" stop-color="#FFB46C" />
        </linearGradient>
        <linearGradient id="cardGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#141B45" />
          <stop offset="100%" stop-color="#232D67" />
        </linearGradient>
        <linearGradient id="chipGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FF8A73" />
          <stop offset="100%" stop-color="#FF5C9A" />
        </linearGradient>
        <linearGradient id="wireGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7E7BFF" />
          <stop offset="100%" stop-color="#63D3FF" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="22" stdDeviation="18" flood-color="#1C214A" flood-opacity="0.22" />
        </filter>
        <filter id="orbBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>

      <ellipse cx="600" cy="486" rx="358" ry="38" fill="#27305C" fill-opacity="0.14" />

      <g class="float-slow">
        <circle cx="262" cy="220" r="86" fill="#8B7CFF" fill-opacity="0.18" filter="url(#orbBlur)" />
      </g>
      <g class="float-fast">
        <circle cx="928" cy="182" r="74" fill="#FF8E96" fill-opacity="0.16" filter="url(#orbBlur)" />
      </g>

      <path d="M212 468C296 434 426 426 554 448C666 466 810 472 984 454V560H212V468Z" fill="url(#baseGradient)" />

      <g class="float-slow" filter="url(#softShadow)">
        <path d="M402 158L724 128L850 326L524 366L402 158Z" fill="url(#shellGradient)" fill-opacity="0.76" />
        <path d="M432 173L698 148L802 314L540 339L432 173Z" fill="url(#panelGradient)" />
        <path d="M466 206L660 188" stroke="#CAD3F4" stroke-width="10" stroke-linecap="round" />
        <path d="M466 234L620 220" stroke="#D7DDF9" stroke-width="10" stroke-linecap="round" />
        <path d="M466 262L590 251" stroke="#E5E9FD" stroke-width="10" stroke-linecap="round" />
        <rect x="637" y="214" width="118" height="68" rx="20" transform="rotate(-5 637 214)" fill="url(#cardGradient)" />
        <path d="M670 244L724 239" stroke="#98A7FF" stroke-width="8" stroke-linecap="round" />
        <path d="M670 262L710 258" stroke="#6EE0FF" stroke-width="8" stroke-linecap="round" />
      </g>

      <g class="float-fast" filter="url(#softShadow)">
        <rect x="270" y="292" width="172" height="118" rx="28" fill="#FFFFFF" fill-opacity="0.84" />
        <rect x="292" y="316" width="126" height="14" rx="7" fill="#D7DDFB" />
        <rect x="292" y="342" width="88" height="14" rx="7" fill="#E7EBFF" />
        <rect x="292" y="372" width="56" height="16" rx="8" fill="url(#chipGradient)" />
        <circle cx="396" cy="366" r="18" fill="#7E7BFF" fill-opacity="0.22" />
      </g>

      <g class="float-slow" filter="url(#softShadow)">
        <rect x="798" y="272" width="164" height="122" rx="30" fill="#FFFFFF" fill-opacity="0.84" />
        <circle cx="842" cy="332" r="20" fill="#7E7BFF" fill-opacity="0.16" />
        <circle cx="884" cy="314" r="13" fill="#FF84A5" fill-opacity="0.3" />
        <circle cx="914" cy="346" r="10" fill="#6ED9FF" fill-opacity="0.42" />
        <path d="M842 332L884 314L914 346" stroke="url(#wireGradient)" stroke-width="6" stroke-linecap="round" />
        <path d="M830 372H922" stroke="#D6DEF8" stroke-width="10" stroke-linecap="round" />
      </g>

      <g class="float-fast" filter="url(#softShadow)">
        <rect x="540" y="300" width="148" height="148" rx="36" fill="url(#cardGradient)" />
        <rect x="572" y="332" width="84" height="84" rx="22" fill="url(#chipGradient)" />
        <path d="M542 374H484" stroke="url(#beamGradient)" stroke-width="8" stroke-linecap="round" />
        <path d="M690 374H748" stroke="url(#beamGradient)" stroke-width="8" stroke-linecap="round" />
        <path d="M614 298V250" stroke="url(#beamGradient)" stroke-width="8" stroke-linecap="round" />
        <path d="M614 450V500" stroke="url(#beamGradient)" stroke-width="8" stroke-linecap="round" />
        <circle cx="614" cy="374" r="11" fill="#FFFFFF" fill-opacity="0.82" />
        <text x="614" y="381" text-anchor="middle" font-size="28" font-weight="700" fill="#FFFFFF">AI</text>
      </g>

      <g class="float-slow" filter="url(#softShadow)">
        <path d="M366 438C454 396 538 386 630 400C714 413 812 442 904 430" stroke="url(#beamGradient)" stroke-width="14" stroke-linecap="round" />
        <circle cx="366" cy="438" r="12" fill="#FF8B84" />
        <circle cx="630" cy="400" r="14" fill="#856EFF" />
        <circle cx="904" cy="430" r="12" fill="#62D2FF" />
      </g>
    </svg>
  </section>
</template>
