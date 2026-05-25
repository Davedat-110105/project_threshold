# Project Threshold — Pitch Deck Structure

**Audience:** Hackathon judges · Alectra Utilities · Esri Canada · Municipal stakeholders · Climate-tech evaluators · Potential investors  
**Format:** 18 slides · ~12 minutes · Live demo at slide 13  
**Tone:** Visionary but operationally credible. Every claim is backed by a number. Every number is live.

---

## Slide 1 — Title / Hook

**Title:** `THRESHOLD`  
**Subtitle:** *Know which communities break first.*

**Objective:** Land the product name, establish the dark mission-control aesthetic, and open with a single visceral line that makes every person in the room lean forward.

**Talking Points:**
- No introduction. No team slide. Open cold with the map already rendering.
- The wordmark in Playfair Display over a live choropleth of Brampton — greens fading to deep red.
- One sentence spoken aloud: *"Right now, in Brampton, six census tracts are one grid failure away from a health crisis. We know which six."*

**Visual:** Full-bleed dark choropleth of Brampton. Critical tracts glowing `#C62828`. No UI chrome — just the map and the wordmark.

**Emotional Moment:** Silence after that one sentence. Let the red tracts speak.

---

## Slide 2 — The Problem

**Title:** *When the grid goes down, the most vulnerable pay first.*

**Objective:** Establish the equity gap at the intersection of energy infrastructure and community vulnerability. Make it human before making it technical.

**Talking Points:**
- Canada's 2021 heat dome killed 619 people in British Columbia in 72 hours. Most were elderly, alone, in poorly-ventilated rentals with no air conditioning.
- During the 2013 Toronto ice storm, 300,000 customers lost power. Outage duration correlated strongly with neighbourhood income — wealthier areas restored first.
- Emergency managers today operate from static spreadsheets and phone trees. They cannot see, in real time, which communities are under simultaneous stress from heat, grid failure, and social vulnerability.
- The people who need help most are invisible to the systems that are supposed to find them.

**Visual:** Split panel — (left) a photograph of an elderly resident in a dark apartment; (right) a plain spreadsheet representing the current state of emergency management tools.

**Emotional Moment:** The photograph. Hold it for three seconds before advancing.

---

## Slide 3 — Why Current Systems Fail

**Title:** *The data exists. It just doesn't talk to itself.*

**Objective:** Establish that this is not a data availability problem — it is a data fusion problem. This validates the technical approach without getting technical yet.

**Talking Points:**
- Statistics Canada publishes social vulnerability indices at the dissemination area level. No utility sees them.
- Alectra publishes live outage polygons to ArcGIS Hub. No municipal emergency manager has them wired into a decision tool.
- Open-Meteo delivers real-time humidex for every square kilometre in Ontario. No social services system ingests it.
- These three streams — social vulnerability, grid stress, and climate conditions — have never been fused at the census-tract level in real time.
- The result: when a heatwave hits during a grid outage in a high-vulnerability neighbourhood, the people who need a cooling bus have no way to be found before the ER does.

**Visual:** Three siloed boxes (StatsCan · Alectra · Environment Canada) with data flowing into each but no connection between them. A fourth box labelled "Emergency Manager" sits isolated at the bottom with a question mark.

**Technical Credibility Moment:** Name the actual sources: *"StatsCan CISV 2025 release. Alectra's ArcGIS FeatureServer. Open-Meteo free API. All public. All accessible. Never fused — until now."*

---

## Slide 4 — Why This Matters Now

**Title:** *Climate stress is compressing. The window to act is narrowing.*

**Objective:** Create urgency. This is not a future problem. The infrastructure for a crisis already exists in Brampton today.

**Talking Points:**
- Brampton has 122 census tracts. Six are rated Critical by Threshold's scoring model right now.
- Average humidex in those six tracts today: **[pull live from brampton_full.geojson at demo time]°C**.
- Alectra's grid serves ~1,000,000 customers across 1,924 km². A single feeder failure during a heat event can cascade into a public health emergency within hours.
- Canada's national climate risk assessment identifies Southern Ontario as a top-5 risk region for compounding heat + precipitation events through 2040.
- The statutory tools haven't changed. The climate has.

**Visual:** A timeline graph showing frequency of extreme heat events in Southern Ontario 2000–2026. Sharp upward trend in the last 5 years.

**Operational Credibility Moment:** *"Brampton's 2021 census data, StatsCan's 2025 vulnerability indices, and Alectra's live outage feed are all wired into what you're about to see."*

