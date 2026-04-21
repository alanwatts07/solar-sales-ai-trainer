# Technical Brief: Door Knock Initiation + Random Door UI

## Problem
Mobile browsers (especially Safari) block `getUserMedia()` unless it's triggered directly by a user gesture (tap/click). Our current mic button sometimes fails because the permission request isn't tied tightly enough to the interaction.

## Solution: The Door IS the Trigger
Replace the difficulty selection screen with an interactive door. Tapping the door:
1. Plays a "knock knock" sound effect
2. Fires `getUserMedia()` inside the click handler (satisfies browser gesture requirement)
3. Starts the AI session immediately
4. Transitions to the conversation view

## UX Flow
```
[Random Door Loads] → User taps door → *knock knock* → Mic permission granted
→ Door "opens" (animation) → AI customer greets them → Conversation begins
```

## Multiple Door Components
Create 4-5 visually distinct door designs as React components:
- **SuburbanDoor** — Classic white door, brass knocker, welcome mat
- **ModernDoor** — Sleek dark door, minimalist handle, glass panel
- **RusticDoor** — Wooden door, iron hardware, stone frame
- **ApartmentDoor** — Metal door, peephole, unit number
- **FancyDoor** — Double doors, ornate handles, columns

Each loads randomly via `useMemo` so it's different every session.

## Difficulty Selection
Move difficulty to a quick selector AFTER the door knock (small modal or bottom sheet),
or encode it into the door type (suburban = easy, fancy = hard).

## Technical Notes
- Door components are pure CSS/SVG — no images needed
- Knock sound: short MP3, played via `new Audio()` in the click handler
- `getUserMedia` called in same synchronous click handler stack
- Works on Safari, Chrome, Firefox mobile
