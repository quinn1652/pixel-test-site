# Pixel Test Site

A static site for observing Facebook pixel behavior under controlled conditions. Each version replicates the HTML structure, question content, field names, and pixel implementation of a specific archived page at a specific point in time — using exact question IDs, answer values, and quiz names sourced from Wayback Machine snapshots.

---

## Setup

### 1. Configure `pixel-config.js`

```js
window.PIXEL_CONFIG = {
  pixelId: "YOUR_PIXEL_ID",   // your own Facebook test pixel ID
  gtmId:   "GTM-XXXXXXX",    // your GTM container ID (see GTM Setup below)
  dryRun:  true,              // true = log to console only; false = send live beacons
};
```

Set `dryRun: true` while getting oriented. Switch to `false` only when intentionally sending live beacons to your pixel.

### 2. Serve over HTTP/S

`fbevents.js` will not load over `file://`. Use GitHub Pages, Netlify, or a local server:

```bash
python3 -m http.server 8080
```

### 3. GTM Setup (required for quiz-page conditional events)

Two quiz-page events go through Google Tag Manager rather than direct `fbq()` calls. Create a GTM Web container and configure:

**Triggers** (Custom Event type):

| Trigger name | Event name |
|---|---|
| CE - selected_previous_therapy | `selected_previous_therapy` |
| CE - indicate_not_poor | `indicate_not_poor` |

**Tags** (Custom HTML type):

| Tag | Trigger | HTML |
|---|---|---|
| FB - AddToWishlist | CE - selected_previous_therapy | `<script>fbq('track','AddToWishlist',{source:location.hostname});</script>` |
| FB - Search | CE - indicate_not_poor | `<script>fbq('track','Search',{source:location.hostname});</script>` |

Publish the container, then paste the container ID into `pixel-config.js` as `gtmId`.

---

## How the pixel is initialized

Every page loads `pixel-config.js` first, then runs:

```js
fbq('init', pixelId);
fbq('track', 'PageView', { source: window.location.hostname });
```

Each version directory ships its own `fbevents.js` downloaded from the Wayback Machine snapshot matching that version's date. This is intentional — `fbevents.js` changes over time and the version in use affects which automatic events fire and what data they include.

When `dryRun: true`, a shim replaces `window.fbq` with a console logger. No beacons are transmitted and `fbevents.js` is not loaded.

---

## Automatic events (fired by `fbevents.js`, not page code)

These fire without any explicit `fbq('track', ...)` call:

| Event | Trigger | Key payload |
|---|---|---|
| `Microdata` | Page load | Scrapes `<title>`, meta tags, Schema.org markup |
| `SubscribedButtonClick` | Any button, anchor, or label click **inside a `<form>`** | `cd[buttonFeatures]` — tag name, class, id, innerText, name attribute; `cd[formFeatures]` — full form field schema |

`SubscribedButtonClick` is the most significant: it fires on every interactive element click within a form and transmits the complete form DOM schema — including field names, types, and values where present — regardless of whether the page author intended it.

---

## Versions

### Dec 2019 (`2019-12-09/`)

Wayback snapshot: `20191209103708`

**Quiz structure:** Slick.js slider, 6 slides. Radio inputs are standard visible elements inside `label.radio.slider-next-select`. Clicking a label triggers the radio change event and auto-advances the slider.

**`SubscribedButtonClick` fires on:** label clicks where the radio input is visible and focused — not on every answer selection in the same way as 2021.

**Slides:**
1. Counseling type — redirect type (Individual / Couple / Teenage)
2. Previous therapy — `is_previous_therapy` class → conditional pixel event
3. Financial status — `is_finance` class → conditional pixel event
4. Age — select auto-advance
5. Country — select + manual Next button
6. Insurance checkboxes — manual Next button

---

### Mar 2021 (`2021-03-02/`)

Wayback snapshot: `20210302184552`

**Quiz structure:** Slick.js slider, 7 slides. Every answer is wrapped in `div.big_button`; the radio input is hidden via CSS and the entire `<label>` is the visible button. Because the label is an interactive element inside a `<form>`, `fbevents.js` fires `SubscribedButtonClick` on **every answer selection**.

**`SubscribedButtonClick` fires on:** every answer click — the label IS the button.

**Slides:**
1. Counseling type — big button, redirect type
2. Gender — big button, with show-more revealing additional options
3. Previous therapy — big button, `is_previous_therapy` class → conditional pixel event
4. Financial status — big button, `is_finance` class → conditional pixel event
5. Country — select + manual Next button
6. State — select + manual Next button (separate from country; not in 2019)
7. Insurance checkboxes — manual Next button (adds COVID option vs. 2019)

---

## Conditional events

Two quiz answers trigger conditional pixel events through a `dataLayer` → GTM → `fbq()` pipeline (see GTM Setup above). The answers are also written to `sessionStorage` so `next.html` can fire the corresponding events on page load.

| Question | Answer | `dataLayer` event | Pixel event via GTM |
|---|---|---|---|
| Have you ever been in counseling or therapy before? | Yes | `selected_previous_therapy` | `AddToWishlist` |
| How would you rate your current financial status? | Good or Fair | `indicate_not_poor` | `Search` |

---

## `next.html` — signup / payment page

Each version has a three-section flow: concern checkboxes → description → payment form.

### Page-load events

Fired immediately on load using `sessionStorage` values written by `funnel.js`:

```
Always:            InitiateCheckout
therapy = yes:     AddToWishlist
therapy = yes
  AND fin ≠ poor:  Search, Lead
```

### Payment form submit events

Fired when the payment form is submitted (intercepted — no real POST):

```
CompleteRegistration
AddPaymentInfo
Lead
ViewContent
InitiateCheckout
Purchase
```

All post-form events are direct `fbq()` calls — they do not go through GTM.

The 2021 version includes `referred_you: window.location.hostname` on `CompleteRegistration`.

---

## Full event map

| Page | Trigger | Mechanism | `fbq()` call |
|---|---|---|---|
| index.html | Page load | direct | `PageView` |
| index.html | Any form click | automatic (fbevents.js) | `SubscribedButtonClick` |
| index.html | Therapy = Yes | dataLayer → GTM | `AddToWishlist` |
| index.html | Financial = Good or Fair | dataLayer → GTM | `Search` |
| next.html | Page load | direct | `PageView`, `InitiateCheckout` |
| next.html | Page load (therapy=yes) | direct | `AddToWishlist` |
| next.html | Page load (therapy=yes AND fin≠poor) | direct | `Search`, `Lead` |
| next.html | Any form click | automatic (fbevents.js) | `SubscribedButtonClick` |
| next.html | Payment submit | direct | `CompleteRegistration`, `AddPaymentInfo`, `Lead`, `ViewContent`, `InitiateCheckout`, `Purchase` |

---

## Verifying events

**Console (dryRun: true):** All `fbq()` calls log as `[DRY RUN] fbq("track", "EventName", ...)`. GTM-fired tags and direct calls both go through the same shim.

**Network tab (dryRun: false):** Filter by `facebook.com/tr`. Each beacon is a POST request. Key payload fields:
- `ev` — event name
- `ud[em]` — SHA-256 hashed email (Automatic Advanced Matching, fires from payment form email field)
- `cd[buttonFeatures]` — metadata from `SubscribedButtonClick`

**Meta Pixel Helper:** Chrome extension. Shows each event in real time with parameters.

**GTM Preview:** Shows `selected_previous_therapy` and `indicate_not_poor` firing when quiz answers are selected. Post-form events will not appear here — they bypass GTM.

**Meta Events Manager → Test Events:** Real-time server-side confirmation with full parameter payloads.
