import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, 'garden.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS seeds (
    id                        TEXT PRIMARY KEY,
    plantType                 TEXT NOT NULL,
    category                  TEXT NOT NULL,
    seasons                   TEXT NOT NULL DEFAULT '[]',
    variety                   TEXT NOT NULL,
    status                    TEXT NOT NULL DEFAULT 'In Stock',
    dateAdded                 TEXT,
    vendor                    TEXT NOT NULL,
    itemNumber                TEXT,
    link                      TEXT,
    maturityDays              TEXT,
    harvestType               TEXT,
    springSowLeadWeeks        TEXT,
    springTransplantLeadWeeks TEXT,
    fallSowLeadWeeks          TEXT,
    preferredSowingType       TEXT,
    successionWeeks           TEXT,
    anticipatedHeight         TEXT,
    recommendedSpacing        TEXT,
    hrsSun                    TEXT,
    notes                     TEXT
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS sowing_events (
    id              TEXT PRIMARY KEY,
    seedId          TEXT NOT NULL REFERENCES seeds(id),
    actualSowDate   TEXT NOT NULL,
    emergenceDate   TEXT,
    transplantDate  TEXT,
    sowingMethod    TEXT NOT NULL,
    sowingContainer TEXT,
    sowingStatus    TEXT NOT NULL DEFAULT 'Active',
    notes           TEXT
  )
`)

export default db
