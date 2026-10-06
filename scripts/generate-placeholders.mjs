// Generates the development placeholder artwork in /public/placeholders.
// Run: node scripts/generate-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const out = new URL("../public/placeholders/", import.meta.url);
mkdirSync(out, { recursive: true });

const shapes = {
  blouse: "M300 380 L350 340 Q400 385 450 340 L500 380 L545 480 L492 500 L482 445 L482 620 L318 620 L318 445 L308 500 L255 480 Z",
  tunic: "M310 360 L355 330 Q400 375 445 330 L490 360 L525 470 L478 490 L468 440 L492 840 L308 840 L332 440 L322 490 L275 470 Z",
  gown: "M345 350 L372 330 Q400 372 428 330 L455 350 L448 530 L575 880 L225 880 L352 530 Z",
  lehenga: "M335 360 L368 335 Q400 372 432 335 L465 360 L456 480 L610 880 L190 880 L344 480 Z",
  saree: "M290 340 L360 330 Q420 360 520 340 L560 880 L250 880 Z M330 400 Q400 470 520 430 M320 520 Q410 590 540 540 M312 640 Q410 710 548 650",
};

const items = {
  choli: ["blouse", "#E7C9C5", "#B76E79"],
  lehenga: ["lehenga", "#EAD7C2", "#A8516B"],
  saree: ["saree", "#E5D3BE", "#8A3B46"],
  kurti: ["tunic", "#E8DDCB", "#5E8C86"],
  dress: ["gown", "#E9D5D3", "#2B2523"],
  gown: ["gown", "#E2CDD2", "#7A2E48"],
  anarkali: ["gown", "#EADBC8", "#B8975A"],
  "salwar-suit": ["tunic", "#E6D9D0", "#8C5A7A"],
  other: ["tunic", "#EADFD2", "#B76E79"],
};

const label = (s) => s.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());

function svg(slug, variant) {
  const [shapeKey, bg, fg] = items[slug];
  const shape = shapes[shapeKey];
  const bg2 = variant ? fg : bg;
  const garment = variant ? bg : fg;
  const stroke = variant ? "#FBF7F2" : "#FBF7F2";
  const dots = Array.from({ length: 18 }, (_, i) => {
    const x = 120 + ((i * 97) % 560);
    const y = 120 + ((i * 163) % 760);
    return `<circle cx="${x}" cy="${y}" r="${(i % 3) + 2}" fill="#B8975A" opacity="0.35"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${label(slug)} placeholder">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${variant ? fg : bg}" stop-opacity="${variant ? 0.9 : 1}"/><stop offset="1" stop-color="#FBF7F2"/></linearGradient></defs>
<rect width="800" height="1000" fill="url(#g)"/>
<path d="M130 960 V400 a270 270 0 0 1 540 0 V960 Z" fill="${bg2}" opacity="0.35"/>
${dots}
<path d="${shape}" fill="${garment}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round" fill-rule="evenodd"/>
<text x="400" y="945" text-anchor="middle" font-family="Georgia, serif" font-size="34" letter-spacing="6" fill="#2B2523" opacity="0.7">${label(slug).toUpperCase()}</text>
</svg>`;
}

for (const slug of Object.keys(items)) {
  writeFileSync(new URL(`${slug}.svg`, out), svg(slug, false));
  writeFileSync(new URL(`${slug}-2.svg`, out), svg(slug, true));
}

// Hero artwork
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 960" role="img" aria-label="Illustration of ethnic outfits">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3DCD8"/><stop offset="1" stop-color="#F7EBDD"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9BC83"/><stop offset="1" stop-color="#B8975A"/></linearGradient>
</defs>
<rect width="800" height="960" fill="url(#bg)"/>
<path d="M90 940 V380 a310 310 0 0 1 620 0 V940 Z" fill="#FBF7F2" opacity="0.7"/>
<path d="M90 940 V380 a310 310 0 0 1 620 0 V940" fill="none" stroke="url(#gold)" stroke-width="4"/>
<path d="M120 940 V385 a280 280 0 0 1 560 0 V940" fill="none" stroke="#B8975A" stroke-width="1.5" opacity="0.6"/>
<g stroke="#FBF7F2" stroke-width="5" stroke-linejoin="round">
<path d="M230 330 L300 305 Q340 345 380 305 L450 330 L440 520 L600 900 L70 900 L230 520 Z" fill="#B76E79"/>
<path d="M470 420 L520 400 Q555 430 590 400 L640 420 L632 560 L735 900 L400 900 L478 560 Z" fill="#B8975A" opacity="0.92"/>
<path d="M60 470 L110 450 Q140 480 170 450 L220 470 L214 640 L270 900 L10 900 L66 640 Z" fill="#2B2523" opacity="0.88"/>
</g>
<g fill="#B8975A" opacity="0.55">
<circle cx="150" cy="200" r="5"/><circle cx="640" cy="170" r="4"/><circle cx="700" cy="300" r="6"/><circle cx="90" cy="320" r="3"/><circle cx="420" cy="120" r="4"/>
</g>
<path d="M300 430 q40 30 100 0 M280 520 q60 40 140 0" stroke="#FBF7F2" stroke-width="3" fill="none" opacity="0.7"/>
</svg>`;
writeFileSync(new URL("hero.svg", out), hero);
console.log("placeholders written");