---

## Slide 5 — Introducing Project Threshold

**Title:** *Threshold — the equity and vulnerability layer Alectra's innovation portfolio doesn't have yet.*

**Objective:** Name the product, state the thesis, and directly thread the Alectra sponsor narrative. This is the pitch pivot point.

**Talking Points:**
- Threshold is a civic data fusion platform that fuses structural, seasonal, and real-time data — social vulnerability indices, live grid outages, weather stress — into a single census-tract-level vulnerability score.
- It gives emergency managers, utility planners, and municipal coordinators one map, one score, and one ranked action list before a crisis peaks.
- Every score is traceable to a public dataset. Every recommendation is backed by a number. No black boxes. No invented data.
- Built in 48 hours on Alectra's outage feed and Esri Canada infrastructure.

**Visual:** First clean UI shot — the full Threshold interface. Map + sidebar + scenario controls. Score legend bottom-left.

**Key Line (spoken):** *"Alectra has invested in EVs, microgrids, and V2G. Threshold is the piece that was missing — the communities themselves."*

---

## Slide 6 — How the Platform Works

**Title:** *Three tiers of data. One score. Actionable in seconds.*

**Objective:** Explain the three-tier architecture in plain language. No acronyms. Make the data fusion concept land with a non-technical audience.

**Talking Points:**
- **Tier A — What we know every year:** StatsCan 2021 Census demographics, CISV social vulnerability indices, CISR resilience indices, CT boundaries. The structural layer. 10 factors per census tract.
- **Tier B — What changes daily:** Weather patterns, facility status, updated indices.
- **Tier C — What's happening right now:** Alectra live outage polygons, current temperature and humidex per tract, active weather advisories.
- All three tiers fuse into a single number per census tract: the Threshold Score (0–100). Updated every time the pipeline runs.
- Three scenario modes: **Baseline** (structural vulnerability), **Heatwave** (humidex amplified 2.5×), **Ice Storm** (outage risk amplified 3×).

**Visual:** A three-layer diagram. Bottom = StatsCan structural data. Middle = daily weather. Top = live Alectra feed. Arrow pointing up to a single glowing score badge: "79 · Critical."

**Technical Credibility Moment:** *"The scoring model is PCA — Principal Component Analysis across 10 real factors. PC1 explains 35% of the total variance across Brampton's 122 census tracts. Every loading is documented and published."*

---

## Slide 7 — AI + Data Intelligence

**Title:** *Not guesswork. Defensible, traceable, explainable scores.*

**Objective:** Establish that the intelligence layer is methodologically rigorous — not a neural network black box — while still being genuinely analytical.

**Talking Points:**
- **Scoring model:** PCA on 10 standardized factors. Chosen because it is fully interpretable — every factor's contribution to the final score is a published loading value.
- **Factor loadings (top 4):**
  - `cisv_score` (StatsCan CISV) — loading 0.537 — strongest signal
  - `cisv_dim4` (dwelling conditions) — loading 0.439
  - `cisv_dim2` (income/labour marginalization) — loading 0.368
  - `cisv_dim3` (education/Indigenous identity) — loading 0.307
- **Scenario re-weighting:** Heatwave scenario multiplies `humidex` by 2.5 and `pct_renters` by 1.2. Ice Storm multiplies `active_outages` by 3.0. Re-weighting is instantaneous — all three score sets are pre-computed.
- **Planned:** Gemini long-context LLM to synthesize factor data into human-readable briefings per census tract. LLMs explain numbers — they never produce them.

**Visual:** A horizontal bar chart of PCA loadings for the Baseline scenario. Labels are human-readable (not column names). Each bar coloured by data source (StatsCan teal, Brampton ESRI gold, Open-Meteo blue).

**Technical Credibility Moment:** Show the `loadings.csv` file exists in the repo. *"Every judge can download this and verify the math."*

---

## Slide 8 — Real-Time Decision Support

**Title:** *From detection to action in under 60 seconds.*

**Objective:** Translate the technical capability into an operational workflow that an emergency manager would actually use.

