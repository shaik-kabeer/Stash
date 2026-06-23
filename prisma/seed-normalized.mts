import { createSeedClient } from "./seed-client.mjs";

const prisma = await createSeedClient();

const BANKS = [
  { id: "bank_hdfc",  name: "HDFC Bank",             code: "HDFC",  website: "https://www.hdfcbank.com" },
  { id: "bank_axis",  name: "Axis Bank",             code: "AXIS",  website: "https://www.axisbank.com" },
  { id: "bank_sbi",   name: "SBI Card",              code: "SBI",   website: "https://www.sbicard.com" },
  { id: "bank_icici", name: "ICICI Bank",            code: "ICICI", website: "https://www.icicibank.com" },
  { id: "bank_idfc",  name: "IDFC FIRST Bank",       code: "IDFC",  website: "https://www.idfcfirstbank.com" },
  { id: "bank_au",    name: "AU Small Finance Bank", code: "AU",    website: "https://www.aubank.in" },
];

interface CardSeed {
  id: string; bankId: string; name: string; network: string; tier?: string;
  annualFee: number; joiningFee: number; color: string;
  bestFor: string; worstFor: string; estimatedAnnualValue: number;
  bins: { bin: string; tier?: string }[];
  benefits: { category: string; title: string; description: string; terms?: string; valueEstimate?: number }[];
  program: {
    name: string; pointName: string; earnRate: string; earnDescription?: string; expiryMonths?: number;
    redemptions: { name: string; type: string; conversionRate: number; minPoints?: number; description?: string; estimatedCPP?: number }[];
    transfers: { partnerName: string; partnerType: string; transferRatio: string; transferFee?: number; transferTime?: string }[];
  };
  offers: { title: string; merchant?: string; discountType?: string; discountValue?: string; terms?: string }[];
}

