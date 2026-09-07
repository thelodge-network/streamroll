// render-v2.mjs
import { GoogleGenAI } from "@google/genai";

// lib/runway.ts
import RunwayML from "@runwayml/sdk";
var styleDescriptions = {
  cinematic: "deep navy and gold color palette, dramatic god rays, film grain, epic atmosphere, dark background",
  retro: "80s neon synthwave aesthetic, hot pink and electric blue, CRT glow, retro grid, dark background",
  futuristic: "holographic chrome, electric cyan and white, sci-fi glitch effects, lens flare, space black background",
  minimal: "clean white sans-serif typography, soft gradient background, understated elegant design",
  horror: "blood red and pitch black, gothic serif font, creeping fog, dark shadows, candle-lit atmosphere",
  anime: "bold shonen anime title card, explosive energy burst behind letterforms, thick black ink outlines on the logo text, speed lines radiating outward from center, dramatic aura glow \u2014 electric blue outer rim, white-hot inner core, deep black background, saturated vivid orange and blue power colors, dynamic manga composition",
  adultswim: "Adult Swim network bumper, absolute pure black (#000000) background with zero texture or gradient, single block of clean white Helvetica Neue Condensed Bold text centered in frame \u2014 2 to 3 lines of lowercase deadpan text in the service name, small lowercase brand mark in square brackets '[service name]' in the lower-right corner subordinate to the main text, white (#FFFFFF) on pure black only \u2014 no colors, no borders, no decoration of any kind, clinical broadcast television identity",
  cartoon: "classic Cartoon Network checkerboard logo \u2014 'CARTOON' stacked above 'NETWORK' in Eagle Bold slab-influenced sans-serif, each letter set inside alternating black and white checkerboard tiles forming a perfect square grid, white letters on black tiles and black letters on white tiles, flat fill with zero gradients, surrounding environment in maximum-saturation flat primary colors \u2014 fire engine red, cobalt blue, canary yellow, grass green \u2014 classic 1990s television network graphic identity, bold and punchy",
  vhs: "90s VHS home video aesthetic, washed-out faded colors, magnetic tape tracking error artifacts \u2014 horizontal glitch bands across the image, analog scan lines visible, timestamp counter in corner, muted desaturated palette with color bleeding at edges, soft focus and analog warmth, recorded-over-many-times tape degradation quality",
  grindhouse: "1968 National Screen Service psychedelic feature presentation bumper, frame entirely filled with pulsing kaleidoscopic concentric rings radiating outward from center \u2014 maximum saturation of ALL colors simultaneously: electric red, acid orange, lime green, cobalt blue, hot magenta, gold-yellow \u2014 rings animate outward continuously, glowing central orb in warm amber-pink, bold all-caps condensed gothic sans-serif logo typography in white or yellow at center, heavy film grain over entire frame, the text reads as if cut from cardstock with hard edges",
  lofi: "hand-drawn anime illustration style, cozy bedroom study scene, anime girl with headphones reading at a wooden desk, sleepy cat curled on the desk, rain streaking down a window behind her, soft warm amber desk lamp, stacked books and stationery, vinyl record player in background, logo text quietly centered, Studio Ghibli warmth, muted amber and cool blue palette, peaceful late-night atmosphere",
  vaporwave: "vaporwave aesthetic, white marble Hellenistic Apollo bust floating in a digital void, flat magenta (#FF71CE) and cyan (#01CDFE) perspective-grid floor receding to horizon, semi-circle sun with gradient from deep magenta (#F52E97) through violet to indigo, Japanese katakana \uFF21\uFF25\uFF33\uFF34\uFF28\uFF25\uFF34\uFF29\uFF23 in wide geometric sans-serif, RGB chromatic aberration with prismatic fringing on all edges, VHS scan lines, deep purple background (#300350), soft bloom glow on neon elements, logo in wide-spaced geometric sans-serif",
  cyberpunk: "cyberpunk dystopia, dark rain-soaked night city, neon signs in Japanese characters glowing electric red and blue reflected on wet pavement, dense fog and smog between towering megabuildings, mega-city skyline silhouette in background, logo glowing with electric neon light against the darkness, Blade Runner 2049 meets Akira aesthetic, neon rain streaking through smog, moody atmospheric and dangerous",
  hbo: "1982 HBO Feature Presentation broadcast opening, massive three-dimensional chrome-plated brass letter forms floating in pure black empty space \u2014 physically thick beveled letters with visible metallic sheen, hard specular highlights on every edge, the interior of the letter O contains a spinning disc of fiber optic light rays in electric blue, crimson red, gold and emerald green rotating outward, deep cobalt-black background (#050510) with dense star field of small white stars, high-contrast analog television static texture at the edges, cinematic scope composition, letters float weightlessly in darkness with no ground, no architecture, no buildings, no landscape beneath",
  epic: "golden hour light, sweeping dust, monumental scale, bronze and amber tones, cinematic widescreen",
  nature: "earthy organic tones, lush green, soft natural light, documentary aesthetic, clean sans-serif",
  prestige: "bold crimson red wordmark \u2014 vivid saturated red (#E50914) primary faces with dark maroon shadow sides giving the letterforms subtle dimensional depth, clean geometric sans-serif, logo centered with generous negative space on all sides, premium streaming service identity",
  blockbuster: "late 1980s video rental store logo aesthetic, bold golden-yellow (#FFDE00) all-caps condensed block lettering on deep navy blue (#00157C), enormous heavy letterforms filling the frame, horizontal yellow accent band behind the text, film strip perforations bordering the top and bottom edges, warm incandescent glow radiating from the letterforms, late 80s corporate retail signage energy, nostalgic and bold",
  dreamworks: "dreamy sky, boy on crescent moon, clouds, cinematic",
  tristar: "pegasus in sky, clouds, golden light, cinematic",
  hannabarbera: "rainbow swirl circle, chrome star, black background, retro broadcast",
  columbia: "columbia figure with torch, clouds and light beams, classical cinematic",
  mst3k: "Mystery Science Theater 3000, asteroid with letters, silhouetted theater seats, space, starfield",
  ebs: "SMPTE color bars, emergency broadcast system, test pattern, monospace text"
};
var styleMotion = {
  cinematic: "The logo pulses with a slow golden breath \u2014 warm light swells across the letterforms, brightening and dimming. Golden light particles drift upward around the glowing text. Atmospheric haze rolls slowly across the dark background. A subtle lens flare blooms from the right edge. Camera pushes slowly forward \u2014 slow dolly in. Cinematic, dramatic.",
  retro: "The logo flickers on like a neon sign \u2014 letterforms light up with intensity variations and electric buzz. A horizontal scanline sweep passes over the frame. Neon edge-glow pulses rhythmically around the letterforms. Electric sparks radiate from the corners of the text. CRT vignette pulses at the edges. Camera holds completely static. 80s synthwave.",
  futuristic: "The logo glitches and assembles \u2014 chromatic aberration ripples through the letterforms as they snap to clarity with a digital burst. Holographic scan lines sweep over the composition. Bright cyan particles radiate outward from the letterforms and drift away. Camera holds completely static. Sci-fi, sleek.",
  minimal: "The logo shimmers softly \u2014 a single white light sweep travels left to right across the letterforms, brightening them gently as it passes. The text pulses with a barely perceptible warmth. Gentle shadows at the edges. Camera holds completely static. Clean, minimal, unhurried.",
  horror: "The logo flickers and breathes \u2014 candleflicker lighting pulses across the letterforms with eerie warmth variations. Deep red smoke curls upward from the base of the frame. A creeping shadow vignette closes slowly inward from all four edges. Camera holds completely static. Gothic, eerie, atmospheric.",
  anime: "Speed lines explode outward from center. A white-hot energy burst ignites behind the logo. The letterforms slam into frame \u2014 thick-outlined, vibrating with power. An electric aura pulses around the text: deep blue outer glow, white inner core. Energy particles shower downward. Camera holds completely static. Intense, high-energy shonen anime.",
  adultswim: "Hard cut to pure black. Two or three lines of white Helvetica Condensed text appear \u2014 either all at once or fading in line by line over two seconds. The text holds completely still, deadpan. The small lowercase brand mark in square brackets sits quietly in the lower corner, subordinate and unassuming. A single barely perceptible scan line flickers once across the frame and disappears. Nothing else moves. The stillness is absolute. Camera completely static throughout. The text just sits there.",
  cartoon: "Individual checkerboard tiles fly into frame from all directions simultaneously, each snapping into position with a sharp graphic impact. Character heads and body parts briefly peek from individual squares \u2014 cartoon ears, eyes, hands \u2014 then pull back as tiles settle. The letter tiles flip to reveal 'CARTOON' on top, 'NETWORK' below in Eagle Bold. Maximum saturation color flashes \u2014 fire engine red, cobalt blue, canary yellow \u2014 burst from the character tiles. The complete CN checkerboard logo locks into place. Bold, flat, zero gradients. Camera completely static throughout.",
  vhs: "The logo stutters into view \u2014 horizontal tracking error bands sweep across the frame as the letterforms struggle to lock in. Color bleeds laterally from the text. A timestamp blinks in the lower corner. The image rolls and warps with analog instability. Scan lines flicker across the composition. The logo stabilizes briefly, then judders again with magnetic dropout noise. Camera holds completely static. Lo-fi, analog, degraded.",
  grindhouse: "Kaleidoscopic concentric rings pulse outward from center \u2014 maximum saturation of ALL colors simultaneously: electric red, acid orange, lime green, cobalt blue, hot magenta, gold-yellow \u2014 rings radiate outward continuously. The central warm amber-pink orb expands and contracts. The text logo 'snipes' in from the four corners of the frame simultaneously, converging at center with mechanical linear motion and no easing \u2014 hard edges, no soft antialiasing. Film grain drifts across the entire frame. The 'Funky Fanfare' visual energy: barely-contained color chaos, brassy and driving. Camera holds completely static. Maximum saturation, maximum intent.",
  lofi: "The logo drifts gently into the cozy frame and settles \u2014 like it belongs there. Rain trickles slowly down the window behind the scene. Warm amber lamp light pulses softly. Steam curls lazily upward from somewhere off-frame. The logo breathes with the scene, unhurried. A barely perceptible warmth washes gently through the image. Camera holds completely static. Peaceful, cozy, hypnotic.",
  vaporwave: "The perspective-grid floor pulses slowly toward the magenta-to-indigo horizon. The white marble Apollo bust rotates imperceptibly in the digital void. The flat circle sun breathes \u2014 rising slightly, falling slowly. Full-width Japanese katakana characters drift with subtle VHS tracking displacement. RGB chromatic aberration pulses on all elements: the red channel shifts left, blue shifts right \u2014 prismatic fringing on every edge \u2014 then snaps back. VHS horizontal scan lines sweep slowly upward across the entire frame at 20% opacity. A brief glitch cut: the image corrupts into horizontal displacement blocks for one frame, then snaps back clean. Camera completely static throughout. Dreamy, surreal, hypnotic.",
  cyberpunk: "Neon rain falls through dark smog-thick air \u2014 streaks of red and blue neon catching in the fog. The logo materializes glowing with electric neon energy against the dark mega-city backdrop. Distant neon signs flicker and reflect on rain-slicked surfaces below. Fog drifts slowly between towers. The logo pulses with neon light \u2014 breathing, dangerous. Camera holds completely static. Dark, atmospheric, dystopian.",
  hbo: "Pure analog television static fills the frame \u2014 high-contrast black-and-white snow grain, textured and three-dimensional, not flat noise. The static holds for a beat. Then the massive chrome-plated brass 3D letterforms phase in through the noise as if a broadcast signal is locking in \u2014 physically thick beveled letters with hard specular highlights on every edge. The static recedes. Inside the letter O, a spinning disc of fiber optic light rays ignites: electric blue, crimson red, gold, emerald green beams rotating outward. Warm amber glow pulses from below suggesting the model city. Camera holds completely static. Prestige, broadcast, definitive.",
  epic: "The logo rises into frame from below as if cresting a ridge \u2014 letterforms scale up and settle center. A golden sunburst erupts from directly behind the text, warm light intensifies and spreads outward. Dust and debris blast outward from around the text and drift into the foreground. Camera eases into a very slow dolly in. Bronze and amber tones. Cinematic widescreen.",
  nature: "The logo drifts softly into center frame, gently swaying as if carried by a breeze, then settles. Golden morning light washes slowly left to right across the letterforms. A few leaf particles drift lazily past the foreground. Soft atmospheric haze drifts in the background. Camera holds completely static. Organic, peaceful, documentary.",
  prestige: "The logo snaps into view \u2014 letterforms crisp, bold, vivid red with a pulse of light. One explosive visual beat: thin vertical bands of deep crimson and dark maroon burst outward from behind the letterforms simultaneously left and right \u2014 ribbons of color shooting to the edges of the frame, filling the full width in under one second. The bands hold for a half-beat, then dissolve away. Logo pulses with a final glow. Camera holds completely static throughout.",
  blockbuster: "A warm golden-yellow spotlight ignites at center \u2014 bright incandescent light floods outward across the deep navy background. The bold block letters radiate warm yellow glow, letterforms pulsing with a buzzing fluorescent warmth. Film strip perforations along the frame edges rattle lightly with a subtle vibration. That familiar store-opening energy: bright, cheerful, unmistakably late-80s retail. Camera holds completely static. Nostalgic, golden, bold.",
  dreamworks: "Clouds drift slowly. The crescent moon glows. The camera drifts upward. Dreamy and cinematic.",
  tristar: "The Pegasus gallops powerfully in mid-air, wings beating, clouds churning. Dynamic and epic.",
  hannabarbera: "The rainbow swirl and chrome star animate in retro broadcast style. Retro cel-animation.",
  columbia: "Light beams sweep the sky, clouds churn. Classical cinematic logo reveal.",
  mst3k: "The asteroid slowly rotates in space. Stars twinkle. The silhouetted figures point and gesture. Campy sci-fi.",
  ebs: "Color bars hold static on screen. A harsh tone pulses. The monospace text flashes urgently."
};
var styleMotionGen45 = {
  cinematic: "[00:00] Logo pulses with a slow golden breath \u2014 warm light swells across the letterforms. [00:01] Golden light particles drift upward around the glowing text. Atmospheric haze rolls across the dark background. [00:02] Subtle lens flare blooms from the right edge. Camera begins a slow dolly in. [00:04] Scene settles \u2014 logo warm and glowing, camera eases to rest. Cinematic, dramatic.",
  retro: "[00:00] Logo flickers on like a neon sign \u2014 letterforms light up with intensity variations and electric buzz. [00:01] Horizontal scanline sweep passes over the frame top to bottom. Neon edge-glow pulses rhythmically around the letterforms. [00:02] Electric sparks radiate from the corners of the text. CRT vignette pulses at the edges. [00:04] Scene settles \u2014 logo neon-bright and glowing. Camera completely static throughout. 80s synthwave.",
  futuristic: "[00:00] Logo glitches and assembles \u2014 chromatic aberration ripples through the letterforms as they snap to clarity. [00:01] Holographic scan lines sweep over the composition. Digital glitch burst then settles. [00:02] Cyan particles radiate outward from the letterforms. [00:04] Particles drift away \u2014 logo sharp and vivid. Camera completely static throughout. Sci-fi, sleek.",
  minimal: "[00:00] Logo shimmers softly \u2014 soft white light sweep enters from the left. [00:01] Light travels slowly right \u2014 letterforms brighten gently as it passes. [00:03] Light sweep exits frame right. Subtle warmth lingers on the letterforms. [00:05] Scene holds \u2014 logo softly illuminated. Camera completely static throughout.",
  horror: "[00:00] Logo flickers and breathes \u2014 candleflicker lighting pulses across the letterforms with eerie warmth variations. [00:01] Deep red smoke curls upward from the base of the frame. [00:02] Creeping shadow vignette begins closing inward from all four edges. [00:04] Vignette tightens \u2014 logo flickers through the darkness. Camera completely static throughout. Gothic, eerie.",
  anime: "[00:00] Speed lines explode outward from center \u2014 white-hot energy burst ignites behind the logo. [00:01] Letterforms slam into frame, thick-outlined, vibrating with power. Electric aura erupts: deep blue outer glow, white inner core. [00:02] Energy particles shower downward from the text. Power aura pulses intensely. [00:03] Aura settles \u2014 logo bold, sharp, glowing with residual energy. [00:04] Scene holds, logo radiating heat. Camera completely static throughout. Intense shonen anime.",
  adultswim: "[00:00] Hard cut to pure black. [00:01] White Helvetica Condensed text lines appear \u2014 fading in sequentially, line by line, over one second. Small lowercase brand mark in brackets fades into lower corner. [00:02] A single scan line flickers once across the frame and disappears. Everything holds still. [00:03] Absolute stillness. Pure black field. White text. That's all. [00:04] Still there. Deadpan. Camera completely static throughout.",
  cartoon: "[00:00] Individual checkerboard tiles fly in from all directions \u2014 snapping into position with sharp graphic impacts. [00:01] Character body parts peek from individual squares \u2014 cartoon ears, eyes, hands \u2014 then pull back as tiles settle. [00:02] Letter tiles flip to reveal 'CARTOON' over 'NETWORK' in Eagle Bold. Maximum saturation color flash \u2014 fire engine red, cobalt blue, canary yellow. [00:03] Complete CN checkerboard logo locked into place. Bold, flat, zero gradients. [00:04] Scene holds \u2014 iconic. Camera completely static throughout.",
  vhs: "[00:00] Tracking error bands sweep horizontally \u2014 the image rolls and warps with analog instability. [00:01] Logo letterforms struggle into view through the magnetic noise, color bleeding from the edges. Timestamp blinks in the corner. [00:02] Image stabilizes briefly \u2014 logo visible but degraded, scan lines flickering. [00:03] Another tracking glitch sweeps the frame, logo judders. [00:04] Logo holds through the interference. Camera completely static throughout. Lo-fi, analog.",
  grindhouse: "[00:00] Kaleidoscopic concentric rings pulse outward from center \u2014 maximum saturation of ALL colors simultaneously: electric red, acid orange, lime green, cobalt blue, hot magenta, gold-yellow. [00:01] Central warm amber-pink orb expands. Text logo snipes in from all four corners of the frame simultaneously \u2014 mechanical linear motion, zero easing, hard edges, no antialiasing. [00:02] Text converges at center. Orb contracts. Film grain thickens across the entire frame. [00:03] Rings continue radiating outward continuously \u2014 all colors breathing and pulsing. [00:04] Logo centered and bold. Orb expands again. Maximum saturation, maximum intent. Camera completely static throughout.",
  lofi: "[00:00] Cozy interior. Rain trickles down the window. Warm amber lamp light glows softly. [00:01] Logo drifts gently into frame and settles \u2014 quiet, at home. Steam curls lazily upward from off-frame. [00:02] Rain continues. Lamp pulses softly. Logo breathes with the scene. [00:03] A gentle warmth washes across the frame. Everything still and peaceful. [00:04] Logo holds in the quiet. Camera completely static throughout. Cozy, hypnotic.",
  vaporwave: "[00:00] Deep purple void (#300350). Flat magenta (#FF71CE) and cyan (#01CDFE) perspective grid pulses forward toward the horizon. Flat semicircle sun sits on the horizon \u2014 gradient from deep magenta (#F52E97) through violet to indigo. [00:01] White marble Hellenistic Apollo bust floats into the digital void. Full-width Japanese katakana \uFF21\uFF25\uFF33\uFF34\uFF28\uFF25\uFF34\uFF29\uFF23 drifts with subtle VHS tracking displacement. [00:02] RGB chromatic aberration pulses across all elements: red channel shifts left, blue channel shifts right \u2014 prismatic fringing on every edge, then snaps back. VHS horizontal scan lines sweep upward at low opacity. [00:03] Single-frame glitch cut: image corrupts into horizontal displacement blocks, then snaps back clean. Logo shimmers. [00:04] Grid pulses again. Scene holds \u2014 dreamy, surreal, hypnotic. Camera completely static throughout.",
  cyberpunk: "[00:00] Dark rain-soaked night. Neon rain falls through fog \u2014 streaks of red and blue neon light. Mega-city silhouette looms in background. [00:01] Logo materializes \u2014 glowing with electric neon against the darkness. Neon reflections ripple on wet surfaces below. [00:02] Fog drifts slowly between towers. Distant neon signs flicker. Logo pulses with electric energy. [00:03] Rain continues. Smog thickens. Logo breathes \u2014 electric and dangerous. [00:04] Scene holds, dark and atmospheric. Camera completely static throughout.",
  hbo: "[00:00] Frame fills with pure analog television static \u2014 high-contrast black-and-white snow grain, dense and textured, not flat noise. [00:01] Broadcast signal begins locking in: massive chrome-plated brass 3D letterforms phase through the static \u2014 physically thick beveled letters with hard specular highlights on every edge emerging from the noise. [00:02] Static fully recedes. Letters resolved \u2014 chrome-plated, dimensional, imposing. Inside the letter O, a spinning disc of fiber optic light rays ignites: electric blue, crimson red, gold, emerald green beams rotating outward. [00:03] Fiber optic disc blazes with color. Warm amber-orange glow pulses from below, suggesting a model city. [00:04] Logo holds \u2014 chrome letters, fiber optic disc spinning, amber glow below. Camera completely static throughout. Prestige, broadcast, definitive.",
  epic: "[00:00] Logo rises into frame from below \u2014 letterforms scale up and settle center. [00:01] Golden sunburst erupts from directly behind the text \u2014 warm light intensifies and spreads. [00:02] Dust and debris blast outward and drift into the foreground. [00:03] Camera begins a very slow dolly in. [00:05] Scene settles \u2014 logo large, powerful, sharp. Bronze and amber tones.",
  nature: "[00:00] Logo drifts softly into center frame, gently swaying then settling. [00:01] Golden morning light enters from the left, washes slowly right across the letterforms. [00:02] Leaf particles drift lazily past the foreground. Soft atmospheric haze in the background. [00:04] Light settles \u2014 logo warm and grounded. Camera completely static throughout. Organic, peaceful.",
  prestige: "[00:00] Logo snaps into view \u2014 letterforms crisp, bold, vivid red with a pulse of light. [00:01] Explosive beat: thin vertical bands of deep crimson and dark maroon burst outward from behind the letterforms simultaneously left and right \u2014 ribbons of color shoot to the edges of the frame. [00:02] Color bands fill the full width of the frame. [00:03] Bands dissolve away. [00:04] Logo pulses with a final glow, then holds clean and sharp. Camera completely static throughout.",
  blockbuster: "[00:00] Deep navy frame. A warm golden-yellow spotlight ignites at center \u2014 bright incandescent light floods outward. [00:01] Bold block letters radiate warm yellow glow. Letterforms pulse with buzzing fluorescent warmth. Film strip perforations along frame edges rattle with subtle vibration. [00:02] Yellow glow intensifies then settles. The horizontal accent band behind the text brightens. [00:03] Perforations pulse again with golden light. That familiar store-opening energy fills the frame. [00:04] Scene holds. Camera completely static throughout. Late 80s, nostalgic, golden.",
  dreamworks: "[00:00] Clouds drift slowly. [00:02] Camera drifts upward through the clouds. [00:04] Crescent moon glows. Dreamy and cinematic.",
  tristar: "[00:00] Pegasus gallops powerfully in mid-air. [00:02] Wings beat, clouds churn. [00:04] Sunlight pulses. Dynamic and epic.",
  hannabarbera: "[00:00] Rainbow swirl animates on black. [00:02] Chrome star flies along the arc. [00:04] Star settles. Retro broadcast.",
  columbia: "[00:00] Light beams sweep the sky. [00:02] Clouds churn, torch shines. [00:04] Scene holds. Classical cinematic.",
  mst3k: "[00:00] Stars twinkle in deep space. [00:02] Asteroid rotates slowly. Silhouetted figures gesture and point. [00:04] Campy, low-fi sci-fi energy.",
  ebs: "[00:00] Color bars hold on screen. Harsh tone. [00:02] Text flashes urgently on the black bar. [00:04] Static. Alert."
};
var styleMotionVeo = {
  cinematic: "The logo holds centered and legible while a slow golden breath swells warm light across the letterforms, brightening then dimming. Around the glowing text, golden light particles drift upward and atmospheric haze rolls slowly across the dark background. A subtle lens flare blooms in from the right edge. The camera pushes forward in a slow, steady dolly. Cinematic and dramatic, unhurried.",
  retro: "The logo flickers on like a neon sign, letterforms buzzing with electric intensity variations, then holds steady and sharp. A single horizontal scanline sweeps across the frame. Neon edge-glow pulses rhythmically around the letters while electric sparks radiate from the corners. A CRT vignette pulses gently at the edges. The camera stays locked and static. 80s synthwave.",
  futuristic: "The logo glitches and assembles as chromatic aberration ripples through the letterforms, then snaps to crisp clarity and holds. Holographic scan lines sweep over the composition. Bright cyan particles radiate outward from the letters and drift slowly away into the space-black background. The camera stays locked and static. Sci-fi, sleek.",
  minimal: "The logo rests centered and perfectly still. A single soft white light sweep travels slowly from left to right across the letterforms, brightening them gently as it passes, then exits the frame. A barely perceptible warmth lingers on the text. The camera stays locked and static. Clean, minimal, unhurried.",
  horror: "The logo holds still while candleflicker lighting pulses across the letterforms with eerie warmth variations. Deep red smoke curls slowly upward from the base of the frame. A creeping shadow vignette closes gradually inward from all four edges, tightening around the flickering text. The camera stays locked and static. Gothic, eerie, atmospheric.",
  anime: "The letterforms slam into the center of frame, thick-outlined and vibrating with power, then hold sharp. Speed lines explode outward from center and a white-hot energy burst ignites behind the logo. An electric aura pulses around the text, deep blue on the outer rim and white-hot at the core, while energy particles shower downward. The camera stays locked and static. Intense, high-energy shonen anime.",
  adultswim: "Two or three lines of white Helvetica Condensed text sit dead center on a pure black field, holding completely still and deadpan. The small lowercase brand mark in square brackets rests quietly in the lower corner, subordinate and unassuming. A single faint scan line flickers once across the frame and vanishes. Nothing else moves; the stillness is absolute. The camera stays locked and static.",
  cartoon: "Individual black-and-white checkerboard tiles fly in from every direction and snap into a perfect square grid, then lock. Cartoon body parts \u2014 ears, eyes, hands \u2014 briefly peek from single squares and pull back as the tiles settle. The letter tiles flip to reveal 'CARTOON' stacked over 'NETWORK' in Eagle Bold. Maximum-saturation color flashes \u2014 fire engine red, cobalt blue, canary yellow \u2014 burst from the tiles as the complete logo settles, flat with zero gradients. The camera stays locked and static.",
  vhs: "The logo stutters into view as horizontal tracking-error bands sweep across the frame and the letterforms struggle to lock in, color bleeding laterally from the text. A timestamp blinks in the lower corner. The image rolls and warps with analog instability, scan lines flickering, then stabilizes briefly before juddering again with magnetic dropout noise, the logo holding through the interference. The camera stays locked and static. Lo-fi, analog, degraded.",
  grindhouse: "Kaleidoscopic concentric rings pulse continuously outward from center in maximum saturation of every color at once \u2014 electric red, acid orange, lime green, cobalt blue, hot magenta, gold-yellow \u2014 while a warm amber-pink orb at the center expands and contracts. The all-caps logo snipes in from the four corners simultaneously with hard mechanical linear motion and no easing, converging at center. Heavy film grain drifts across the entire frame. The camera stays locked and static. Maximum saturation, maximum intent.",
  lofi: "The logo drifts gently into the cozy frame and settles as if it belongs there. Rain trickles slowly down the window behind the scene, warm amber lamp light pulses softly, and steam curls lazily upward from off-frame. The logo breathes quietly with the scene as a gentle warmth washes through the image. The camera stays locked and static. Peaceful, cozy, hypnotic.",
  vaporwave: "The white marble Apollo bust floats and rotates imperceptibly in the deep purple digital void while the flat magenta-and-cyan perspective grid pulses slowly toward the magenta-to-indigo horizon and the semicircle sun breathes, rising slightly then falling. Full-width Japanese katakana drifts with subtle VHS tracking displacement. RGB chromatic aberration pulses across every element, red shifting left and blue shifting right into prismatic fringing, then snaps back; VHS scan lines sweep slowly upward at low opacity. The camera stays locked and static. Dreamy, surreal, hypnotic.",
  cyberpunk: "Neon rain falls through dark, smog-thick air, streaks of red and blue neon catching in the fog above a towering mega-city silhouette. The logo materializes glowing with electric neon energy against the darkness and holds, its light reflecting on the rain-slicked surfaces below. Fog drifts slowly between the towers while distant neon signs flicker, and the logo pulses, breathing and dangerous. The camera stays locked and static. Dark, atmospheric, dystopian.",
  hbo: "Pure high-contrast analog television static fills the frame in dense black-and-white snow, holding for a beat. The massive chrome-plated brass 3D letterforms phase in through the noise as a broadcast signal locking in, thick beveled letters with hard specular highlights on every edge, and the static recedes. Inside the letter O a spinning disc of fiber-optic light rays ignites \u2014 electric blue, crimson, gold and emerald beams rotating outward \u2014 while a warm amber glow pulses from below. The camera stays locked and static. Prestige, broadcast, definitive.",
  epic: "The logo rises into frame from below as if cresting a ridge, letterforms scaling up and settling at center. A golden sunburst erupts from directly behind the text, warm light intensifying and spreading outward, while dust and debris blast outward and drift into the foreground. The camera eases into a very slow dolly in. Bronze and amber tones, cinematic widescreen.",
  nature: "The logo drifts softly into center frame, swaying gently as if carried by a breeze, then settles. Golden morning light washes slowly from left to right across the letterforms while a few leaf particles drift lazily past the foreground and soft atmospheric haze moves in the background. The camera stays locked and static. Organic, peaceful, documentary.",
  prestige: "The crimson wordmark snaps into view crisp, bold and vivid red with a single pulse of light, then holds sharp and fully legible. One explosive beat follows: thin vertical bands of deep crimson and dark maroon burst outward from behind the letterforms simultaneously to the left and right, ribbons of color shooting to the edges and filling the full width of the frame in under a second, holding for a half-beat before dissolving away. The logo settles with a final glow against the black background. The camera stays locked and static throughout. Premium, definitive.",
  blockbuster: "A warm golden-yellow spotlight ignites at center and floods incandescent light outward across the deep navy background. The bold block letters radiate a buzzing fluorescent-warm glow, and the film-strip perforations along the top and bottom edges rattle with a subtle vibration. That familiar store-opening energy fills the frame, bright and cheerful, as the logo holds. The camera stays locked and static. Nostalgic, golden, late-80s retail.",
  dreamworks: "Clouds drift slowly across a soft blue sky as the crescent moon glows and the small figure rests on it. The camera drifts gently upward through the clouds. Dreamy and cinematic.",
  tristar: "The Pegasus gallops powerfully in mid-air, wings beating, as churning clouds and golden light surge behind it. The camera holds on the dynamic, epic reveal.",
  hannabarbera: "The rainbow swirl animates on pure black as the chrome star flies along its arc and settles at center. Retro broadcast cel-animation energy. The camera stays locked and static.",
  columbia: "Light beams sweep slowly across the warm sky as the clouds churn and the torch shines, the classical figure holding aloft. A stately, cinematic logo reveal. The camera stays locked and static.",
  mst3k: "The asteroid rotates slowly in deep purple-blue space as stars twinkle and the silhouetted theater figures point and gesture from their seats. Campy, low-fi sci-fi energy. The camera stays locked and static.",
  ebs: "The SMPTE color bars hold steady on screen as a harsh tone pulses and the monospace text flashes urgently across the frame. Alert, clinical, unmistakable. The camera stays locked and static."
};
var styleBackground = {
  cinematic: "Background: deep dark navy, almost black.",
  retro: "Background: very dark, near-black with subtle grid.",
  futuristic: "Background: space black, pure dark.",
  minimal: "Background: clean soft white or very light grey.",
  horror: "Background: pitch black.",
  anime: "Background: deep black with intense energy core at center.",
  adultswim: "Background: pure black. Nothing else.",
  cartoon: "Background: bold black and white checkerboard grid.",
  vhs: "Background: washed-out faded gray-blue, analog static at the edges.",
  grindhouse: "",
  lofi: "Background: cozy warm amber interior, rain streaking softly down a window.",
  vaporwave: "",
  cyberpunk: "Background: dark rainy dystopian night, neon-lit smog and fog, mega-city silhouette.",
  hbo: "",
  epic: "Background: dark warm amber-black.",
  nature: "Background: deep dark natural green-black.",
  prestige: "",
  blockbuster: "Background: deep navy blue (#00157C).",
  dreamworks: "Background: sky blue with clouds.",
  tristar: "Background: golden sky, clouds, water below.",
  hannabarbera: "Background: pure black.",
  columbia: "Background: warm sky, clouds, light beams.",
  mst3k: "Background: dark purple-blue space, starfield, theater seat silhouettes.",
  ebs: "Background: SMPTE color bars."
};
var treatmentImage = {
  "full-bleed": "logo fills the entire frame edge to edge, bold full-bleed composition, dominant typography",
  "theatrical": "cinematic widescreen with black letterbox bars, movie poster composition, 2.39:1 aspect feel",
  "minimal": "minimalist design, small refined logo centered on vast dark negative space, sparse and elegant"
};
var treatmentMotion = {
  "full-bleed": "Logo fills the frame with bold presence.",
  "theatrical": "Black letterbox bars frame the composition. Cinematic widescreen energy.",
  "minimal": "Logo surfaces quietly from deep darkness, restrained and elegant."
};
function buildPrompts(params) {
  const { name, style, tagline, treatment = "full-bleed", primaryColor, customNotes, videoModel } = params;
  const upper = name.toUpperCase();
  const taglinePart = tagline?.trim() ? `, subtitle text "${tagline.trim().toUpperCase()}" below` : ", no subtitle text, no secondary text lines";
  const colorPart = primaryColor ? `, key accent color: ${primaryColor}` : "";
  const notesPart = customNotes?.trim() ? `. ${customNotes.trim()}` : "";
  const bg = styleBackground[style] ? `${styleBackground[style]} ` : "";
  let imagePrompt;
  if (style === "adultswim") {
    const bracketName = `[${name.toLowerCase()}]`;
    const taglineLine = tagline?.trim() ? `, deadpan lowercase second line "${tagline.trim().toLowerCase()}"` : "";
    imagePrompt = `${bg}Adult Swim network ID card: service name "${bracketName}" in white Helvetica Condensed text${taglineLine}, ${styleDescriptions[style]}, professional broadcast design, no people${notesPart}`;
  } else {
    imagePrompt = `${bg}Streaming service logo for "${upper}"${taglinePart}, ${treatmentImage[treatment]}, bold dramatic typography, ${styleDescriptions[style]}, professional logo design, no people${colorPart}${notesPart}`;
  }
  const isGen45 = videoModel === "gen4.5";
  const isVeo = videoModel === "veo3" || videoModel === "veo3.1" || videoModel === "veo3.1_fast";
  const motion = isVeo ? styleMotionVeo[style] : isGen45 ? styleMotionGen45[style] : styleMotion[style];
  const videoPrompt2 = `The ${upper} streaming service logo is centered in frame. ${motion} ${treatmentMotion[treatment]} Logo text stays sharp and fully legible throughout. Animation begins immediately.${notesPart}`;
  return { imagePrompt, videoPrompt: videoPrompt2 };
}