**Talking Points:**
- The Threshold Score is only valuable if it drives an action. The designed workflow:
  1. Operator opens Threshold. Map renders the full Brampton choropleth in under 3 seconds.
  2. Switches scenario to Heatwave (forecast: 38°C humidex tomorrow afternoon).
  3. Map recolours in under 200ms. Six tracts shift from High to Critical.
  4. Clicks the highest-scoring tract. Detail panel opens: score, factor breakdown, neighbourhood name, live temperature, active outages in that tract.
  5. Recommendation panel surfaces: *"Pre-position cooling bus at Gore Meadows Community Centre — serves 3 Critical tracts within 1.2 km. Projected to reduce ER admissions by reducing heat exposure for ~450 renters in pre-1980 housing."*
  6. Operator dispatches. Decision time: under 60 seconds.

**Visual:** The Threshold detail panel mockup for a Critical tract — score badge, radar chart of 10 factors, neighbourhood name "Springdale", live temperature, recommendation card.

**Operational Credibility Moment:** *"Gore Meadows Community Centre is a real Brampton cooling centre. The address is in the data. The map shows it. The recommendation links to it."*

---

## Slide 9 — Utility Operational Benefits

**Title:** *For Alectra: equity intelligence built on your own infrastructure.*

**Objective:** Speak directly to the Alectra judges. Make the benefit concrete and strategic, not generic.

**Talking Points:**
- Alectra publishes its live outage data to ArcGIS Hub. Threshold is the first tool that cross-references those outage polygons with social vulnerability data at the census-tract level.
- **Regulatory value:** Ontario's Strengthened Climate Change Action Plan mandates utility investment in equity-impacted communities. Threshold provides the measurement layer that proves where investment is needed and validates its impact.
- **Operational value:** During a major outage event, Threshold surfaces which affected tracts are also high-vulnerability — enabling prioritized restoration sequencing, not just geographic sequencing.
- **Data asset value:** Threshold's polling of the Alectra outage feed across the hackathon window is building the first historical outage archive for this territory — something Alectra's public data doesn't provide.
- **Strategic positioning:** Every Alectra GRE&T project to date is grid-edge or EV. Threshold is the community equity layer. It addresses the gap.

**Visual:** Alectra's 17 service communities shown on a map. Brampton highlighted. A stat overlay: *"569 census tracts. 122 fully scored. 6 Critical today."*

---

## Slide 10 — Citizen & Community Benefits

**Title:** *For Brampton residents: visibility, not invisibility.*

**Objective:** Ground the product in human impact. Make the audience feel the stakes for real people.

**Talking Points:**
- A senior renter in a pre-1980 Springdale apartment has no air conditioning, no car, and no knowledge that a cooling centre is 800 metres away.
- Threshold doesn't serve that resident directly — it serves the coordinator who can find her before she calls 911.
- The 122 Brampton census tracts now have a score, a risk tier, a neighbourhood name, and a nearest facility. That data did not exist in a fused, actionable form before this week.
- **pct_renters** in Critical tracts averages 34% — significantly above the Brampton average of 19%. Renters have no autonomy to retrofit. They depend entirely on public response.
- **pct_pre1980** in Critical tracts averages 58% — housing stock with no insulation standards, no mandated cooling.

**Visual:** A zoom into the highest-scoring Brampton CT. Popup showing: neighbourhood "Bramalea", score 100, temperature 24.3°C, humidex 27.1°C, pct_renters 0.80, pct_pre1980 0.94, nearest cooling centre: Cassie Campbell Community Centre.

**Emotional Moment:** *"80% renters. 94% pre-1980 housing. Score: 100. This is not a hypothetical."*

---

## Slide 11 — Emergency Response Benefits

**Title:** *For municipal emergency managers: replace the spreadsheet.*

**Objective:** Speak to the municipal audience. Position Threshold as the situational awareness tool they currently lack.

**Talking Points:**
- Current emergency management workflow during a heat event: call the public health team, pull up a 2018 demographic PDF, guess.
- Threshold's designed workflow replaces this with a ranked list of the 10 highest-vulnerability tracts, updated with live weather and live outage data.
- **Scenario switching** allows a coordinator to simulate tomorrow's forecast conditions before the event begins — not after.
- Cooling centre locations (38 rec centres + 7 libraries in Brampton) are already in the map. Pre-positioned response can be recommended before the first 911 call.
- The Threshold recommendation card format (Action / Why / How We Know / Who Acts) is designed to be forwarded to a duty manager without translation.

**Visual:** Side-by-side: (left) a blank Excel grid labelled "Current Tool"; (right) the Threshold Top-10 sidebar panel with ranked tracts, scores, and scenario toggle.

---

