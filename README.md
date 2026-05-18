# ROSSO — Luxury Automotive Service Platform

> **Precision in Motion.**
> A production-ready, cinematic booking platform for ROSSO — a premium independent service specialist for **BMW · MINI · Range Rover · Jaguar**.

Built with Next.js 14 (App Router), Tailwind CSS, Framer Motion, and Lucide Icons. Fully bilingual (English / Arabic with RTL), mobile-first responsive, SEO-optimized, and ready to deploy to Vercel in one click.

---

## ✦ Features

- **Cinematic hero** with layered gradients, SVG car silhouette, and animated stat counters
- **7-step booking flow** — Brand → Model → VIN → Service → Location → Schedule → Contact
- **WhatsApp integration** — booking confirmations open `wa.me/201101139997` with a formatted message pre-filled
- **Bilingual EN / AR** with full RTL layout support
- **Spare-part requests** with conditional UI inside the service step
- **Mobile vs. Center** booking type with conditional address fields
- **Premium UI details** — red glow pulses, marquee ticker, animated FAQ accordion, floating WhatsApp button, sticky navbar with scroll-triggered glassmorphism
- **SEO** — full metadata, OpenGraph, JSON-LD structured data (AutomotiveBusiness schema), sitemap, robots
- **Performance** — preconnected fonts, optimized package imports, Next.js Image, security headers
- **Accessibility** — reduced-motion support, semantic HTML, focus states, ARIA labels

---

## ✦ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS 3.4 + custom CSS layers |
| Animation | Framer Motion + CSS keyframes |
| Icons | Lucide React |
| Fonts | Audiowide (display) · Archivo Black · Archivo · Cairo + Tajawal (Arabic) |
| Deployment | Vercel (recommended) · any Node 18+ host |

---

## ✦ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set your environment variables
cp .env.example .env.local
# then edit .env.local — at minimum, set NEXT_PUBLIC_WHATSAPP_NUMBER

# 3. Run the dev server
npm run dev

# 4. Open http://localhost:3000
```

### Production build

```bash
npm run build
npm start
```

---

## ✦ Project Structure

```
rosso-nextjs/
├── app/
│   ├── globals.css         # Tailwind layers, animations, RTL, scrollbars
│   ├── layout.jsx          # Root layout, SEO metadata, JSON-LD, fonts
│   ├── page.jsx            # Renders <RossoApp />
│   └── sitemap.js          # Dynamic sitemap
├── components/
│   └── RossoApp.jsx        # Main app — all sections and 7-step booking
├── public/
│   ├── robots.txt
│   └── site.webmanifest
├── .env.example
├── .gitignore
├── jsconfig.json           # Path aliases (@/components, @/app)
├── next.config.js          # Image domains, security headers, optimizations
├── package.json
├── postcss.config.js
├── tailwind.config.js      # ROSSO brand tokens (rosso-*, ink-*, fonts)
└── README.md
```

---

## ✦ The Booking Flow

| # | Step | What it captures |
|---|---|---|
| 01 | **Brand** | BMW · MINI · Range Rover · Jaguar (4 luxury cards with custom SVG marks) |
| 02 | **Model** | Searchable list filtered by selected brand (BMW: 20 trims, MINI: 5, Range Rover: 5, Jaguar: 6) |
| 03 | **Chassis** | 17-character VIN with live counter + helper diagram |
| 04 | **Service** | 10 quick-select tiles + free-text description + conditional spare-part block (name, description, notes) |
| 05 | **Location** | Service Center vs Mobile/Home — Mobile reveals address, maps link, access notes |
| 06 | **Schedule** | Native date picker (dark themed, past dates disabled) + 10 hourly time-slot chips |
| 07 | **Contact** | Name, phone, WhatsApp (optional), email (optional) + booking summary preview |

When the user clicks **Confirm Booking via WhatsApp**:

1. A structured message is assembled (Arabic or English based on current language)
2. The message is URL-encoded and appended to `https://wa.me/201101139997?text=...`
3. WhatsApp opens with the message pre-filled — the user just hits send

---

## ✦ Customization

### Change the WhatsApp number
Edit `.env.local` (recommended) or replace the hardcoded number in `components/RossoApp.jsx` (search for `201101139997`).

### Add or edit models
In `components/RossoApp.jsx`, update the `MODELS` object near the top:

```js
const MODELS = {
  BMW: ['116', '118', ...],
  MINI: ['Cooper', 'Cooper S', ...],
  // add more
};
```

### Edit translations
The `translations` object at the top of `RossoApp.jsx` contains the full EN/AR copy. Edit any string in place — the UI re-renders automatically.

### Brand colors
Tweak `tailwind.config.js` → `theme.extend.colors.rosso` for the red scale and `colors.ink` for the dark scale. CSS variables are also defined in `app/globals.css`.

### Replace the logo
The `<RossoLogo>` component renders the wordmark via the Audiowide font. To use the actual ROSSO PNG/SVG, drop it in `public/logo.svg` and swap the component body for an `<Image>` tag.

---

## ✦ Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo on [vercel.com/new](https://vercel.com/new)
3. Add the env var `NEXT_PUBLIC_WHATSAPP_NUMBER` in the Vercel project settings
4. Deploy. That's it.

For other hosts (Netlify, Railway, self-hosted), the standard `next build && next start` flow works on any Node 18+ environment.

---

## ✦ Performance Notes

- Lucide icons tree-shake via `experimental.optimizePackageImports`
- Fonts are loaded once via `<link>` in the root layout with preconnect
- Images served as AVIF / WebP via `next/image`
- All animations honor `prefers-reduced-motion`
- Security headers (XFO, CSP-lite, Permissions-Policy) set in `next.config.js`

---

## ✦ License

Proprietary — © 2026 ROSSO Automotive. All rights reserved.
