# 🔗 Link Hub — Personal Contact & Social Links

A cinematic single-page link hub built with React, TypeScript, Three.js and GSAP. Features an infinite forward-travel space background, liquid glass UI, and a hyperspace warp transition when opening links.

## ✨ Features

- **Infinite Space Background** — Three.js starfield with nebulae, parallax, and seamless infinite recycling
- **Liquid Glass UI** — Backdrop-filter blur, SVG refraction filter, pointer-tracking tilt
- **Cinematic Transitions** — GSAP-powered hyperspace warp when clicking any link
- **Fully Responsive** — Mobile-first, safe-area insets, 2-column grid on desktop
- **Accessible** — Semantic HTML, real `<a>` elements, `prefers-reduced-motion`, visible focus
- **WebGL Fallback** — CSS gradient starfield if WebGL isn't available

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## 🎨 Customising Your Links

Edit **one file**: [`src/config.ts`](./src/config.ts)

### Change your name & tagline
```ts
name: 'Your Name',
tagline: 'Creative Developer & Designer',
```

### Change your photo
Place your photo at `public/profile.jpg`. A circular frame and glass ring are applied automatically. If the image is missing, your initials are shown as a fallback.

### Change your links
Each link has:

| Field        | Description                             |
|-------------|-----------------------------------------|
| `id`        | Unique identifier (used internally)     |
| `label`     | Displayed name on the card              |
| `url`       | Where to navigate (`https://`, `tel:`)  |
| `icon`      | Inline SVG markup (no external CDN)     |
| `accentColor` | Brand color for hover glow & warp tint |

```ts
{
  id: 'instagram',
  label: 'Instagram',
  url: 'https://instagram.com/your_username',
  accentColor: '#E1306C',
  icon: `<svg ...>...</svg>`,
},
```

### Change accent colors
Each card uses its `accentColor` for hover glow, border highlight, and the warp portal ring. Use any valid CSS color value.

---

## 📦 Build for Production

```bash
npm run build
```

Output goes to `dist/`.

---

## 🌐 Deploy

### Vercel
1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Framework: **Vite** (auto-detected)
4. Deploy!

### Netlify
1. Push to GitHub
2. Import in [netlify.com](https://app.netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy!

Or drop the `dist/` folder directly into Netlify Drop.

---

## 🗂 Project Structure

```
src/
  config.ts              ← Edit this to personalise
  main.tsx               ← Entry point
  App.tsx                ← Root component
  components/
    SpaceBackground.tsx  ← Three.js infinite star tunnel + nebulae
    ProfileHeader.tsx    ← Photo, name, tagline
    GlassCard.tsx        ← Individual link card
    LinkTransition.tsx   ← GSAP hyperspace warp animation
    LiquidGlassFilters.tsx ← SVG refraction filter
  hooks/
    useWarpState.ts      ← Warp factor state management
    useReducedMotion.ts  ← prefers-reduced-motion hook
  styles/
    global.css           ← Design tokens, glass utilities, layout
public/
  profile.jpg            ← Your profile photo
```

---

## ⚙️ Tech Stack

- **React 19** + **TypeScript**
- **Three.js** via `@react-three/fiber` + `@react-three/drei`
- **GSAP** for animation timelines
- **Vite** for dev/build
- Vanilla CSS with CSS custom properties

---

## 📝 License

MIT — use it however you like.
