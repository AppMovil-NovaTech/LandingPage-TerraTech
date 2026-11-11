# LandingPage-TerraTech

## Description

Landing page for TerraTech, an agricultural solution for managing plots and sensors and viewing soil information. It presents what the sensor measures (moisture, temperature, and nutrients), sourced context figures from INEI, feature blocks with screenshots of the Android app, a three-step getting-started guide, Pro and Enterprise plans, the NovaTech team, and frequently asked questions. Contact happens through WhatsApp links; the page itself does not collect visitor data. The terms and conditions modal is provisional: its nine sections contain generic draft terms based on the current informational version.

## Technologies Used

- **HTML5:** semantic content structure.
- **CSS3:** responsive layout and interface styling.
- **JavaScript:** navigation, translations, and the terms dialog.
- **Bricolage Grotesque, Inter, and SVG:** self-hosted WOFF2 typography and icons for the visual identity.

## Project Structure

```text
LandingPage-TerraTech/
├── index.html
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── i18n.js
│   │   └── main.js
│   ├── i18n/
│   │   ├── es.json
│   │   └── en.json
│   ├── fonts/
│   ├── images/
│   │   ├── screens/
│   │   └── team/
│   └── favicon.svg
└── README.md
```

## Internationalization

The landing page is available in **Spanish and English** through the **ES / EN** selector. Spanish is the default language, and the user's preference is saved in `localStorage`.

Translations are stored in `public/i18n/es.json` and `public/i18n/en.json`. The native JavaScript engine in `public/js/i18n.js` loads them with `fetch`, applies translations, and manages the language preference without external libraries. Translations cover content, navigation, accessible text, and metadata. App screenshots show the app's English interface.

Serve the project over HTTP using Live Server or `python -m http.server 4173 --bind 127.0.0.1`, then open `http://127.0.0.1:4173`. Opening `index.html` directly does not support JSON loading. If loading fails, the original Spanish content remains visible and translation-dependent controls stay disabled.