// render-v2.mjs
import fs from "node:fs";
var W = "/tmp/lodgeflix-v2";
var P = {
  name: "LODGEFLIX",
  style: "prestige",
  treatment: "minimal",
  primaryColor: "#E50914",
  duration: 4
};
var { videoPrompt } = buildPrompts({ ...P, videoModel: "gen4_turbo" });
if (process.argv[2] === "start") {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  const b64 = fs.readFileSync("/tmp/lodgeflix/ref_frame0.png").toString("base64");
  const op = await ai.models.generateVideos({
    model: "veo-3.1-fast-generate-preview",
    prompt: videoPrompt,
    image: { imageBytes: b64, mimeType: "image/png" },
    config: { numberOfVideos: 1, aspectRatio: "16:9", resolution: "720p", durationSeconds: 4 }
  });
  if (!op.name) throw new Error("no operation name");
  fs.writeFileSync(`${W}/op.txt`, op.name);
  fs.writeFileSync(`${W}/prompt.txt`, videoPrompt);
  console.log("started:", op.name);
} else {
  const opName = fs.readFileSync(`${W}/op.txt`, "utf8").trim();
  const key = process.env.GOOGLE_AI_API_KEY;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opName}?key=${key}`);
  if (!r.ok) {
    console.log("poll HTTP", r.status);
    process.exit(1);
  }
  const op = await r.json();
  if (!op.done) {
    console.log("RUNNING");
    process.exit(0);
  }
  if (op.error) {
    console.log("FAILED", JSON.stringify(op.error).slice(0, 300));
    process.exit(1);
  }
  const v = op.response?.generateVideoResponse?.generatedSamples?.[0]?.video ?? op.response?.generatedVideos?.[0]?.video;
  if (!v) {
    console.log("FAILED: done but no video");
    process.exit(1);
  }
  let buf;
  if (v.videoBytes) buf = Buffer.from(v.videoBytes, "base64");
  else {
    const sep = v.uri.includes("?") ? "&" : "?";
    const d = await fetch(`${v.uri}${sep}key=${key}`);
    if (!d.ok) {
      console.log("download HTTP", d.status);
      process.exit(1);
    }
    buf = Buffer.from(await d.arrayBuffer());
  }
  fs.writeFileSync(`${W}/raw.mp4`, buf);
  console.log("SUCCEEDED  raw bytes=" + buf.length);
}
