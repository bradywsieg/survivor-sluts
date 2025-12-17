# Survivor Fantasy League Design Guidelines

## Design Approach

**Reference-Based: Survivor/Adventure Theme**
This app draws inspiration from the Survivor TV show aesthetic - tropical, adventurous, and engaging while maintaining functionality for score tracking. Think rustic wooden textures, tropical motifs, and bold adventure-game interfaces combined with clean data visualization patterns from apps like ESPN Fantasy and Yahoo Sports.

**Core Principles:**
- Adventure aesthetics meet data clarity
- Bold, readable typography suitable for game statistics
- Visual hierarchy that makes standings and scores instantly scannable
- Playful tropical elements without compromising usability

## Typography

**Font Families:**
- **Headings**: Montserrat Bold (Google Fonts) - strong, adventurous feel for titles and team names
- **Body/Data**: Inter (Google Fonts) - excellent readability for tables, scores, and contestant names
- **Accent**: Permanent Marker (Google Fonts) - sparingly for special callouts or "tribal" elements

**Hierarchy:**
- Page Titles: text-4xl md:text-5xl font-bold
- Section Headers: text-2xl md:text-3xl font-bold
- Team/Contestant Names: text-xl font-semibold
- Scores/Stats: text-lg md:text-xl font-medium
- Body Text: text-base
- Labels: text-sm font-medium uppercase tracking-wide

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-8, space-y-12, gap-6
- Card gaps: gap-4, gap-6
- Button padding: px-6 py-3, px-8 py-4

**Container Strategy:**
- Main container: max-w-7xl mx-auto px-4 md:px-6
- Dashboard grid: 2-column on desktop (standings + charts), stack on mobile
- Data tables: full-width with horizontal scroll on mobile

## Component Library

**Navigation:**
Top navbar with logo/title left, main nav links center/right. Sticky on scroll. Height: h-16. Links: text-sm font-medium uppercase tracking-wide.

**Dashboard Layout:**
Hero banner area with tropical image featuring app title overlay (h-64 md:h-80) - image shows tropical island/beach scene with palm trees. Below hero: 2-column grid (lg:grid-cols-2 gap-8) containing standings table and charts.

**Cards:**
- Rounded corners: rounded-lg
- Shadow: shadow-md hover:shadow-lg transition
- Padding: p-6
- Border treatment: border-2 for emphasis on key cards
- Team/contestant cards: Include image thumbnail (aspect-square, rounded-full for contestants, rounded-lg for teams) + name + stats

**Standings Table:**
- Striped rows for readability (even rows with subtle background)
- Rank column: Bold, larger text (text-xl font-bold)
- Team name with image: Flex layout with avatar (w-10 h-10 rounded-full)
- Points: Right-aligned, text-lg font-semibold
- Sticky header on scroll

**Charts:**
- Use Chart.js via CDN for line and bar charts
- Chart containers: bg-white rounded-lg shadow p-6
- Minimum height: h-80
- Grid lines: subtle, minimal
- Legend: bottom placement
- Responsive: reduce height on mobile (h-64)

**Forms (Team/Contestant Management):**
- 2-column layout on desktop (form + preview), stack on mobile
- Input groups: space-y-4
- Labels: text-sm font-medium mb-2 block
- Inputs: w-full px-4 py-3 rounded-lg border-2
- Image upload: Dropzone-style area (border-dashed border-2 p-8 rounded-lg text-center) with preview
- Action buttons: Full-width on mobile, inline on desktop

**Weekly Scoring Entry:**
- Week selector: Dropdown at top (select element, px-4 py-3 rounded-lg)
- Scoring grid: Table layout with contestant name, current score input, team bonus input
- Input fields: Numeric, width: w-24, text-center
- Submit button: Large, prominent (w-full md:w-auto px-12 py-4)

**Buttons:**
- Primary: px-6 py-3 rounded-lg font-semibold text-base shadow-md
- Secondary: px-6 py-3 rounded-lg font-medium border-2
- Icon buttons: p-3 rounded-full (for edit/delete actions)
- Hover states: scale-105 transition-transform

**Badges/Tags:**
For contestant status (active/eliminated): Inline rounded-full px-3 py-1 text-xs font-bold

## Images

**Hero Image:**
Large banner image (h-64 md:h-80) at top of dashboard showing tropical beach scene with palm trees, ocean, and sandy beach. Text overlay with app title "Survivor Fantasy League" in large bold text with semi-transparent dark overlay for readability.

**Team Images:**
User-uploaded, displayed as rounded-lg cards (aspect-video or aspect-square). Default placeholder: tropical icon or team number.

**Contestant Images:**
User-uploaded, displayed as rounded-full avatars (w-16 h-16 in tables, w-24 h-24 in detail views). Default placeholder: generic silhouette.

**Decorative Elements:**
Palm tree silhouettes or tropical patterns as subtle background elements in headers/footers. Use sparingly - maintain data clarity.