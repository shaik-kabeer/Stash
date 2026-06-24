# RewardOS — Data Requirements

> Generated: 2026-06-24

---

## Currently Seeded Data

| Dataset | Records | Source |
|---------|---------|--------|
| Banks | 6 | seed-normalized.mts |
| Cards | 8 | seed-normalized.mts |
| Benefits | ~88 | seed-normalized.mts (11 categories × 8 cards) |
| Reward Programs | 8 normalized + 7 legacy | seed files |
| Redemption Options | ~16 | seed-normalized.mts |
| Transfer Partners | ~8 | seed-normalized.mts |
| Offers | ~24 | seed-normalized.mts |
| BINs | ~8 normalized + legacy | seed files |
| Users | 2 | seed.mts |

---

## Missing Datasets

### 1. Banks (Expanded)
**Currently:** HDFC, Axis, SBI, ICICI, IDFC FIRST, AU
**Missing:** Kotak, YES, IndusInd, RBL, Standard Chartered, HSBC, Amex, Federal, BoB, Canara, PNB, Union

| Source | URL | Method |
|--------|-----|--------|
| RBI Card Issuer List | https://www.rbi.org.in | Manual curation |
| Bank websites | Various | Crawl pipeline |

### 2. Cards (Expanded)
**Currently:** 8 cards across 6 banks
**Target:** 50-100 popular Indian credit cards

| Bank | Priority Cards | Source URL | Method |
|------|---------------|------------|--------|
| HDFC | Regalia, Infinia, Millennia, Diners Black | https://www.hdfcbank.com/personal/pay/cards/credit-cards | Listing crawl |
| Axis | Atlas, Magnus, Ace, Flipkart | https://www.axisbank.com/retail/cards/credit-card | Listing crawl |
| SBI | Elite, SimplyCLICK, Cashback | https://www.sbicard.com/en/personal/credit-cards.page | Listing crawl |
| ICICI | Amazon Pay, Sapphiro, Coral | https://www.icicibank.com/credit-card | Listing crawl |
| Kotak | 811, League Platinum | https://www.kotak.com/en/personal-banking/cards/credit-cards.html | Listing crawl |
| Amex | Platinum, Gold, MRCC | https://www.americanexpress.com/in/credit-cards/ | Listing crawl |
| IndusInd | Legend, Pinnacle | https://www.indusind.com/in/en/personal/cards/credit-card.html | Listing crawl |

### 3. Reward Program Valuations
**Currently:** Computed at runtime from `RedemptionOption.conversionRate`
**Missing:** Dedicated valuation table with travel/hotel multipliers

| Program | Valuation Source | Method |
|---------|-----------------|--------|
| HDFC Reward Points | https://hdfcbanksmartbuy.com | Manual research |
| Axis EDGE Rewards | https://edgerewards.axisbank.co.in | Manual research |
| SBI Reward Points | https://www.sbicard.com/en/personal/rewards.page | Manual research |
| Amex Membership Rewards | https://global.americanexpress.com/rewards | Manual research |
| InterMiles | https://www.intermiles.com | Manual research |
| Air India Flying Returns | https://www.airindia.com/in/en/fly-returns.html | Manual research |
| Marriott Bonvoy | https://www.marriott.com/loyalty.mi | Manual research |
| ITC Hotels | https://www.itchotels.com | Manual research |

### 4. Merchant Category Codes (MCC)
**Currently:** No structured MCC data; benefits use free-text categories
**Required for:** Accurate best-card recommendations per merchant

| Source | URL | Method |
|--------|-----|--------|
| ISO 18245 MCC List | Public datasets | Import CSV |
| Visa Merchant Categories | https://usa.visa.com/content/dam/VCOM/download/merchants/visa-merchant-data-standards-manual.pdf | PDF parse |

### 5. Transfer Partner Programs
**Currently:** 8 partners seeded
**Missing:** Complete airline/hotel loyalty program details

| Program | Source | Method |
|---------|--------|--------|
| Vistara Club Vistara → Air India | https://www.airindia.com | Manual |
| Singapore Airlines KrisFlyer | https://www.singaporeair.com | Manual |
| Hilton Honors | https://www.hilton.com/en/hilton-honors/ | Manual |
| IHG Rewards | https://www.ihg.com/rewardsclub | Manual |
| Accor Live Limitless | https://all.accor.com | Manual |

### 6. Deep Link / Redemption Portal URLs
**Currently:** 6 banks in `redeem-links.ts`
**Missing:** Program-specific redemption URLs for remaining banks

| Bank | Portal | URL |
|------|--------|-----|
| Kotak | Kotak Rewards | https://www.kotak.com/en/personal-banking/cards/credit-cards/rewards.html |
| IndusInd | Reward Points | https://www.indusind.com/in/en/personal/cards/credit-card/rewards.html |
| RBL | RBL Rewards | https://www.rblbank.com/credit-cards/rewards |
| YES | YES Rewards | https://www.yesbank.in/personal-banking/yes-rewards |
| Amex | Amex Rewards | https://global.americanexpress.com/rewards |

---

## Data Acquisition Priority

| Priority | Dataset | Impact | Effort |
|----------|---------|--------|--------|
| P0 | More cards (top 30) | Core product value | Medium (crawl pipeline ready) |
| P0 | Reward valuations | Valuation accuracy | Low (research + seed) |
| P1 | Transfer partners | Optimization quality | Low (research + seed) |
| P1 | Merchant categories | Best-card accuracy | Medium (import MCC data) |
| P2 | Deep link URLs | Redemption UX | Low (manual curation) |
| P2 | Expanded banks | Coverage | Low (add to seed) |
