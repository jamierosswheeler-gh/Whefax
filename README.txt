
# WheelerFax + Travel Well And Thifty (Teletext PWA)

A Ceefax/Teletext-styled travel deals app you can fully run from your phone. Paste messy deal info → it condenses to clean cards with your **affiliate links**.

## Phone-only workflow
1. Open `index.html` to test locally. 
2. Host on GitHub Pages/Neocities/Vercel using only your phone (see earlier instructions).
3. In **Add Deal**, paste raw text (flights, hotel, dates, price, notes). 
4. Add affiliate links (comma-separated). Optional cover image URL.
5. Tap **Condense & Preview** → **Save Deal**. 
6. Deals are stored on-device (localStorage). Use **Export JSON** to move them, then **Import JSON** on another device/site.

### Optional: AI condense
In **Settings**, paste your OpenAI API key. The app will call the API *client-side* to produce a better JSON summary. If no key is provided, it uses a built-in heuristic parser.

## Teletext Style
- Black background, bright RGBY/CYM colors, monospace. 
- TWAT letters in “Travel Well And Thifty” are highlighted as requested for the anagram.

## Files
- `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js`
- `assets/logo-teletext.png`, `assets/icon-192.png`, `assets/icon-512.png`

## Notes
- Service worker requires HTTPS when hosted.
- Affiliate links are marked as `rel="sponsored"` and open in a new tab.
- No server backend required; if you need multi-user authoring, consider a very light backend later.