const CARDS: CardSeed[] = [
  {
    id: "card_hdfc_regalia_gold", bankId: "bank_hdfc", name: "HDFC Regalia Gold", network: "Visa", tier: "platinum",
    annualFee: 2500, joiningFee: 2500, color: "#004B87", estimatedAnnualValue: 15000,
    bestFor: "Frequent online shoppers (SmartBuy 10x), domestic travelers needing lounge access, BookMyShow regulars.",
    worstFor: "International travelers (3.5% forex markup), fuel-heavy spenders, high spenders who'd benefit from premium cards.",
    bins: [{ bin: "524130", tier: "platinum" }, { bin: "524131", tier: "platinum" }, { bin: "436583", tier: "platinum" }],
    benefits: [
      { category: "rewards", title: "Reward Points", description: "4 Reward Points per ₹150 spent. 1 RP = ₹0.50. 10x on SmartBuy (flights, hotels, Amazon) = 13.3% return.", valueEstimate: 5000 },
      { category: "lounge", title: "Lounge Access", description: "12 complimentary domestic lounge visits/year via Visa/DreamFolks. 6 international via Priority Pass.", valueEstimate: 3000 },
      { category: "travel", title: "Travel Insurance", description: "Air accident cover ₹50 lakhs. Lost baggage ₹2 lakhs. Trip delay (12+ hrs) ₹10,000.", valueEstimate: 1000 },
      { category: "insurance", title: "Insurance Cover", description: "Air accident ₹1 crore. Zero lost card liability. Purchase protection 90 days.", valueEstimate: 500 },
      { category: "fuel", title: "Fuel Surcharge Waiver", description: "1% fuel surcharge waiver at all stations. Max ₹250/month. ₹400-₹5,000 transactions.", valueEstimate: 1500 },
      { category: "dining", title: "Dining Benefits", description: "Good Food Trail: 15% off at 1,500+ restaurants. Zomato/Swiggy offers periodically.", valueEstimate: 1000 },
      { category: "movie", title: "Movie Benefits", description: "Buy 1 Get 1 on BookMyShow (2 free tickets/month, max ₹250/ticket).", valueEstimate: 2000 },
      { category: "golf", title: "Golf Access", description: "Complimentary golf lessons. 2 rounds per quarter at partner courses.", valueEstimate: 500 },
      { category: "forex", title: "Forex Markup", description: "3.5% markup on foreign currency transactions. Not ideal for international travel.", valueEstimate: 0 },
      { category: "milestone", title: "Milestone Rewards", description: "₹5L spend: 5,000 bonus points. ₹8L: additional 5,000 bonus points.", valueEstimate: 2500 },
      { category: "welcome", title: "Welcome Benefits", description: "2,500 reward points on activation (worth ₹1,250).", valueEstimate: 1250 },
    ],
    program: {
      name: "HDFC Reward Points", pointName: "Reward Points", earnRate: "4 RP per ₹150",
      earnDescription: "Base 4 RP/₹150 on all spends (excl fuel, wallet, EMI). 10x on SmartBuy portal.",
      expiryMonths: 24,
      redemptions: [
        { name: "SmartBuy Vouchers", type: "voucher", conversionRate: 0.50, description: "Redeem for Amazon, Flipkart vouchers via SmartBuy", estimatedCPP: 0.50 },
        { name: "Air Miles Transfer", type: "miles", conversionRate: 0.30, minPoints: 5000, description: "Transfer to InterMiles, Air India", estimatedCPP: 0.30 },
        { name: "Statement Credit", type: "cashback", conversionRate: 0.20, description: "Direct credit to card statement", estimatedCPP: 0.20 },
        { name: "Product Catalog", type: "product", conversionRate: 0.25, description: "Redeem for electronics, lifestyle products", estimatedCPP: 0.25 },
      ],
      transfers: [
        { partnerName: "InterMiles", partnerType: "airline", transferRatio: "2:1", transferTime: "2-5 days" },
        { partnerName: "Air India Maharaja Club", partnerType: "airline", transferRatio: "3:1", transferTime: "3-7 days" },
        { partnerName: "Marriott Bonvoy", partnerType: "hotel", transferRatio: "5:2", transferFee: 100, transferTime: "5-10 days" },
      ],
    },
    offers: [
      { title: "SmartBuy 10x on Amazon/Flipkart", merchant: "Amazon, Flipkart", discountType: "points_multiplier", discountValue: "10x points", terms: "Max 5,000 points/month" },
      { title: "Milestone Bonus 10K Points", merchant: "All merchants", discountType: "bonus_points", discountValue: "10,000 points on ₹8L spend" },
      { title: "0% EMI on ₹10K+ Purchases", discountType: "emi", discountValue: "0% for 3 months" },
    ],
  },
  {
    id: "card_hdfc_millennia", bankId: "bank_hdfc", name: "HDFC Millennia", network: "Mastercard", tier: "classic",
    annualFee: 1000, joiningFee: 1000, color: "#1A1A2E", estimatedAnnualValue: 8000,
    bestFor: "Young professionals spending on food delivery, online shopping, and entertainment.",
    worstFor: "Heavy offline spenders, international travelers, users wanting premium travel benefits.",
    bins: [{ bin: "524028" }, { bin: "524029" }],
    benefits: [
      { category: "rewards", title: "CashBack Rewards", description: "5% on Amazon, Flipkart, Myntra, Swiggy, Zomato, BookMyShow, Uber (cap ₹750/mo). 1% other online. 2.5% tap-and-pay.", valueEstimate: 5000 },
      { category: "lounge", title: "Lounge Access", description: "8 complimentary domestic lounge visits/year via DreamFolks.", valueEstimate: 2000 },
      { category: "fuel", title: "Fuel Surcharge", description: "1% fuel surcharge waiver (max ₹250/month).", valueEstimate: 500 },
      { category: "dining", title: "Dining Benefits", description: "5% CashBack on Swiggy and Zomato within cap.", valueEstimate: 2000 },
      { category: "movie", title: "Movie Benefits", description: "5% CashBack on BookMyShow within cap.", valueEstimate: 500 },
      { category: "forex", title: "Forex Markup", description: "3.5% on international transactions.", valueEstimate: 0 },
      { category: "welcome", title: "Welcome Benefits", description: "1,000 CashPoints on first spend within 30 days.", valueEstimate: 1000 },
    ],
    program: {
      name: "HDFC CashBack Points", pointName: "CashPoints", earnRate: "5% on preferred merchants",
      earnDescription: "5% on Amazon/Flipkart/Swiggy/Zomato (cap ₹750/mo). 1% other online. 2.5% contactless.",
      expiryMonths: 12,
      redemptions: [
        { name: "Statement Credit", type: "cashback", conversionRate: 1.0, description: "Auto-credited to statement", estimatedCPP: 1.0 },
      ],
      transfers: [],
    },
    offers: [
      { title: "5% on Amazon Great Indian Festival", merchant: "Amazon", discountType: "cashback", discountValue: "5%" },
      { title: "Swiggy ₹100 off on ₹300+", merchant: "Swiggy", discountType: "flat_discount", discountValue: "₹100 off", terms: "Twice per month" },
    ],
  },
  {
    id: "card_axis_magnus", bankId: "bank_axis", name: "Axis Bank Magnus", network: "Visa", tier: "signature",
    annualFee: 12500, joiningFee: 12500, color: "#97144D", estimatedAnnualValue: 50000,
    bestFor: "Ultra-premium travelers spending ₹15L+/year. Best lounge card in India.",
    worstFor: "Low spenders, purely domestic users, those wanting simple cashback.",
    bins: [{ bin: "414720", tier: "signature" }, { bin: "414721", tier: "signature" }, { bin: "414722", tier: "signature" }],
    benefits: [
      { category: "rewards", title: "EDGE Points", description: "35 EDGE points per ₹200 on travel. 12 EDGE per ₹200 on all other. 1 EDGE ≈ ₹0.50.", valueEstimate: 15000 },
      { category: "lounge", title: "Unlimited Lounge Access", description: "Unlimited domestic + international via Priority Pass for cardholder + guest.", valueEstimate: 15000 },
      { category: "travel", title: "Travel Benefits", description: "Accor Plus Explorer (free night at 1,100+ hotels). Meet & greet. Insurance ₹3 crores. Lost baggage ₹5L.", valueEstimate: 18000 },
      { category: "insurance", title: "Insurance Cover", description: "Air accident ₹3 crores. Emergency overseas medical ₹25 lakhs. Purchase protection 120 days.", valueEstimate: 2000 },
      { category: "fuel", title: "Fuel Surcharge", description: "1% waiver up to ₹500/month.", valueEstimate: 3000 },
      { category: "dining", title: "Dining Delights", description: "20% off at 4,000+ partner restaurants.", valueEstimate: 3000 },
      { category: "movie", title: "Movie Benefits", description: "BOGO on BookMyShow (up to ₹500/ticket, 3 times/month).", valueEstimate: 4000 },
      { category: "golf", title: "Golf Privileges", description: "Complimentary rounds at 20+ courses. 4 green fees per quarter.", valueEstimate: 4000 },
      { category: "forex", title: "Low Forex Markup", description: "2% on foreign currency — among the lowest in India.", valueEstimate: 5000 },
      { category: "milestone", title: "Milestone Rewards", description: "₹15L spend: fee reversal as EDGE Points. ₹25L: additional 25,000 bonus.", valueEstimate: 12500 },
      { category: "welcome", title: "Welcome Benefits", description: "25,000 EDGE Points (worth ₹12,500) + Accor Plus Explorer (worth ₹18,000).", valueEstimate: 30500 },
    ],
    program: {
      name: "Axis EDGE Rewards", pointName: "EDGE Points", earnRate: "12-35 EDGE per ₹200",
      earnDescription: "35 EDGE per ₹200 on travel via EDGE portal. 12 EDGE per ₹200 on all other spends.",
      expiryMonths: 36,
      redemptions: [
        { name: "InterMiles Transfer", type: "miles", conversionRate: 0.50, description: "1:1 transfer to InterMiles", estimatedCPP: 0.50 },
        { name: "Accor Hotel Stay", type: "voucher", conversionRate: 0.40, description: "Redeem for Accor hotel nights", estimatedCPP: 0.40 },
        { name: "Statement Credit", type: "cashback", conversionRate: 0.25, description: "Credit to card statement", estimatedCPP: 0.25 },
        { name: "Flight Booking", type: "miles", conversionRate: 0.50, description: "Book flights on EDGE portal", estimatedCPP: 0.50 },
      ],
      transfers: [
        { partnerName: "InterMiles", partnerType: "airline", transferRatio: "1:1", transferTime: "Instant" },
        { partnerName: "Accor Plus", partnerType: "hotel", transferRatio: "2:1", transferTime: "3-5 days" },
        { partnerName: "Singapore Airlines KrisFlyer", partnerType: "airline", transferRatio: "5:2", transferTime: "5-7 days" },
      ],
    },
    offers: [
      { title: "5x EDGE on Flipkart/Amazon", merchant: "Flipkart, Amazon", discountType: "points_multiplier", discountValue: "5x EDGE", terms: "Limited period" },
      { title: "InterMiles 30% Transfer Bonus", merchant: "InterMiles", discountType: "transfer_bonus", discountValue: "30% bonus miles", terms: "Periodic" },
      { title: "Duty Free 15% Off", merchant: "Delhi/Mumbai Airport Duty Free", discountType: "percentage", discountValue: "15% off" },
    ],
  },
  {
    id: "card_axis_atlas", bankId: "bank_axis", name: "Axis Bank Atlas", network: "Visa", tier: "platinum",
    annualFee: 5000, joiningFee: 5000, color: "#2D3748", estimatedAnnualValue: 25000,
    bestFor: "Mid-range travelers (₹7-15L spend). Great miles card for airline partner transfers.",
    worstFor: "Non-travelers, cashback seekers, those spending under ₹5L/year.",
    bins: [{ bin: "414730" }, { bin: "414731" }],
    benefits: [
      { category: "rewards", title: "EDGE Miles", description: "5 EDGE Miles per ₹100 on travel. 2 per ₹100 on others. 1 EDGE Mile = ₹0.50-₹1.00.", valueEstimate: 8000 },
      { category: "lounge", title: "Lounge Access", description: "8 domestic + 8 international via Priority Pass.", valueEstimate: 5000 },
      { category: "travel", title: "Travel Insurance", description: "Travel insurance ₹1 crore. Lost baggage ₹1 lakh. Flight delay insurance.", valueEstimate: 2000 },
      { category: "fuel", title: "Fuel Surcharge", description: "1% waiver up to ₹400/month.", valueEstimate: 1000 },
      { category: "dining", title: "Dining Delights", description: "15% off at partner restaurants.", valueEstimate: 1500 },
      { category: "movie", title: "Movie Benefits", description: "BOGO on BookMyShow (2 times/month, max ₹300/ticket).", valueEstimate: 2000 },
      { category: "forex", title: "Forex Markup", description: "2.5% on international transactions.", valueEstimate: 2000 },
      { category: "welcome", title: "Welcome Benefits", description: "5,000 EDGE Miles on first spend (worth ₹2,500-₹5,000).", valueEstimate: 5000 },
    ],
    program: {
      name: "Axis EDGE Miles", pointName: "EDGE Miles", earnRate: "2-5 EDGE Miles per ₹100",
      earnDescription: "5 EDGE Miles per ₹100 on travel. 2 on all other.",
      expiryMonths: 36,
      redemptions: [
        { name: "Vistara Transfer", type: "miles", conversionRate: 0.75, description: "Transfer to Vistara ClubVistara", estimatedCPP: 0.75 },
        { name: "Flight Booking", type: "miles", conversionRate: 0.50, description: "Book on EDGE portal", estimatedCPP: 0.50 },
        { name: "Statement Credit", type: "cashback", conversionRate: 0.25, estimatedCPP: 0.25 },
      ],
      transfers: [
        { partnerName: "Vistara ClubVistara", partnerType: "airline", transferRatio: "2:1", transferTime: "3-5 days" },
        { partnerName: "InterMiles", partnerType: "airline", transferRatio: "1:1", transferTime: "Instant" },
      ],
    },
    offers: [
      { title: "Double Miles on International", discountType: "points_multiplier", discountValue: "2x miles on forex" },
      { title: "Vistara 20% Transfer Bonus", merchant: "Vistara", discountType: "transfer_bonus", discountValue: "20% bonus" },
    ],
  },
  {
    id: "card_sbi_cashback", bankId: "bank_sbi", name: "SBI Cashback", network: "Visa", tier: "classic",
    annualFee: 999, joiningFee: 999, color: "#22409A", estimatedAnnualValue: 6000,
    bestFor: "Online shopping enthusiasts wanting simple 5% cashback under ₹1,000 annual fee.",
    worstFor: "Offline spenders, travelers needing lounges/insurance, miles seekers.",
    bins: [{ bin: "436590" }, { bin: "436591" }],
    benefits: [
      { category: "rewards", title: "Flat Cashback", description: "5% on all online spends. 1% on offline. Max ₹5,000/statement cycle.", valueEstimate: 5000 },
      { category: "lounge", title: "Lounge Access", description: "4 domestic lounge visits/year.", valueEstimate: 1000 },
      { category: "fuel", title: "Fuel Surcharge", description: "1% waiver (max ₹100/month). ₹500-₹3,000 transactions.", valueEstimate: 500 },
      { category: "forex", title: "Forex Markup", description: "3.5% on international transactions.", valueEstimate: 0 },
      { category: "welcome", title: "Welcome Benefits", description: "₹500 Amazon voucher on first spend within 60 days.", valueEstimate: 500 },
    ],
    program: {
      name: "SBI CashBack", pointName: "Cashback", earnRate: "5% online / 1% offline",
      earnDescription: "Flat 5% on all online spends. 1% offline. Auto-credited as statement credit.",
      redemptions: [
        { name: "Auto Statement Credit", type: "cashback", conversionRate: 1.0, description: "Automatically credited", estimatedCPP: 1.0 },
      ],
      transfers: [],
    },
    offers: [
      { title: "Extra 1% on BigBasket", merchant: "BigBasket", discountType: "cashback", discountValue: "6% total" },
      { title: "Tata CLiQ 10% Instant Discount", merchant: "Tata CLiQ", discountType: "percentage", discountValue: "10% off (max ₹1,500)" },
    ],
  },
  {
    id: "card_icici_amazon", bankId: "bank_icici", name: "ICICI Amazon Pay", network: "Visa", tier: "classic",
    annualFee: 500, joiningFee: 0, color: "#FF9900", estimatedAnnualValue: 4500,
    bestFor: "Amazon Prime members who shop heavily on Amazon. Zero joining fee.",
    worstFor: "Non-Amazon shoppers, anyone wanting real cashback, travelers.",
    bins: [{ bin: "411262" }, { bin: "411263" }],
    benefits: [
      { category: "rewards", title: "Amazon Pay Rewards", description: "5% on Amazon (Prime). 2% on bills/recharges. 1% on all other. Rewards as Amazon Pay balance.", valueEstimate: 3500 },
      { category: "fuel", title: "Fuel Surcharge", description: "1% waiver (max ₹100/month).", valueEstimate: 500 },
      { category: "forex", title: "Forex Markup", description: "3.5% on foreign currency transactions.", valueEstimate: 0 },
      { category: "welcome", title: "Welcome Benefits", description: "₹500 Amazon Pay cashback on first transaction.", valueEstimate: 500 },
    ],
    program: {
      name: "Amazon Pay Rewards", pointName: "Amazon Pay Balance", earnRate: "5% Prime / 2% bills / 1% other",
      earnDescription: "Rewards as Amazon Pay balance. 5% for Prime members on Amazon. 2% on bills. 1% on everything else.",
      redemptions: [
        { name: "Amazon Pay Balance", type: "cashback", conversionRate: 1.0, description: "Usable on Amazon + offline stores accepting Amazon Pay", estimatedCPP: 1.0 },
      ],
      transfers: [],
    },
    offers: [
      { title: "6% During Amazon Sales", merchant: "Amazon", discountType: "cashback", discountValue: "6% for Prime members" },
      { title: "Amazon Fresh Extra 1%", merchant: "Amazon Fresh", discountType: "cashback", discountValue: "Extra 1% on groceries" },
    ],
  },
  {
    id: "card_idfc_wealth", bankId: "bank_idfc", name: "IDFC FIRST Wealth", network: "Visa", tier: "platinum",
    annualFee: 999, joiningFee: 0, color: "#7B2D8E", estimatedAnnualValue: 10000,
    bestFor: "International travelers (1.99% forex). Budget-conscious users wanting decent benefits at ₹999.",
    worstFor: "Heavy domestic spenders (0.75% offline), lounge addicts, miles accumulators.",
    bins: [{ bin: "422222" }, { bin: "422223" }],
    benefits: [
      { category: "rewards", title: "Reward Points", description: "6 RP per ₹100 online. 3 RP per ₹100 offline. 10x on partners. 1 RP = ₹0.25.", valueEstimate: 3000 },
      { category: "lounge", title: "Lounge Access", description: "4 domestic + 2 international via DreamFolks.", valueEstimate: 2000 },
      { category: "travel", title: "Travel Insurance", description: "Travel insurance ₹50 lakhs. Lost baggage ₹1 lakh.", valueEstimate: 1000 },
      { category: "insurance", title: "Insurance Cover", description: "Air accident ₹1 crore. Purchase protection 120 days. Emergency medical abroad ₹10L.", valueEstimate: 1000 },
      { category: "fuel", title: "Fuel Surcharge", description: "1% waiver (max ₹200/month).", valueEstimate: 500 },
      { category: "dining", title: "Dining Benefits", description: "10x points on Swiggy, Zomato via IDFC rewards portal.", valueEstimate: 1000 },
      { category: "movie", title: "Movie Benefits", description: "BOGO on BookMyShow (once/month, max ₹200).", valueEstimate: 500 },
      { category: "forex", title: "Best Forex Rate", description: "1.99% forex markup — one of the lowest in India.", valueEstimate: 3000 },
      { category: "welcome", title: "Welcome Benefits", description: "Zero joining fee. 2,000 RP on first spend.", valueEstimate: 500 },
    ],
    program: {
      name: "IDFC FIRST Rewards", pointName: "Reward Points", earnRate: "3-6 RP per ₹100",
      earnDescription: "6 RP per ₹100 online. 3 RP per ₹100 offline. 10x on partner brands. Never-expiring.",
      redemptions: [
        { name: "Statement Credit", type: "cashback", conversionRate: 0.25, description: "Credit to statement", estimatedCPP: 0.25 },
        { name: "Vouchers", type: "voucher", conversionRate: 0.25, description: "Amazon, Flipkart vouchers", estimatedCPP: 0.25 },
      ],
      transfers: [],
    },
    offers: [
      { title: "Amazon 10% Off via IDFC Portal", merchant: "Amazon", discountType: "percentage", discountValue: "10% off (max ₹500)" },
      { title: "20x on International Spends", discountType: "points_multiplier", discountValue: "20x points this quarter" },
      { title: "BookMyShow BOGO Every Friday", merchant: "BookMyShow", discountType: "bogo", discountValue: "Buy 1 Get 1" },
    ],
  },
  {
    id: "card_au_zenith_plus", bankId: "bank_au", name: "AU Zenith+", network: "Mastercard", tier: "signature",
    annualFee: 9999, joiningFee: 9999, color: "#B5121B", estimatedAnnualValue: 40000,
    bestFor: "Weekend spenders (5% rate), frequent diners, movie buffs, premium lounge seekers.",
    worstFor: "Purely weekday spenders, those outside AU ecosystem, international-heavy spenders wanting sub-2% forex.",
    bins: [{ bin: "553737", tier: "signature" }, { bin: "553738", tier: "signature" }, { bin: "553739", tier: "signature" }],
    benefits: [
      { category: "rewards", title: "Vkaash Points", description: "33 Vkaash per ₹100 on weekends. 22 per ₹100 weekdays. Effective 3.3-5% on weekends.", valueEstimate: 15000 },
      { category: "lounge", title: "Unlimited Lounge", description: "Unlimited domestic (cardholder + guest). 12 international via Priority Pass.", valueEstimate: 10000 },
      { category: "travel", title: "Travel Benefits", description: "Insurance ₹2 crores. Lost baggage ₹3L. Meet & greet (2/year).", valueEstimate: 3000 },
      { category: "insurance", title: "Insurance Cover", description: "Air accident ₹2 crores. Emergency medical ₹20L abroad.", valueEstimate: 2000 },
      { category: "fuel", title: "Fuel Surcharge", description: "1% waiver (max ₹500/month). Higher cap than most.", valueEstimate: 3000 },
      { category: "dining", title: "Dining Privileges", description: "20% off at 5,000+ restaurants. Culinary experiences. EazyDiner Prime equivalent.", valueEstimate: 4000 },
      { category: "movie", title: "Movie Benefits", description: "BOGO on BookMyShow/PVR/INOX (4 times/month, max ₹350/ticket). Best in market.", valueEstimate: 5000 },
      { category: "golf", title: "Golf Access", description: "8 complimentary rounds/year at 50+ courses. Guest 50% off.", valueEstimate: 4000 },
      { category: "forex", title: "Forex Markup", description: "2% on foreign currency. Competitive for premium segment.", valueEstimate: 2000 },
      { category: "milestone", title: "Milestone Rewards", description: "₹10L: fee reversal. ₹20L: 50,000 bonus Vkaash + hotel voucher.", valueEstimate: 10000 },
      { category: "welcome", title: "Welcome Benefits", description: "50,000 Vkaash on ₹50K spend in 60 days (worth ₹5-7.5K). Priority Pass.", valueEstimate: 7500 },
    ],
    program: {
      name: "AU Vkaash Rewards", pointName: "Vkaash", earnRate: "22-33 Vkaash per ₹100",
      earnDescription: "33 Vkaash per ₹100 on weekends. 22 per ₹100 weekdays. 1 Vkaash = ₹0.10-0.15.",
      expiryMonths: 24,
      redemptions: [
        { name: "Flight Booking", type: "miles", conversionRate: 0.15, description: "Book flights on AU portal", estimatedCPP: 0.15 },
        { name: "Hotel Booking", type: "voucher", conversionRate: 0.12, description: "Redeem for hotel stays", estimatedCPP: 0.12 },
        { name: "Vouchers", type: "voucher", conversionRate: 0.10, description: "Amazon, Flipkart, lifestyle", estimatedCPP: 0.10 },
        { name: "Statement Credit", type: "cashback", conversionRate: 0.10, description: "Credit to statement", estimatedCPP: 0.10 },
      ],
      transfers: [
        { partnerName: "Marriott Bonvoy", partnerType: "hotel", transferRatio: "10:1", transferFee: 0, transferTime: "7-10 days" },
      ],
    },
    offers: [
      { title: "5x Vkaash on International Spends", discountType: "points_multiplier", discountValue: "5x Vkaash" },
      { title: "Flipkart 10x During Big Billion Days", merchant: "Flipkart", discountType: "points_multiplier", discountValue: "10x Vkaash" },
      { title: "Zero-Cost EMI on ₹10K+", discountType: "emi", discountValue: "0% EMI on all ₹10K+ spends" },
    ],
  },
];

