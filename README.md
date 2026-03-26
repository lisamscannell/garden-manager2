# Garden Manager

A personal vegetable garden management app for tracking seed inventory, sowing events, and daily planting tasks. Built for New Boston, MI but works for any location.

---

## Table of Contents

1. [Running the App](#running-the-app)
2. [My Garden](#my-garden)
3. [Seed Inventory](#seed-inventory)
4. [Seed Starts](#seed-starts)
5. [Daily Tasks](#daily-tasks)
6. [Key Concepts](#key-concepts)
7. [How It All Connects](#how-it-all-connects)

---

## Running the App

**Development (local):**
```
.\restart.ps1
```
Then open `http://localhost:5173` in your browser.

**First time setup:**
```
npm install
.\restart.ps1
```

See [DEPLOY.md](DEPLOY.md) for production deployment to a Digital Ocean server.

---

## My Garden

**Navigation: 🌿 My Garden**

This is the settings and weather hub for the app. Everything else — task calculations, sowing schedules, transplant windows — is driven by the dates you set here.

### Weather Card
When a zip code is saved, the app automatically fetches current conditions from the free wttr.in weather service. Displays:
- Current temperature (°F)
- Weather description
- Today's high and low
- Total precipitation over the last 7 days (sourced from Open-Meteo historical archive)
- 3-day precipitation forecast

### Garden Settings
| Field | Description |
|---|---|
| **Zip Code** | Used to fetch weather. 5-digit US zip. |
| **Average Last Frost Date** | The last date you typically get frost in spring. Drives all spring/summer sowing calculations. For New Boston MI: ~May 10. |
| **Average First Frost Date** | The first date you typically get frost in fall. Drives all fall sowing calculations. For New Boston MI: ~Oct 14. |

Click **Save Garden Settings** to persist. Settings are saved to the database and will be the same across all devices (phone, laptop, etc.).

### Days Until Last Frost Banner
Shows a live countdown to your last frost date. Rolls to next year automatically once the current year's date has passed.

---

## Seed Inventory

**Navigation: 📦 Seeds**

A catalog of all your seed packets. Each packet stores everything you need to know about a seed variety — what it is, where you got it, and how to grow it.

### Browsing Seeds
- **Category buttons** (Edible / Flower / Foliage) filter the list by plant category.
- **Season buttons** (All / Spring / Summer / Fall) filter further by which seasons the seed is used for.
- Seeds are sorted alphabetically by Plant Type, then Variety.
- Seeds with **Gone** status are hidden by default. A button at the bottom shows how many are hidden and lets you reveal them.

### Adding a Seed Packet
Click **+ Add** in the top right. Fill in the fields across four sections:

**About This Packet**
| Field | Description |
|---|---|
| Plant Type | Category of plant (Beans, Tomatoes, Herbs, etc.) |
| Category | Edible, Flower, or Foliage |
| Variety | The specific variety name (e.g. Cherokee Purple) |
| Season | Check all seasons this seed is grown in. Used by Daily Tasks to determine when to prompt for sowing. |

**Purchase Info**
| Field | Description |
|---|---|
| Vendor | Where you purchased the seed |
| Item # | Vendor's item or catalog number |
| Link | URL to the product page — shows an **Open ↗** link when filled in |
| Date Added | When you added it to inventory |
| Status | **In Stock**, **Low**, or **Gone** |

**Growing Details**
| Field | Description |
|---|---|
| Maturity Days | Days from transplant/sow to harvest |
| Harvest Type | Once (one harvest) or Recurring (keep picking) |
| Preferred Sowing Type | Indoor Trays, Outdoor Trays, or Direct |
| Hrs Sun | Hours of sun required per day |
| Spring Sow Lead Weeks | Weeks before last frost to start indoors. Used by "What needs starting?" |
| Spring Transplant Lead Weeks | Weeks before last frost to transplant outdoors. Used by "Upcoming Transplants." |
| Fall Sow Lead Weeks | Weeks before first frost to start fall crops. Used by "What needs starting?" |
| Succession Weeks | How many weeks between succession plantings. Used by "What needs starting?" |
| Anticipated Height | Expected mature height |
| Recommended Spacing | Spacing between plants |

**Notes**
Free-text notes about the variety.

### Editing a Seed Packet
Tap any seed in the list to open its detail view. Edit any field and tap **Save Changes**. The category filter will automatically switch to match the updated category so the seed stays visible.

### Current Sowings
At the bottom of a seed's detail view, any active sowing events for that seed are listed. Tap one to open it.

### New Sowing Event
The **🌱 New Sowing Event** button on the seed detail view opens the sowing event form pre-filled with that seed's context. See [Seed Starts](#seed-starts).

### Importing Seeds via CSV
If you have seed data in a spreadsheet, you can bulk-import it:
1. Click **Download Template** to get a CSV with the correct column headers.
2. Fill in your spreadsheet using those headers (one seed per row).
3. Click **Import CSV** and select your file.

Seasons should be separated by semicolons in the CSV (e.g. `Spring;Summer`).

---

## Seed Starts

**Navigation: 🌱 Starts**

Tracks individual sowing events — each time you actually plant (or plan to plant) a seed. One seed packet can have multiple sowing events across a season.

### Creating a Sowing Event
From any seed packet's detail view, tap **🌱 New Sowing Event**. You can also click through from the Daily Tasks page.

**Sowing Details Form**
| Field | Description |
|---|---|
| Planned Sow Date | When you intend to sow. Hidden once an Actual Sow Date is set. Auto-sets status to Anticipated (future) or Active (today/past). |
| Actual Sow Date | The date you actually sowed. Hides the Planned Date field once filled in. |
| Sowing Method | Indoor Tray, Outdoor Tray, or Direct Sow |
| Sowing Container | Cell Pack, Soil Block, Milk Jug Greenhouse, or Other |
| Status | Anticipated, Active, Transplanted, Completed, Failed, or Cancelled |
| Emergence Date | Date seedlings emerged |
| Transplant Date | Date transplanted outdoors |
| Notes | Free-text notes |

**Calculate from Frost Date**: If the seed has Spring Sow Lead Weeks set and a frost date is saved in My Garden, a button appears to automatically calculate the recommended planned sow date.

### Event Groups
Sowing events are organized into groups:

| Group | What Shows |
|---|---|
| **Watch for Emergence** | Active events with no emergence date yet |
| **Active Starts (Indoors)** | Active events with emergence date, not transplanted, method = Indoor Tray |
| **Active Starts (Outdoors)** | Active events with emergence date, not transplanted, method = Outdoor Tray or Direct Sow |
| **Starts in Ground** | Events with a transplant date set |
| **Anticipated Starts** | Events in Anticipated status (planned for the future) |

Failed, Cancelled, and Completed events are hidden by default. A toggle at the bottom reveals them.

Tap any event card to open and edit it.

### Tasks on a Sowing Event
When viewing a sowing event, you can add ad-hoc tasks at the bottom of the form. See [Garden Tasks](#garden-tasks) below.

---

## Daily Tasks

**Navigation: 📋 Tasks**

The Daily Tasks screen pulls together everything that needs attention right now, calculated from your seed data, sowing events, and frost dates.

### Starts Planned This Week
Sowing events that have a planned sow date but no actual sow date yet, due today, in the past (overdue), or within the next 3 days. Tap to open the event and record the actual sow date once done.

| Badge | Meaning |
|---|---|
| Today | Planned for today |
| Overdue | Planned date has passed, still not sown |
| (date) | Upcoming within 3 days |

### Garden Tasks
Ad-hoc tasks you've created on sowing events, filtered to Pending status and sorted by due date. Tap to open and update.

**Creating a task:** Open any sowing event (from Starts or from a seed packet), scroll to the bottom, and tap **+ Add Task**.

| Field | Description |
|---|---|
| Category | Pot Up, Prune, Fertilize, or Other |
| Description | Required when category is Other |
| Notes | Optional free-text |
| Due Date | Defaults to today |
| Status | Pending (default), Completed, or Cancelled |

| Badge | Meaning |
|---|---|
| Today | Due today |
| Overdue | Due date has passed |
| (date) | Upcoming |

Marking a task Completed or Cancelled removes it from this list.

### Upcoming Transplants
Active sowing events (non-Direct-Sow) whose calculated transplant window falls within the next 7 days.

Calculated as: `Last Frost Date − Spring Transplant Lead Weeks`

Tap an event to open it and record the actual transplant date when done.

### What Needs Starting?
Tap **Check now** to run an analysis across your seed inventory. Shows seeds that are due (or overdue) to be started, based on three rules:

**Spring/Summer seeds** (Season includes Spring or Summer):
- Uses `Spring Sow Lead Weeks` and the Last Frost Date
- Appears when `Lead Weeks > Weeks Until Last Frost` (i.e., it's time to start or you're behind)
- Excluded if the seed already has an active/anticipated sowing event this year

**Fall seeds** (Season includes Fall):
- Uses `Fall Sow Lead Weeks` and the First Frost Date for the *current year*
- Appears when `Lead Weeks > Weeks Until First Frost`
- Excluded if the seed has an active/anticipated fall sowing event (after July 1) this year
- Stops appearing once the first frost date has passed

**Succession starts** (Succession Weeks is set):
- Appears when the time since the last *actual* sow date exceeds `Succession Weeks`
- Only shown if the first frost date has not passed yet (growing season still active)

| Badge | Meaning |
|---|---|
| Xw lead | Weeks of lead time this seed requires |
| Xw overdue | How far past the ideal start date you are |
| Due now | Right at the ideal start date |
| Fall | Fall crop (uses first frost date) |
| Succession | A follow-up planting for an already-started seed |

Tap any seed to open its detail view and create a new sowing event.

---

## Key Concepts

### Frost Dates
Your two anchor dates for the entire planting calendar:
- **Last Frost (spring):** The last date you expect frost before summer. Seeds are started indoors a certain number of weeks *before* this date, so they're ready to transplant once frost risk has passed.
- **First Frost (fall):** The first date you expect frost in autumn. Fall crops are direct-sown a certain number of weeks *before* this date so they mature before the cold kills them.

### Lead Weeks
The number of weeks before a frost date that a seed should be started. Example: tomatoes have an 8-week spring sow lead, meaning start them 8 weeks before your last frost date.

### Succession Planting
Growing the same crop in multiple batches, spaced a few weeks apart, so you have a continuous harvest rather than everything coming in at once. If a seed has **Succession Weeks = 3**, a new sowing event should be created every 3 weeks throughout the season.

### Sowing Status Flow
```
Anticipated → Active → Transplanted → Completed
                     ↘ Failed
                     ↘ Cancelled
```
- **Anticipated**: Planned for the future, not yet sown
- **Active**: Currently growing (indoors or outdoors)
- **Transplanted**: Moved to the ground
- **Completed**: Season over, crop finished
- **Failed / Cancelled**: Did not proceed

---

## How It All Connects

```
My Garden
  └─ Last Frost Date & First Frost Date
        │
        ├─ Seed Inventory (Spring/Fall Sow Lead Weeks, Transplant Lead Weeks)
        │       │
        │       └─ Seed Starts (Sowing Events)
        │               │
        │               └─ Tasks (ad-hoc per event)
        │
        └─ Daily Tasks
                ├─ Starts Planned This Week  ← from Sowing Events with plannedSowDate
                ├─ Garden Tasks              ← from Tasks table (Pending)
                ├─ Upcoming Transplants      ← Frost Date − Transplant Lead Weeks
                └─ What Needs Starting?      ← Frost Date − Sow Lead Weeks vs. today
```

The app is designed so that once your seed packets are set up with the right lead week values and your frost dates are saved, the Daily Tasks page tells you what to do each day without having to calculate anything yourself.