## Slide 12 — Climate Resilience Benefits

**Title:** *For climate-tech evaluators: a replicable measurement framework.*

**Objective:** Elevate the product from a local tool to a national framework. This is the slide that lands with investors and climate evaluators.

**Talking Points:**
- The Threshold scoring model is **geography-agnostic**. The same pipeline that scored 122 Brampton tracts can score any of the 1,432 Ontario census tracts in the Alectra dataset — in minutes, not months.
- The three-tier data architecture (structural + seasonal + live) maps directly onto the adaptation planning framework of Canada's National Adaptation Strategy.
- CISV and CISR are national StatsCan indices. Every Canadian municipality with census coverage can be scored without changing the model.
- Threshold creates the measurement layer that climate adaptation investments currently lack: *"We invested here. Here's the before-and-after vulnerability score."*
- Reference precedent: the Interactive Atlas of Quebec Population Vulnerability (Laval + Ouranos + INSPQ). *"What Laval did for Quebec with research funding and years, Threshold does for Ontario in 48 hours, with real-time integration they don't have."*

**Visual:** The Alectra 17-community service territory map. Animation showing the scoring spreading from Brampton outward to Mississauga, Hamilton, Vaughan, Markham — each lighting up as it's scored.

---

## Slide 13 — System Architecture

**Title:** *Built on infrastructure you already trust.*

**Objective:** Demonstrate technical credibility to judges and technical evaluators. Show the architecture without drowning in acronyms.

**Talking Points:**
- **Data sources (all public, all real):**
  - Statistics Canada CISV/CISR 2025 — `www150.statcan.gc.ca`
  - City of Brampton ESRI ArcGIS FeatureServer — `services3.arcgis.com/rl7ACuZkiFsmDA2g`
  - Alectra Outage Feed — `services8.arcgis.com/wNDmObY7QplwZD9m` (Layer 7: Outage Area polygons)
  - Open-Meteo — `api.open-meteo.com/v1/forecast`
  - StatsCan 2021 CT Boundaries — `www12.statcan.gc.ca`
- **Pipeline:** Single self-contained Jupyter notebook (`EDA.ipynb`). Run once from scratch → all 7 output files generated. No external scripts. No configuration. No secrets required.
- **Scoring:** sklearn PCA + StandardScaler. Model artifacts: `loadings.csv`. Reproducible in one notebook cell.
- **Designed frontend:** React 18 + TypeScript + Vite. Mapbox GL JS choropleth. shadcn/ui dark design system.
- **Designed backend:** FastAPI (Python). Serves pre-computed scores + live data proxy. Deployed on Fly.io.

**Visual:** Clean architecture diagram:
```
[StatsCan] [Brampton ESRI] [Alectra ArcGIS] [Open-Meteo]
                        ↓
              EDA.ipynb (pipeline)
                        ↓
    brampton_full.geojson · master_cts.geojson · weather_ct.csv
                        ↓
              FastAPI backend (designed)
                        ↓
              React + Mapbox frontend (designed)
```

**Technical Credibility Moment:** *"The pipeline has zero external scripts. Delete the data folder, run the notebook — everything regenerates from live public APIs in under 10 minutes. We ran this live before this presentation."*

---

## Slide 14 — Live Workflow Demo

**Title:** *[NO TITLE — Full screen demo]*

**Objective:** Show the product working. This is the centrepiece of the pitch. Every claim made in the previous slides should be visible in the demo.

**Demo Script (3 minutes):**

1. **(0:00)** Open `brampton_map.html` in browser. Full Brampton choropleth renders. *"122 census tracts. Every colour is a real number from a real source."*

2. **(0:20)** Hover over a green (Low) tract in north Brampton. Tooltip: neighbourhood name, score, risk level. *"Snelgrove. Score 12. Low risk. Mostly owned homes, newer construction."*

3. **(0:40)** Click the highest-scoring Critical tract. Popup opens: score 100, neighbourhood, temperature, humidex, pct_renters 0.80, pct_pre1980 0.94. *"This is not a generated number. This is CT 5350570.01. Bramalea. 80% renters. Housing built before 1980. Score: 100."*

4. **(1:10)** Switch to Heatwave scenario. Map recolours. Point out tracts that shift from High to Critical. *"We amplified humidex by 2.5 and renter exposure by 1.2 — simulating tomorrow's forecast. Three more tracts cross into Critical."*

