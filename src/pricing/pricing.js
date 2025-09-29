// ---- BASE PRICE TABLES ------------------------------------------------------
export const DRIVEWAY_PRICES = {
    1: 180, 2: 230, 3: 275, 4: 320, 5: 365, 6: 410, 7: 455, 8: 500, 9: 550, 10: 600
}
export const GARAGE_PRICES = {
    1: 130, 2: 170, 3: 210, 4: 250, 5: 290, 6: 330, 7: 370, 8: 410, 9: 480, 10: 550
}
export const DRIVEWAY_TREATMENT_PRICES = {
    1: 200, 2: 245, 3: 290, 4: 335, 5: 380, 6: 425, 7: 470, 8: 515, 9: 560, 10: 600
}
export const GARAGE_TREATMENT_PRICES = {
    1: 175, 2: 245, 3: 315, 4: 385, 5: 455, 6: 525, 7: 595, 8: 665, 9: 730, 10: 800
}

export const SIZE_OPTIONS = Array.from({ length: 11 }, (_, i) => i).map(v => ({
    value: v, label: v === 0 ? 'None' : `${v}-car`
}))

export const ADDON_FLAGS = [
    'Oil / Grease', 'Rust', 'Hard water / Calcium', 'Paint / Graffiti',
    'Mold', 'Asphalt / Tar', 'Battery acid', 'Gum'
]

// helpers for driveway/garage price lookup
export const getDrivewayPrice = size => (DRIVEWAY_PRICES[size] || 0)
export const getGaragePrice = size => (GARAGE_PRICES[size] || 0)
export const getDrivewayTreatmentPrice = size => (DRIVEWAY_TREATMENT_PRICES[size] || 0)
export const getGarageTreatmentPrice = size => (GARAGE_TREATMENT_PRICES[size] || 0)

// ---- GENERIC HELPERS --------------------------------------------------------
const range = (start, end, step) => {
    const out = []
    for (let v = start; v <= end; v += step) out.push(v)
    return out
}
const round5 = (v) => Math.round(v / 5) * 5

// ---- HOUSE EXTERIOR (1 and 2 story) ----------------------------------------
export const HOUSE_BUCKETS = range(1500, 5000, 500) // upper bounds
const HOUSE_LAST_IDX = HOUSE_BUCKETS.length - 1

const HOUSE_1STORY = { min: 280, max: 950 }
const HOUSE_2STORY = { min: 350, max: 1200 }

export function getHouseExteriorPrice(stories /* 1|2 */, upToSqft) {
    const idx = Math.max(0, HOUSE_BUCKETS.indexOf(upToSqft))
    const r = stories === 2 ? HOUSE_2STORY : HOUSE_1STORY
    const val = r.min + (r.max - r.min) * (idx / HOUSE_LAST_IDX)
    return round5(val)
}

export const HOUSE_OPTIONS = HOUSE_BUCKETS.map((ub, i) => ({
    value: ub,
    label: i === 0 ? `<= ${ub} sqft` : `${HOUSE_BUCKETS[i - 1] + 1}-${ub} sqft`
}))

// ---- ROOF CLEANING (1 and 2 story) -----------------------------------------
export const ROOF_BUCKETS = HOUSE_BUCKETS
const ROOF_LAST_IDX = ROOF_BUCKETS.length - 1

const ROOF_1STORY = { min: 420, max: 1450 }
const ROOF_2STORY = { min: 700, max: 2400 }

export function getRoofCleaningPrice(stories /* 1|2 */, upToSqft) {
    const idx = Math.max(0, ROOF_BUCKETS.indexOf(upToSqft))
    const r = stories === 2 ? ROOF_2STORY : ROOF_1STORY
    const val = r.min + (r.max - r.min) * (idx / ROOF_LAST_IDX)
    return round5(val)
}

export const ROOF_OPTIONS = HOUSE_OPTIONS

// ---- PATIO (ground and balcony) --------------------------------------------
export const PATIO_GROUND_BUCKETS = range(250, 5000, 250)
export const PATIO_BALCONY_BUCKETS = range(250, 3000, 250)

const PG_LAST = PATIO_GROUND_BUCKETS.length - 1
const PB_LAST = PATIO_BALCONY_BUCKETS.length - 1

const PATIO_GROUND_RANGE = { min: 180, max: 1100 } // 250-5000 sqft
const PATIO_BALCONY_RANGE = { min: 230, max: 775 }  // 250-3000 sqft

export function getPatioGroundPrice(upToSqft) {
    const idx = Math.max(0, PATIO_GROUND_BUCKETS.indexOf(upToSqft))
    const val = PATIO_GROUND_RANGE.min +
        (PATIO_GROUND_RANGE.max - PATIO_GROUND_RANGE.min) * (idx / PG_LAST)
    return round5(val)
}
export function getPatioBalconyPrice(upToSqft) {
    const idx = Math.max(0, PATIO_BALCONY_BUCKETS.indexOf(upToSqft))
    const val = PATIO_BALCONY_RANGE.min +
        (PATIO_BALCONY_RANGE.max - PATIO_BALCONY_RANGE.min) * (idx / PB_LAST)
    return round5(val)
}

