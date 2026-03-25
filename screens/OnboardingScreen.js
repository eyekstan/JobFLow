/**
 * OnboardingScreen
 * First-run welcome flow — shown once, then never again.
 */

const OnboardingScreen = {
  currentSlide: 0,

  slides: [
    {
      icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:72px;height:72px;">
        <rect width="64" height="64" rx="18" fill="#007AFF"/>
        <text x="32" y="44" font-size="32" text-anchor="middle" fill="white" font-family="system-ui" font-weight="800">J</text>
      </svg>`,
      title: "Welcome to JobFlow",
      body: "The fastest way to manage job leads and track projects — built for contractors who work on the go.",
      cta: "Get Started"
    },
    {
      icon: `<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:72px;height:72px;">
        <circle cx="36" cy="36" r="36" fill="#fef3c7"/>
        <path d="M20 36h32M20 26h32M20 46h20" stroke="#d97706" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`,
      title: "Your Pipeline",
      body: "Every job moves through stages — Lead, Quote, Schedule, Invoice, and more. Tap the arrows on any card to advance a job forward.",
      cta: "Next"
    },
    {
      icon: `<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:72px;height:72px;">
        <circle cx="36" cy="36" r="36" fill="#dcfce7"/>
        <path d="M22 37l9 9 19-19" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      title: "Today's Actions",
      body: "Set a due date on any job and it appears in Today's Actions. Overdue jobs bubble to the top so nothing slips through the cracks.",
      cta: "Next"
    },
    {
      icon: `<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:72px;height:72px;">
        <circle cx="36" cy="36" r="36" fill="#fee2e2"/>
        <path d="M36 20v4m0 24v4m-16-16h4m24 0h4" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
        <circle cx="36" cy="36" r="10" stroke="#dc2626" stroke-width="3"/>
      </svg>`,
      title: "Your Data Stays Here",
      body: "JobFlow stores everything on your device — no account needed. Go to Settings → Export Backup regularly so you never lose your jobs.",
      cta: "Start Using JobFlow →"
    }
  ],

  render() {
    return `
      <div class="onboarding-screen" id="onboardingScreen">
        <div class="onboarding-card" id="onboardingCard">

          <!-- Slide content -->
          <div class="onboarding-slides" id="onboardingSlides">
            ${this.slides.map((slide, i) => `
              <div class="onboarding-slide ${i === 0 ? 'active' : ''}" id="slide-${i}">
                <div class="onboarding-icon">${slide.icon}</div>
                <h2 class="onboarding-title">${slide.title}</h2>
                <p class="onboarding-body">${slide.body}</p>
              </div>
            `).join('')}
          </div>

          <!-- Dots -->
          <div class="onboarding-dots" id="onboardingDots">
            ${this.slides.map((_, i) => `
              <div class="onboarding-dot ${i === 0 ? 'active' : ''}" id="dot-${i}"></div>
            `).join('')}
          </div>

          <!-- CTA Button -->
          <button class="onboarding-cta" id="onboardingCta" onclick="OnboardingScreen.next()">
            ${this.slides[0].cta}
          </button>

          <!-- Skip -->
          <button class="onboarding-skip" onclick="OnboardingScreen.finish()">Skip</button>
        </div>
      </div>
    `;
  },

  next() {
    const total = this.slides.length;
    if (this.currentSlide >= total - 1) {
      this.finish();
      return;
    }

    // Hide current slide
    document.getElementById(`slide-${this.currentSlide}`).classList.remove('active');
    document.getElementById(`dot-${this.currentSlide}`).classList.remove('active');

    this.currentSlide++;

    // Show next slide
    document.getElementById(`slide-${this.currentSlide}`).classList.add('active');
    document.getElementById(`dot-${this.currentSlide}`).classList.add('active');

    // Update button label
    document.getElementById('onboardingCta').textContent = this.slides[this.currentSlide].cta;

    // Hide skip on last slide
    const skipBtn = document.querySelector('.onboarding-skip');
    if (skipBtn) skipBtn.style.opacity = this.currentSlide === total - 1 ? '0' : '1';
  },

  finish() {
    Store.markOnboardingSeen();
    const screen = document.getElementById('onboardingScreen');
    if (screen) {
      screen.style.opacity = '0';
      screen.style.transform = 'scale(0.97)';
      setTimeout(() => App.navigateTo('dashboard'), 280);
    } else {
      App.navigateTo('dashboard');
    }
  }
};

window.OnboardingScreen = OnboardingScreen;