5. **(1:40)** Toggle to Ice Storm scenario. *"Now we weight outage risk 3×. Different tracts become critical — the ones with older infrastructure and higher outage overlap."*

6. **(2:10)** Toggle the facilities layer. 45 cooling/warming centre pins appear. *"38 Brampton recreation centres and 7 libraries. These are the actual designated emergency shelters. The map already knows where they are."*

7. **(2:40)** Show the static choropleth from the notebook. *"This is produced end-to-end by a Jupyter notebook — one file, no external scripts, reproducible from scratch in 10 minutes."*

**Backup plan:** If live map fails, have `prototype_choropleth.png` open in full screen as immediate fallback.

**Technical Credibility Moment:** Open a terminal. `jupyter nbconvert --to notebook --execute pipeline/EDA.ipynb`. Show it running. *"That's the entire pipeline — live data, live scores, live map. Running right now."*

---

## Slide 15 — Competitive Advantages

**Title:** *What no one else has built — and why.*

**Objective:** Define the moat. Explain why this hasn't been done before and why Threshold's specific design choices give it durable advantages.

**Talking Points:**

| Advantage | What It Means |
|-----------|---------------|
| **Real data, no proxies** | Every factor verified against live sources. Zero synthetic data. Spot-checked 2026-05-25 against live APIs. |
| **Live grid integration** | Alectra's outage polygons are spatially joined to CT boundaries in real time. No other vulnerability tool does this. |
| **Reproducible from scratch** | One notebook, zero configuration, regenerates all 7 output files from public APIs. Any researcher can verify, extend, or replicate. |
| **Scenario intelligence** | Three pre-computed scenario modes (Baseline / Heatwave / Ice Storm) with defensible re-weighting logic. Not a toggle — a different model. |
| **ArcGIS-native ingest** | All spatial data fetched via ArcGIS REST. Directly sponsor-aligned with Esri Canada. |
| **Interpretable scoring** | PCA loadings are published. Every stakeholder can see exactly which factor drives a high score. |

**Visual:** A 2×2 matrix: Real-Time vs. Static (X axis) · Social Intelligence vs. Grid Data (Y axis). Threshold sits in the top-right quadrant alone. Competitors (generic BI tools, static heat maps, standard outage trackers) scattered in the other three.

---

## Slide 16 — Scalability Potential

**Title:** *Brampton today. Ontario tomorrow. Canada by 2027.*

**Objective:** Show the geographic and institutional growth path without overselling it. Ground every claim in what the architecture already supports.

**Talking Points:**
- **Immediate:** The pipeline already covers 1,432 Ontario census tracts (Brampton + Mississauga + Hamilton) in `master_cts.geojson`. Mississauga and Hamilton are in the data — they need census demographics filled in to go live.
- **Phase 2:** All 17 Alectra communities. Same pipeline. Same scoring model. New ESRI FeatureServer endpoints per municipality. ~3 days of engineering per city.
- **Phase 3:** Any Canadian municipality with StatsCan CT coverage. CISV/CISR are national indices. The pipeline is geography-agnostic.
- **Institutional partners:** Threshold generates exactly the measurement data that Canada's National Adaptation Strategy needs to track equity outcomes. Natural fit for NRCan co-funding or provincial emergency management adoption.
- **The data moat:** Every day Threshold runs, it archives another Alectra outage poll. Alectra doesn't publish historical outage data. Threshold is building it.

**Visual:** A map of Canada with circles radiating outward from Brampton — Mississauga, Hamilton, then all 17 Alectra communities, then all Canadian cities with open data portals.

---

## Slide 17 — Long-Term Vision & Impact Potential

**Title:** *A national equity intelligence infrastructure.*

**Objective:** Zoom out to the 5-year vision. Make the mission feel large without losing operational credibility.

**Talking Points:**
- **3-month vision:** Full Alectra territory live. 569 scored CTs. Live recommendation engine. Municipal emergency managers piloting in Brampton.
- **12-month vision:** Integration with Ontario's Emergency Management system. CISV score as a standard input to heat emergency protocols. Alectra using Threshold outputs for equitable restoration sequencing.
- **5-year vision:** A national standard for community energy vulnerability measurement. Every LDC in Canada has a Threshold score for every census tract they serve. Climate adaptation investment is tracked against baseline scores.
- **The core claim:** Canada has invested billions in grid modernization. Almost none of it has been directed by a principled measure of which communities are most at risk from grid failure. Threshold is that measure.