export const PATIO_GROUND_OPTIONS = PATIO_GROUND_BUCKETS.map((ub, i) => ({
    value: ub,
    label: i === 0 ? `<= ${ub} sqft` : `${PATIO_GROUND_BUCKETS[i - 1] + 1}-${ub} sqft`
}))
export const PATIO_BALCONY_OPTIONS = PATIO_BALCONY_BUCKETS.map((ub, i) => ({
    value: ub,
    label: i === 0 ? `<= ${ub} sqft` : `${PATIO_BALCONY_BUCKETS[i - 1] + 1}-${ub} sqft`
}))

// ===== WINDOW WASHING PRICING ===============================================
// Uses same sqft buckets as house/roof: 1500..5000 step 500
export const WINDOW_BUCKETS = range(1500, 5000, 500)
const WINDOW_LAST_IDX = WINDOW_BUCKETS.length - 1

// Variants and their min/max across the sqft range
export const WINDOW_VARIANTS = {
    // Solid pane
    solid_ext_1: { label: 'Solid Pane - Exterior Only (1 Story)', min: 125, max: 300 },
    solid_inext_1: { label: 'Solid Pane - Interior & Exterior (1 Story)', min: 250, max: 600 },
    solid_ext_2: { label: 'Solid Pane - Exterior Only (2 Story)', min: 180, max: 350 },
    solid_inext_2: { label: 'Solid Pane - Interior & Exterior (2 Story)', min: 350, max: 700 },
    // French pane
    french_ext_1: { label: 'French Pane - Exterior Only (1 Story)', min: 180, max: 625 },
    french_inext_1: { label: 'French Pane - Interior & Exterior (1 Story)', min: 350, max: 1250 },
    french_ext_2: { label: 'French Pane - Exterior Only (2 Story)', min: 200, max: 550 },
    french_inext_2: { label: 'French Pane - Interior & Exterior (2 Story)', min: 400, max: 1100 }
}

export const WINDOW_SIZE_OPTIONS = WINDOW_BUCKETS.map((ub, i) => ({
    value: ub,
    label: (i === 0) ? ('<= ' + ub + ' sqft') : ((WINDOW_BUCKETS[i - 1] + 1) + '-' + ub + ' sqft')
}))

export function getWindowPrice(variantKey, upToSqft) {
    const cfg = WINDOW_VARIANTS[variantKey]
    if (!cfg) return 0
    const idx = Math.max(0, WINDOW_BUCKETS.indexOf(upToSqft))
    const val = cfg.min + (cfg.max - cfg.min) * (idx / WINDOW_LAST_IDX)
    return round5(val)
}

// Screen add-ons by count
export const BUG_SCREEN_COUNTS = range(1, 30, 1)
export const SOLAR_SCREEN_COUNTS = range(1, 30, 1)
export const SCREEN_DOOR_COUNTS = range(1, 10, 1)

// Linear ranges with cents; keep two decimals
function lerpCount(minPrice, maxPrice, count, maxCount) {
    if (!count) return 0
    const t = (count - 1) / (maxCount - 1)
    const val = minPrice + (maxPrice - minPrice) * t
    return Math.round(val * 100) / 100
}

export function getBugScreenPrice(count) {
    return lerpCount(6.50, 200.00, count, 30)
}
export function getSolarScreenPrice(count) {
    return lerpCount(9.00, 180.00, count, 30)
}
export function getScreenDoorPrice(count) {
    return lerpCount(11.50, 100.00, count, 10)
}

// ===== SOLAR PANEL PRICING ==================================================
// Buckets: "up to N panels", from 20 to 100 step 10
export const PANEL_BUCKETS = range(20, 100, 10)
const PANEL_LAST_IDX = PANEL_BUCKETS.length - 1

const PANEL_1STORY = { min: 190, max: 950 }   // up to 20 -> 100 panels
const PANEL_2STORY = { min: 225, max: 1200 }  // up to 20 -> 100 panels

export const PANEL_OPTIONS = PANEL_BUCKETS.map((ub) => ({
    value: ub,
    label: 'up to ' + ub + ' panels'
}))

export function getPanelPrice(stories /* 1|2 */, upToPanels) {
    const idx = Math.max(0, PANEL_BUCKETS.indexOf(upToPanels))
    const r = (stories === 2) ? PANEL_2STORY : PANEL_1STORY
    const val = r.min + (r.max - r.min) * (idx / PANEL_LAST_IDX)
    return round5(val)
}

export const BIRD_DROPPING_FEE = 150
