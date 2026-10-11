# MELTDWN
> **"THE FACTORY IS FINE. YOU ARE NOT."**

**Submission for Game Vita 5.0 — Worst Game Wins**  
**Genre:** 2D Platformer / Steampunk Comedy / Deliberately Terrible Bureaucratic Game Design  

---

## 🎩 Premise

You are a senior engineer tasked with restarting the **Grand Steam Engine** deep within a colossal Victorian Steampunk factory. 

There's only one problem: the factory is hyper-operational when it comes to enforcing absurd bureaucratic regulations, but actively hostile to anyone attempting to actually do their job. Every step of progress triggers administrative backlash, OSHA safety audits, conveyor belt traps, and pressure spikes.

### The Signature Ending
When you finally navigate the hazards, dodge the steam vents, collect the permits, manage the boiler pressure, and ignite the Grand Steam Engine, the factory delivers its ultimate administrative verdict:

```text
======================================================
                     FORM 47-B
     APPLICATION FOR PERMISSION TO CELEBRATE
              STATUS: PENDING REVIEW
======================================================
Estimated processing time: 412 business days.
(Do not celebrate until formal authorization is filed.)
======================================================
```

---

## 🕹️ Controls

| Action | Primary Key | Secondary / Alternative | Mouse Support |
| :--- | :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` | `←` / `→` Arrow Keys | — |
| **Jump** | `Space` | `W` / `↑` Arrow Key | — |
| **Interact / Activate** | `E` | Context prompt `[E]` | Click dialog to advance |
| **Tap Pressure Gauge** | `T` | Click HUD Gauge directly | Click pressure gauge |
| **Pause / Resume** | `Escape` | In-game pause menu | Click `[ESC]` button |
| **Toggle Audio** | `M` | In-game sound indicator | Click `[M]` button in HUD/Menu |
| **Restart Shift** | `R` | Defeat / Victory / Pause screens | Click `[R]` button |

*Note: All visible menu buttons, dialog dismissals, sound toggles, and pause options are fully interactive with mouse clicks as well as keyboard shortcuts.*

---

## ⚙️ Core Mechanics & "Worst Game Wins" Features

### 1. Mechanic A — Selective Bureaucracy (Permits)
Important machinery cannot be operated without proper filed documentation:
- **Form 12-A (Generator Permit):** Required to start the electrical generator.
- **Form 23-C (Valve Relief Permit):** Required for locked high-pressure safety valves.
- **Form 47-B (Engine Ignition Clearance):** Required to start the Grand Steam Engine.
- Attempting to operate unpermitted machinery triggers official rejection notices and violation records.

### 2. Mechanic B — Boiler Pressure System
The factory boiler is on a hair-trigger:
- Pressure passively builds over time.
- Running machinery and conveyor belts accelerates pressure accumulation.
- Releasing steam valves vents pressure (with cooldown periods).
- Falling off platforms incurs an OSHA incident report and a **+8% pressure penalty** rather than instant defeat, resetting you at the nearest checkpoint.
- **Defeat:** Exceeding 100% causes a catastrophic boiler meltdown.

### 3. Mechanic C — Progress Is The Trap
Every time you accomplish an objective, the factory "rewards" you with a complication:
- **Starting the Generator:** Restores power, but immediately turns on the lethal high-speed conveyor belts in Section 3.
- **Operating the Steam Crane:** Clears the path, but automatically triggers a 47-violation mandatory safety inspection with administrative paperwork delays.
- **Coolant Pump:** Helps coolant flow, but motor vibration spikes boiler pressure by +12%.

### 4. Mechanic D — Trust Memory
The factory observes your behavioral tendencies and uses them against you:
- **Sign Trust:** The factory provides helpful directional signs. But if you rely on them repeatedly, later signs begin offering aggressively bad advice (*"ACTUALLY, the engine is to the LEFT (It is not)"* or *"TIP: Jump into steam vents for bonus gears"*).
- **Gauge Trust & Deception:** Frequent valve users have their pressure gauge "recalibrated for employee morale" to under-report true pressure by 20%. Players can discover the deception by clicking or pressing `[T]` to tap the gauge glass, causing the needle to twitch and reveal the true reading.
- **Upgrade Trust:** Excessive sprinting with Turbo Boots triggers a boot overheating penalty (*"Unauthorized locomotion velocity detected: +2% friction pressure penalty"*).

### 5. Mechanic E — Cursed Upgrades
Available at Victorian vending stations:
- **Turbo Boots (Cost: 3 Gears):** Increases movement speed by +80%, but reduces stopping traction by 50% (ice-skate slide physics) and overheats if sprinted continuously.
- **Golden Gear (Cost: 4 Gears):** Unlocks the high pneumatic overhead **Golden Shortcut Express** straight over the hazards to the Engine Room, but immediately inflicts an upfront cost of **+15% boiler pressure**.

---

## 🏗️ Technical Architecture

- **Engine:** Pure Vanilla JavaScript (ES Modules) — zero external frameworks or heavy dependencies.
- **Rendering:** HTML5 Canvas 2D with procedural steampunk aesthetics:
  - Brass and copper piping, parallax gear silhouettes, dynamic rivets, animated steam vent particles, and parchment overlays.
- **Audio:** Web Audio API with procedural sound generation:
  - Jump swooshes, gear chimes, bureaucratic denial buzzers, valve noise bursts, steam hiss, and meltdown booms.
- **Bundler:** Vite 8 (Client-side static build).

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+) and npm.

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# Open http://localhost:5173 in any modern browser
```

### Production Build
```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```
The output files are generated in `dist/`.

---
