/**
 * EstimateScreen
 * AI-powered estimate builder using Claude API.
 *
 * TO REMOVE THIS FEATURE:
 *   1. Delete this file
 *   2. Remove <script src="screens/EstimateScreen.js"> from index.html
 *   3. Remove the 'estimate' case from app.js router
 *   4. Remove the "Build Estimate" button block from ProjectDetailScreen.js
 *   5. Remove the ESTIMATES block from store.js
 *   That's it — no other files affected.
 */

const EstimateScreen = {

  // ─── State ───────────────────────────────────────────────
  _projectId: null,
  _items: [],       // { id, description, qty, unit, unitPrice, category }
  _taxRate: 0,
  _generating: false,

  // ─── Render ──────────────────────────────────────────────
  render(projectId) {
    this._projectId = projectId;
    const project = Store.getProject(projectId);
    const settings = Store.getSettings();
    const currency = settings.currencySymbol || '$';

    // Load saved estimate if exists
    const saved = Store.getEstimate(projectId);
    if (saved) {
      this._items = saved.items || [];
      this._taxRate = saved.taxRate || 0;
    } else {
      this._items = [];
      this._taxRate = 0;
    }

    const laborRate = settings.laborRate || '';

    return `
      <div class="max-w-lg mx-auto pb-24" id="estimateRoot">
        <!-- Back -->
        <button id="backBtn" class="back-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <h2 class="screen-header" style="margin-bottom:4px;">Estimate</h2>
        <p class="text-sm text-gray-500 mb-5">${project ? (project.name || '') + (project.note ? ' — ' + project.note : '') : ''}</p>

        <!-- AI Generation Card -->
        <div class="project-detail-card est-ai-card">
          <div class="flex items-center gap-2 mb-3">
            <span class="est-ai-badge">✦ AI</span>
            <h3 class="section-label" style="margin:0;">Describe the job</h3>
          </div>
          <textarea
            id="estJobDesc"
            class="form-input"
            rows="3"
            placeholder="e.g. Replace 40 feet of 6-foot cedar privacy fence, demo existing fence, new posts and panels, customer in Phoenix AZ..."
            style="font-size:0.9375rem;"
          >${project && project.notes ? project.notes : ''}</textarea>

          ${laborRate ? '' : `
            <div class="est-labor-hint">
              💡 Add your hourly labor rate in
              <button onclick="App.navigateTo('settings')" class="est-link">Settings</button>
              for more accurate estimates.
            </div>
          `}

          <button
            id="estGenerateBtn"
            onclick="EstimateScreen.generate()"
            class="action-btn action-btn-primary mt-3"
            style="font-size:0.9375rem;">
            ✦ Generate Estimate with AI
          </button>
        </div>

        <!-- Line Items -->
        <div id="estItemsSection" class="${this._items.length === 0 ? 'hidden' : ''}">

          <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="section-label" style="margin:0;">Line Items</h3>
            <button onclick="EstimateScreen.addItem()" class="est-add-btn">+ Add Line</button>
          </div>

          <div id="estItemsList">
            ${this._items.map((item, i) => this.renderItem(item, i, currency)).join('')}
          </div>

          <!-- Totals -->
          <div class="project-detail-card mt-2" id="estTotals">
            ${this.renderTotals(currency)}
          </div>

          <!-- Actions -->
          <div class="flex gap-3 mt-4">
            <button onclick="EstimateScreen.saveEstimate()" class="action-btn action-btn-primary flex-1">
              Save Estimate
            </button>
            <button onclick="EstimateScreen.shareEstimate()" class="action-btn action-btn-outline flex-1">
              Share
            </button>
          </div>

          <button onclick="EstimateScreen.clearEstimate()"
            class="action-btn mt-3 w-full" style="color:#ef4444;background:#fff5f5;border:1.5px solid #fecaca;">
            Clear Estimate
          </button>
        </div>

        <!-- Empty nudge (when no items yet) -->
        <div id="estEmptyNudge" class="${this._items.length > 0 ? 'hidden' : 'est-empty-nudge'}">
          <p>Describe the job above and tap <strong>Generate</strong>, or tap <strong>+ Add Line</strong> to build manually.</p>
          <button onclick="EstimateScreen.addItem()" class="action-btn mt-4" style="background:#f5f7fa;color:#374151;border:1.5px solid #e4e8ef;">
            + Add Line Item Manually
          </button>
        </div>

      </div>
    `;
  },

  renderItem(item, index, currency) {
    currency = currency || Store.getCurrencySymbol();
    const total = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
    return `
      <div class="est-item-card" id="est-item-${item.id}">
        <div class="est-item-header">
          <span class="est-category-dot est-cat-${(item.category || 'other').toLowerCase()}"></span>
          <input
            class="est-item-desc"
            type="text"
            value="${this.esc(item.description)}"
            placeholder="Description"
            onchange="EstimateScreen.updateItem('${item.id}', 'description', this.value)"
          >
          <button onclick="EstimateScreen.removeItem('${item.id}')" class="est-remove-btn">✕</button>
        </div>
        <div class="est-item-row">
          <div class="est-item-field">
            <label class="est-field-label">Qty</label>
            <input type="number" class="est-num-input" value="${item.qty}" min="0" step="0.1"
              onchange="EstimateScreen.updateItem('${item.id}', 'qty', this.value)">
          </div>
          <div class="est-item-field">
            <label class="est-field-label">Unit</label>
            <input type="text" class="est-unit-input" value="${this.esc(item.unit)}" placeholder="hr / ea / ft"
              onchange="EstimateScreen.updateItem('${item.id}', 'unit', this.value)">
          </div>
          <div class="est-item-field">
            <label class="est-field-label">Unit Price</label>
            <div class="est-price-wrap">
              <span class="est-currency">${currency}</span>
              <input type="number" class="est-num-input est-price-input" value="${item.unitPrice}" min="0" step="0.01"
                onchange="EstimateScreen.updateItem('${item.id}', 'unitPrice', this.value)">
            </div>
          </div>
          <div class="est-item-field est-total-field">
            <label class="est-field-label">Total</label>
            <span class="est-item-total">${currency}${total.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderTotals(currency) {
    currency = currency || Store.getCurrencySymbol();
    const subtotal = this._items.reduce((s, item) =>
      s + (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0), 0);
    const taxAmt = subtotal * ((parseFloat(this._taxRate) || 0) / 100);
    const total = subtotal + taxAmt;

    return `
      <div class="est-totals">
        <div class="est-total-row">
          <span>Subtotal</span>
          <span>${currency}${subtotal.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
        </div>
        <div class="est-total-row">
          <div class="flex items-center gap-2">
            <span>Tax</span>
            <div class="est-tax-wrap">
              <input type="number" id="estTaxRate" class="est-tax-input" value="${this._taxRate}"
                min="0" max="100" step="0.1"
                onchange="EstimateScreen.updateTax(this.value)">
              <span class="est-tax-pct">%</span>
            </div>
          </div>
          <span>${currency}${taxAmt.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
        </div>
        <div class="est-total-row est-grand-total">
          <span>Total</span>
          <span>${currency}${total.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
        </div>
      </div>
    `;
  },

  // ─── AI Generation ───────────────────────────────────────
  async generate() {
    const desc = document.getElementById('estJobDesc').value.trim();
    if (!desc) {
      alert('Please describe the job first.');
      return;
    }
    if (this._generating) return;
    this._generating = true;

    const btn = document.getElementById('estGenerateBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="est-spinner">●</span> Generating…';

    const settings = Store.getSettings();
    const laborRate = settings.laborRate ? `The contractor's labor rate is ${Store.getCurrencySymbol()}${settings.laborRate}/hr.` : '';

    const systemPrompt = `You are an expert construction estimator helping a contractor build a job estimate.
Given a job description, return ONLY a valid JSON object — no markdown, no explanation, no backticks.

The JSON must have this exact shape:
{
  "items": [
    {
      "id": "unique_short_string",
      "description": "Item description",
      "category": "labor|materials|equipment|other",
      "qty": 1,
      "unit": "hr",
      "unitPrice": 75
    }
  ],
  "notes": "Optional brief note about assumptions made"
}

Rules:
- Be specific and realistic with quantities and pricing
- Use current US market rates unless a location suggests otherwise
- Separate labor and materials into distinct line items
- Include disposal, permits, or mobilization fees if relevant
- unitPrice should be a number (no currency symbols)
- qty should be a number
- category must be one of: labor, materials, equipment, other
${laborRate}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: 'user', content: `Generate a detailed estimate for this job:\n\n${desc}` }]
        })
      });

      const data = await response.json();
      const raw = data.content?.[0]?.text || '';

      // Strip any accidental markdown fences
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      if (!parsed.items || !Array.isArray(parsed.items)) throw new Error('Invalid response format');

      // Normalise IDs to be unique
      this._items = parsed.items.map((item, i) => ({
        ...item,
        id: item.id || `ai_${i}_${Date.now()}`,
        qty: parseFloat(item.qty) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
      }));

      if (parsed.notes) {
        // Append AI notes to project notes as a log entry
        const project = Store.getProject(this._projectId);
        if (project) {
          const existing = project.notes || '';
          const stamp = new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
          Store.updateProject(this._projectId, {
            notes: existing + (existing ? '\n\n' : '') + `[${stamp} – AI Estimate Note]\n${parsed.notes}`
          });
        }
      }

      this._refreshItems();
      this._save();

    } catch (err) {
      console.error('Estimate generation error:', err);
      alert('Generation failed. Check your connection and try again.\n\n' + err.message);
    }

    this._generating = false;
    btn.disabled = false;
    btn.innerHTML = '✦ Regenerate Estimate';
  },

  // ─── Item Management ─────────────────────────────────────
  addItem() {
    const id = 'manual_' + Date.now();
    this._items.push({ id, description: '', category: 'other', qty: 1, unit: 'ea', unitPrice: 0 });
    this._refreshItems();
    this._save();
    // Focus the new item's description field
    setTimeout(() => {
      const card = document.getElementById(`est-item-${id}`);
      if (card) card.querySelector('.est-item-desc')?.focus();
    }, 50);
  },

  removeItem(id) {
    this._items = this._items.filter(item => item.id !== id);
    this._refreshItems();
    this._save();
  },

  updateItem(id, field, value) {
    const item = this._items.find(i => i.id === id);
    if (!item) return;
    item[field] = (field === 'qty' || field === 'unitPrice') ? parseFloat(value) || 0 : value;
    this._refreshTotals();
    this._save();
  },

  updateTax(value) {
    this._taxRate = parseFloat(value) || 0;
    this._refreshTotals();
    this._save();
  },

  // ─── Persistence ─────────────────────────────────────────
  _save() {
    const estimate = { items: this._items, taxRate: this._taxRate, updatedAt: Date.now() };
    Store.saveEstimate(this._projectId, estimate);

    // Keep job value in sync with estimate total
    const subtotal = this._items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const total = subtotal * (1 + (this._taxRate / 100));
    if (total > 0) Store.updateProject(this._projectId, { value: Math.round(total) });
  },

  saveEstimate() {
    this._save();
    const btn = event?.target;
    if (btn) { btn.textContent = '✓ Saved!'; setTimeout(() => btn.textContent = 'Save Estimate', 1500); }
  },

  clearEstimate() {
    if (!confirm('Clear all line items?')) return;
    this._items = [];
    this._taxRate = 0;
    this._refreshItems();
  },

  // ─── Share ───────────────────────────────────────────────
  shareEstimate() {
    const project = Store.getProject(this._projectId);
    const currency = Store.getCurrencySymbol();
    const subtotal = this._items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const taxAmt = subtotal * (this._taxRate / 100);
    const total = subtotal + taxAmt;

    const lines = [
      `📋 ESTIMATE`,
      project ? `${project.name || ''}${project.note ? ' — ' + project.note : ''}` : '',
      `─────────────────`,
      ...this._items.map(item =>
        `${item.description}\n  ${item.qty} ${item.unit} × ${currency}${item.unitPrice} = ${currency}${(item.qty * item.unitPrice).toFixed(2)}`
      ),
      `─────────────────`,
      this._taxRate > 0 ? `Subtotal: ${currency}${subtotal.toFixed(2)}\nTax (${this._taxRate}%): ${currency}${taxAmt.toFixed(2)}` : '',
      `TOTAL: ${currency}${total.toFixed(2)}`,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      navigator.share({ title: 'Job Estimate', text: lines }).catch(() => {});
    } else {
      navigator.clipboard.writeText(lines).then(() => alert('Estimate copied to clipboard!'));
    }
  },

  // ─── DOM Updates ─────────────────────────────────────────
  _refreshItems() {
    const currency = Store.getCurrencySymbol();
    const list = document.getElementById('estItemsList');
    const section = document.getElementById('estItemsSection');
    const nudge = document.getElementById('estEmptyNudge');

    if (!list) { App.navigateTo('estimate', this._projectId); return; }

    list.innerHTML = this._items.map((item, i) => this.renderItem(item, i, currency)).join('');
    this._refreshTotals();

    if (this._items.length > 0) {
      section?.classList.remove('hidden');
      nudge?.classList.add('hidden');
    } else {
      section?.classList.add('hidden');
      nudge?.classList.remove('hidden');
    }
  },

  _refreshTotals() {
    const currency = Store.getCurrencySymbol();
    const totalsEl = document.getElementById('estTotals');
    if (totalsEl) totalsEl.innerHTML = this.renderTotals(currency);

    // Also refresh individual item totals
    this._items.forEach(item => {
      const card = document.getElementById(`est-item-${item.id}`);
      if (!card) return;
      const total = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
      const totalEl = card.querySelector('.est-item-total');
      if (totalEl) totalEl.textContent = `${currency}${total.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    });
  },

  // ─── Helpers ─────────────────────────────────────────────
  esc(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

window.EstimateScreen = EstimateScreen;
