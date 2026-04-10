# Pill cutter (OpenJSCAD)

Finale model: één **rechthoekige balk** in het eerste kwadrant, met een **cilindrische holte** en een **schuin uitgesneden blok** aan het linkervlak — alles als **één solid** (`subtract`).

## Geometrie (zie `pill-cutter.jscad`)

- **Block:** `BLOCK_LENGTH × BLOCK_DEPTH × OUTER_HEIGHT` (eerste kwadrant, hoek op de oorsprong). Afmetingen volgen uit `OUTER_DIAMETER`, `OUTER_HEIGHT` en `BLOCK_DEPTH` in het bestand.
- **Holte:** volle cirkel in XY (`circle`), geëxtrudeerd over `CAVITY_HEIGHT`; positie in XY wordt met de blok-boolean beperkt tot wat binnen de balk valt.
- **Schuine uitsnede:** een `cuboid`, **10°** `rotateY` om **+Y**, met het **middelpunt van het zijvlak richting de balk** op het vlak **`x = 0`** (zelfde midden als het linkervlak van de balk: `(0, BLOCK_DEPTH/2, 0)`). Die uitlijning gebruikt een expliciete translate: na `rotateY` ligt het midden van het +X-vlak op `((dx/2)cos θ, 0, -(dx/2)sin θ)`; verschuiven met `(-(dx/2)cos θ, BLOCK_DEPTH/2, +(dx/2)sin θ)` zet dat punt op het blokvlak (inclusief Z-correctie voor de kanteling).

## Export

Vanaf de repository root:

```bash
node designs/pill-cutter/render-png.js
```

Output: `pill-cutter.stl`, `pill-cutter.png`.

Zie [`../../OPENJSCAD_SKILL.md`](../../OPENJSCAD_SKILL.md) voor de algemene JSCAD/PNG-workflow.

---

## Learnings (uit het ontwerpproces)

1. **Eerst visualiseren, dan boolean**  
   Een tweede vorm (voorheen rood) helpt om hoek, positie en overlap te beoordelen. De definitieve oplossing trekt die vorm **af** van de balk: `subtract(block, cavity, cutout)` — één mesh voor print/CAM.

2. **Welk vlak je bedoelt, bepaalt de rotatie-as**  
   Een kanteling die op het **voorkant-vlak** (`y = 0`) logisch is met `rotateX` (kanteling in het YZ-vlak), hoort op het **linkervlak** (`x = 0`) bij een **analoge** kanteling in het **XZ-vlak** → **`rotateY`**. Dezelfde hoek in graden, andere as.

3. **Niet uitlijnen op een hoekpunt tenzij dat de bedoeling is**  
   Uitlijnen op **max. X** na rotatie zet een **hoek** op `x = 0` — het vlak snijdt dan “scheef” door het zijvlak; het **midden** van het contactvlak zat niet op het blokvlak. Beter: het **middelpunt van het zijvlak** naar het gewenste punt op het vlak van de uitsparing leggen, met een **Z-translate** mee zodat dat midden na `rotateY` op `z = 0` blijft (in lijn met het midden van het blokvlak).

4. **`subtract` met meerdere volumes**  
   `@jscad/modeling` ondersteunt `subtract(a, b, c, …)` — alles na de eerste vorm wordt van de eerste afgetrokken.

5. **Constanten in één bestand**  
   Alle maten staan bovenaan de `.jscad`; aanpassingen voor productie gaan daar, niet verspreid over losse preview-scripts.