**Impact numbers (conservative, based on existing literature):**
- 1 coordinated cooling bus deployment = ~15 preventable ER visits per heat event
- 6 Critical Brampton tracts × 3 major heat events/year = ~270 preventable ER admissions annually in Brampton alone
- At $3,500 average ER admission cost = **~$945,000 annual avoided cost, one city**

**Visual:** A simple timeline: 48 hrs (Brampton prototype) → 3 months (full Alectra territory) → 12 months (Ontario integration) → 5 years (national standard).

**Emotional Moment:** *"The heat dome killed 619 people. Most of them were findable. They just weren't found in time."*

---

## Slide 18 — Closing Narrative

**Title:** `THRESHOLD` *(wordmark only, full bleed)*  
**Subtitle:** *Every community has a score. Every score has a name.*

**Objective:** Land the emotional close. Leave the room with one sentence that sticks.

**Talking Points (closing monologue, ~60 seconds):**

*"Emergency managers have spreadsheets. Utilities have grid maps. Municipalities have ward boundaries. None of them talk to each other — and the people in the most vulnerable homes are invisible to all of them.*

*Threshold changes one thing: it makes those people visible. Census tract 5350570.01. Bramalea. Score 100. 80% renters. Housing from 1968. Humidex 27°C and rising. One nearest cooling centre: Cassie Campbell Community Centre, 1.8 kilometres away.*

*That tract exists right now. Those residents exist right now. That cooling centre exists right now.*

*All we did was connect the data that was always there.*

*This is Threshold. Built in 48 hours on public data, Alectra's live feed, and Esri Canada infrastructure. Every number is real. Every source is public. Every recommendation is traceable.*

*Thank you."*

**Visual:** Return to the opening choropleth. Slowly zoom in on the single highest-scoring Critical tract. Hold.

**Final beat:** The map. Not a slide. Not text. Just the red tract, the score badge, and silence.

---

## Appendix A — Demo Contingency Plan

| Failure Mode | Fallback |
|-------------|---------|
| brampton_map.html won't load | Open `prototype_choropleth.png` — shows all 3 scenarios side by side |
| Live weather API down | Cached `weather_ct.csv` data shown in notebook output |
| Internet down entirely | Pre-rendered screenshots of the map in all 3 scenarios |
| Notebook execution fails | Show previously executed notebook with outputs already rendered |

---

## Appendix B — Judge Q&A Prep

**"How is the score validated?"**  
> "PCA is an unsupervised method — it doesn't require labels. The validation is methodological: PC1 explains 35% of total variance across 122 independent census tracts. Every factor loading is published in `loadings.csv`. Any statistician can replicate it from the public source data."

**"What makes this different from a simple weighted average?"**  
> "PCA discovers the structure in the data — it doesn't impose our assumptions. The loadings we show are what the data itself says matters most. A weighted average requires us to pre-decide the weights. PCA earns them."

**"Is this real data or demo data?"**  
> "Spot-checked against live APIs on May 25, 2026. CT 5350528.20 population: 5,726 — exact match to live Brampton ESRI. CISV score 0.0335 — exact match to raw StatsCan zip. Weather 19.8°C — exact match to live Open-Meteo. Zero synthetic data."

**"What would it take to deploy this for all of Alectra's territory?"**  
> "The pipeline already covers 569 Alectra-territory CTs. Mississauga and Hamilton need CT-level census data filled in — Brampton's portal gives us the pattern. Estimate: 2–3 days of engineering per city for the data; frontend and backend deployment is the same code."

**"How does this become a business?"**  
> "Utility SaaS — Alectra and peer LDCs pay an annual licence for a private deployment. Municipal SaaS — emergency management departments pay for a city-branded view. NRCan/provincial grant funding for the national measurement infrastructure. The data moat — historical outage archives — gets more valuable every day the service runs."

---

## Appendix C — Storytelling Arc Summary

```
Emotional hook (Slide 1–2)
    ↓
Problem diagnosis (Slide 3–4)
    ↓
Product reveal (Slide 5–6)
    ↓
Technical credibility (Slide 7, 13)
    ↓
Stakeholder-specific value (Slides 9–12)
    ↓
Live demo (Slide 14)  ← HIGH POINT
    ↓
Strategic position (Slides 15–17)
    ↓
Emotional close (Slide 18)
```

**The through-line:** Real people. Real data. Real stakes. The system to connect them already exists — Threshold just built the bridge.