async function main() {
  console.log("Cleaning normalized tables...");
  await prisma.userReward.deleteMany();
  await prisma.transferPartner.deleteMany();
  await prisma.redemptionOption.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.benefit.deleteMany();
  await prisma.cardBIN2.deleteMany();
  await prisma.normalizedProgram.deleteMany();
  await prisma.card.deleteMany();
  await prisma.bank.deleteMany();

  console.log("Seeding banks...");
  for (const b of BANKS) {
    await prisma.bank.create({ data: b });
  }

  console.log("Seeding cards with full knowledge graph...");
  for (const c of CARDS) {
    await prisma.card.create({
      data: {
        id: c.id,
        bankId: c.bankId,
        name: c.name,
        network: c.network,
        cardType: "credit",
        tier: c.tier,
        annualFee: c.annualFee,
        joiningFee: c.joiningFee,
        color: c.color,
        bestFor: c.bestFor,
        worstFor: c.worstFor,
        estimatedAnnualValue: c.estimatedAnnualValue,
      },
    });

    for (const b of c.benefits) {
      await prisma.benefit.create({
        data: { cardId: c.id, category: b.category, title: b.title, description: b.description, terms: b.terms, valueEstimate: b.valueEstimate ?? 0 },
      });
    }

    const prog = await prisma.normalizedProgram.create({
      data: {
        cardId: c.id,
        name: c.program.name,
        pointName: c.program.pointName,
        earnRate: c.program.earnRate,
        earnDescription: c.program.earnDescription,
        expiryMonths: c.program.expiryMonths,
      },
    });

    for (const r of c.program.redemptions) {
      await prisma.redemptionOption.create({
        data: { programId: prog.id, name: r.name, type: r.type, conversionRate: r.conversionRate, minPoints: r.minPoints ?? 0, description: r.description, estimatedCPP: r.estimatedCPP ?? 0 },
      });
    }

    for (const t of c.program.transfers) {
      await prisma.transferPartner.create({
        data: { programId: prog.id, partnerName: t.partnerName, partnerType: t.partnerType, transferRatio: t.transferRatio, transferFee: t.transferFee ?? 0, transferTime: t.transferTime },
      });
    }

    for (const o of c.offers) {
      await prisma.offer.create({
        data: { cardId: c.id, title: o.title, merchant: o.merchant, discountType: o.discountType, discountValue: o.discountValue, terms: o.terms },
      });
    }

    for (const bin of c.bins) {
      await prisma.cardBIN2.create({
        data: { bin: bin.bin, cardId: c.id, tier: bin.tier ?? c.tier },
      });
    }
  }

  // Seed demo UserReward balances for user_demo_001
  const allPrograms = await prisma.normalizedProgram.findMany({ include: { card: true } });
  const demoBalances: Record<string, number> = {
    "HDFC Reward Points": 24500,
    "HDFC Millennia Points": 8200,
    "Axis EDGE Rewards": 32000,
    "Axis EDGE Miles": 15000,
    "SBI CashBack Points": 4500,
    "ICICI Payback Points": 12800,
    "IDFC FIRST Rewards": 6700,
    "AU Zenith Rewards": 9300,
  };

  for (const prog of allPrograms) {
    const bal = demoBalances[prog.name] ?? Math.floor(Math.random() * 15000) + 2000;
    await prisma.userReward.upsert({
      where: { userId_programId: { userId: "user_demo_001", programId: prog.id } },
      update: { balance: bal },
      create: { userId: "user_demo_001", programId: prog.id, balance: bal },
    });
  }

  const stats = {
    banks: await prisma.bank.count(),
    cards: await prisma.card.count(),
    benefits: await prisma.benefit.count(),
    programs: await prisma.normalizedProgram.count(),
    redemptions: await prisma.redemptionOption.count(),
    transferPartners: await prisma.transferPartner.count(),
    offers: await prisma.offer.count(),
    bins: await prisma.cardBIN2.count(),
    userRewards: await prisma.userReward.count(),
  };
  console.log("Normalized seed complete:", stats);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
