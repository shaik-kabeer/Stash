import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashSync } from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function pastDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function futureDate(daysAhead: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d;
}

function monthsAgoDate(monthsAgo: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

async function main() {
  await prisma.agentExecution.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.rewardValuation.deleteMany();
  await prisma.rewardTransaction.deleteMany();
  await prisma.rewardAccount.deleteMany();
  await prisma.rewardProgram.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      id: "user_demo_001",
      name: "Arjun Mehta",
      email: "arjun@rewardos.in",
      passwordHash: hashSync("demo1234", 10),
      role: "admin",
      avatar: null,
    },
  });

  await prisma.user.create({
    data: {
      id: "user_demo_002",
      name: "Priya Sharma",
      email: "priya@rewardos.in",
      passwordHash: hashSync("demo1234", 10),
      role: "user",
      avatar: null,
    },
  });

  const programs = await Promise.all([
    prisma.rewardProgram.create({
      data: {
        id: "prog_hdfc", name: "HDFC Reward Points", provider: "HDFC Bank",
        type: "credit_card", conversionRate: 0.20, expiryRules: "Points expire 2 years from earning date",
        transferPartners: "SmartBuy, Air India, Marriott", category: "Banking", color: "#004B87",
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_axis", name: "Axis EDGE Rewards", provider: "Axis Bank",
        type: "credit_card", conversionRate: 0.25, expiryRules: "Points expire 3 years from earning date",
        transferPartners: "InterMiles, Marriott, ITC Hotels", category: "Banking", color: "#97144D",
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_sbi", name: "SBI Rewardz", provider: "SBI Card",
        type: "credit_card", conversionRate: 0.25, expiryRules: "Points valid for 2 years",
        transferPartners: "Air India, Vistara", category: "Banking", color: "#22409A",
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_icici", name: "ICICI Reward Points", provider: "ICICI Bank",
        type: "credit_card", conversionRate: 0.25, expiryRules: "Points expire in 18 months",
        transferPartners: "InterMiles, ITC", category: "Banking", color: "#F58220",
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_airindia", name: "Air India Flying Returns", provider: "Air India",
        type: "airline_miles", conversionRate: 0.75, expiryRules: "Miles expire 36 months after earning",
        transferPartners: "Star Alliance partners, Vistara", category: "Travel", color: "#E31837",
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_indigo", name: "IndiGo BluChip", provider: "IndiGo Airlines",
        type: "airline_miles", conversionRate: 1.00, expiryRules: "Points expire in 12 months",
        transferPartners: "None", category: "Travel", color: "#3F1D75",
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_marriott", name: "Marriott Bonvoy", provider: "Marriott International",
        type: "hotel_loyalty", conversionRate: 0.65, expiryRules: "Points expire after 24 months of inactivity",
        transferPartners: "40+ airline partners worldwide", category: "Hospitality", color: "#1C1C1C",
      },
    }),
  ]);

  const accountData = [
    { programId: "prog_hdfc", balance: 4250, expiryDate: futureDate(180), tier: "Preferred" },
    { programId: "prog_axis", balance: 12800, expiryDate: futureDate(365), tier: "Burgundy" },
    { programId: "prog_sbi", balance: 8500, expiryDate: futureDate(270), tier: "Elite" },
    { programId: "prog_icici", balance: 3200, expiryDate: futureDate(45), tier: "Sapphiro" },
    { programId: "prog_airindia", balance: 45000, expiryDate: futureDate(540), tier: "Gold" },
    { programId: "prog_indigo", balance: 2100, expiryDate: futureDate(60), tier: "Plus" },
    { programId: "prog_marriott", balance: 28000, expiryDate: futureDate(730), tier: "Platinum Elite" },
  ];

  const accounts = [];
  for (const ad of accountData) {
    const program = programs.find((p) => p.id === ad.programId)!;
    const acc = await prisma.rewardAccount.create({
      data: {
        userId: user.id, programId: ad.programId, balance: ad.balance,
        estimatedValueINR: ad.balance * program.conversionRate,
        lastSynced: pastDate(1), expiryDate: ad.expiryDate, status: "active", tier: ad.tier,
      },
    });
    accounts.push(acc);
  }

  const txSets: { idx: number; txs: { type: string; pts: number; desc: string; ago: number }[] }[] = [
    { idx: 0, txs: [
      { type:"earn", pts:350, desc:"Amazon Shopping - 3x points", ago:2 },
      { type:"earn", pts:120, desc:"Grocery at BigBasket", ago:5 },
      { type:"earn", pts:500, desc:"Flight booking on MakeMyTrip", ago:12 },
      { type:"redeem", pts:-200, desc:"Statement credit redemption", ago:18 },
      { type:"earn", pts:80, desc:"Fuel station transaction", ago:25 },
      { type:"earn", pts:220, desc:"Dining at Mainland China", ago:35 },
      { type:"earn", pts:180, desc:"Movie tickets via BMS", ago:42 },
      { type:"earn", pts:300, desc:"Insurance premium payment", ago:55 },
      { type:"earn", pts:150, desc:"Croma electronics purchase", ago:68 },
      { type:"earn", pts:400, desc:"Hotel booking on OYO", ago:80 },
      { type:"redeem", pts:-500, desc:"Amazon voucher redemption", ago:95 },
      { type:"earn", pts:280, desc:"Myntra fashion sale", ago:110 },
      { type:"earn", pts:350, desc:"Monthly bonus points", ago:130 },
      { type:"earn", pts:200, desc:"PhonePe recharge", ago:150 },
      { type:"earn", pts:450, desc:"Quarterly milestone bonus", ago:180 },
      { type:"earn", pts:170, desc:"Zomato dining", ago:200 },
      { type:"earn", pts:600, desc:"Annual fee waiver bonus", ago:250 },
      { type:"redeem", pts:-300, desc:"Flight upgrade redemption", ago:280 },
      { type:"earn", pts:100, desc:"Grocery run", ago:310 },
      { type:"earn", pts:250, desc:"Welcome bonus", ago:360 },
    ]},
    { idx: 1, txs: [
      { type:"earn", pts:640, desc:"Online shopping - 5x EDGE Rewards", ago:1 },
      { type:"earn", pts:320, desc:"Utility bill payment", ago:4 },
      { type:"earn", pts:1200, desc:"International transaction bonus", ago:8 },
      { type:"earn", pts:200, desc:"Swiggy food order", ago:15 },
      { type:"redeem", pts:-500, desc:"Amazon voucher redemption", ago:22 },
      { type:"earn", pts:450, desc:"Flipkart sale purchase", ago:30 },
      { type:"earn", pts:800, desc:"International flight booking", ago:50 },
      { type:"earn", pts:350, desc:"Subscription renewals", ago:70 },
      { type:"earn", pts:1500, desc:"Annual spend milestone", ago:90 },
      { type:"redeem", pts:-1000, desc:"Flipkart voucher", ago:120 },
      { type:"earn", pts:600, desc:"Weekend shopping", ago:150 },
      { type:"earn", pts:420, desc:"Dining rewards", ago:180 },
      { type:"earn", pts:900, desc:"Travel booking bonus", ago:210 },
      { type:"earn", pts:350, desc:"Fuel surcharge waiver", ago:240 },
      { type:"earn", pts:1100, desc:"Quarter milestone bonus", ago:270 },
      { type:"earn", pts:280, desc:"Movie booking", ago:300 },
      { type:"earn", pts:500, desc:"Activation bonus", ago:340 },
    ]},
    { idx: 2, txs: [
      { type:"earn", pts:400, desc:"Monthly spend bonus", ago:3 },
      { type:"earn", pts:250, desc:"Electronics purchase at Reliance", ago:7 },
      { type:"earn", pts:180, desc:"Grocery shopping DMart", ago:14 },
      { type:"earn", pts:600, desc:"Travel booking bonus", ago:21 },
      { type:"redeem", pts:-1000, desc:"Gift card redemption", ago:28 },
      { type:"earn", pts:350, desc:"Insurance premium", ago:45 },
      { type:"earn", pts:200, desc:"Cab rides Uber", ago:60 },
      { type:"earn", pts:500, desc:"Anniversary bonus", ago:90 },
      { type:"earn", pts:300, desc:"Clothing purchase", ago:120 },
      { type:"earn", pts:450, desc:"EMI purchase bonus", ago:150 },
      { type:"redeem", pts:-800, desc:"Statement credit", ago:180 },
      { type:"earn", pts:700, desc:"Festival season bonus", ago:220 },
      { type:"earn", pts:150, desc:"Petrol pump", ago:260 },
      { type:"earn", pts:350, desc:"Welcome points", ago:300 },
    ]},
    { idx: 3, txs: [
      { type:"earn", pts:280, desc:"Online subscription payment", ago:2 },
      { type:"earn", pts:150, desc:"Restaurant dining at ITC", ago:9 },
      { type:"earn", pts:420, desc:"Weekend shopping spree", ago:16 },
      { type:"redeem", pts:-300, desc:"Cashback redemption", ago:24 },
      { type:"earn", pts:200, desc:"Mobile recharge", ago:35 },
      { type:"earn", pts:500, desc:"Travel booking", ago:50 },
      { type:"earn", pts:180, desc:"Grocery shopping", ago:70 },
      { type:"earn", pts:350, desc:"Electronics purchase", ago:100 },
      { type:"redeem", pts:-250, desc:"Voucher redemption", ago:130 },
      { type:"earn", pts:600, desc:"Festival bonus", ago:170 },
      { type:"earn", pts:300, desc:"Welcome bonus", ago:300 },
    ]},
    { idx: 4, txs: [
      { type:"earn", pts:8500, desc:"DEL-BOM round trip Business", ago:10 },
      { type:"earn", pts:12000, desc:"DEL-LHR international flight", ago:30 },
      { type:"earn", pts:4500, desc:"BOM-BLR economy flight", ago:60 },
      { type:"earn", pts:15000, desc:"Welcome bonus miles", ago:90 },
      { type:"earn", pts:5000, desc:"HDFC credit card transfer", ago:120 },
      { type:"earn", pts:3500, desc:"DEL-CCU flight", ago:160 },
      { type:"redeem", pts:-8000, desc:"BOM-GOA award flight", ago:200 },
      { type:"earn", pts:6000, desc:"BLR-DEL round trip", ago:240 },
      { type:"earn", pts:2000, desc:"Star Alliance partner credit", ago:280 },
      { type:"earn", pts:4500, desc:"Tier bonus miles", ago:320 },
    ]},
    { idx: 5, txs: [
      { type:"earn", pts:450, desc:"DEL-BLR 6E flight", ago:7 },
      { type:"earn", pts:300, desc:"Meal & seat selection add-on", ago:20 },
      { type:"earn", pts:600, desc:"BOM-GOA 6E flight", ago:40 },
      { type:"redeem", pts:-250, desc:"Seat upgrade redemption", ago:55 },
      { type:"earn", pts:1000, desc:"Promotional bonus points", ago:70 },
      { type:"earn", pts:350, desc:"HYD-DEL flight", ago:100 },
      { type:"earn", pts:200, desc:"In-flight purchase", ago:140 },
      { type:"redeem", pts:-400, desc:"Baggage allowance upgrade", ago:180 },
      { type:"earn", pts:500, desc:"Festival travel bonus", ago:220 },
    ]},
    { idx: 6, txs: [
      { type:"earn", pts:5500, desc:"2-night stay at JW Marriott Mumbai", ago:5 },
      { type:"earn", pts:3200, desc:"Courtyard by Marriott Bengaluru", ago:20 },
      { type:"earn", pts:8000, desc:"Westin Goa resort weekend", ago:45 },
      { type:"earn", pts:2000, desc:"Dining at hotel restaurant", ago:60 },
      { type:"redeem", pts:-5000, desc:"Free night award - Fairfield", ago:80 },
      { type:"earn", pts:14300, desc:"HDFC credit card sign-up bonus", ago:100 },
      { type:"earn", pts:4000, desc:"Sheraton New Delhi stay", ago:140 },
      { type:"earn", pts:1800, desc:"Room upgrade bonus", ago:180 },
      { type:"redeem", pts:-3500, desc:"Spa service redemption", ago:220 },
      { type:"earn", pts:6000, desc:"Quarter stay bonus", ago:260 },
      { type:"earn", pts:2500, desc:"Referral bonus", ago:300 },
      { type:"earn", pts:3200, desc:"Welcome gift", ago:350 },
    ]},
  ];

  let txCount = 0;
  for (const ts of txSets) {
    const account = accounts[ts.idx];
    const program = programs[ts.idx];
    for (const t of ts.txs) {
      await prisma.rewardTransaction.create({
        data: {
          accountId: account.id, type: t.type, points: t.pts,
          valueINR: Math.abs(t.pts) * program.conversionRate,
          description: t.desc, transactionDate: pastDate(t.ago),
        },
      });
      txCount++;
    }
  }

  let valCount = 0;
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const program = programs[i];
    for (let m = 0; m < 12; m++) {
      const balanceAtMonth = account.balance * (1 - m * 0.06 + Math.random() * 0.04);
      await prisma.rewardValuation.create({
        data: {
          accountId: account.id, programId: program.id,
          pointsValued: Math.max(0, balanceAtMonth),
          inrValue: Math.max(0, balanceAtMonth) * program.conversionRate,
          redemptionEfficiency: 85 + Math.random() * 30,
          valuedAt: monthsAgoDate(m),
        },
      });
      valCount++;
    }
  }

  const recs = [
    { type:"expiry_warning", title:"ICICI Points Expiring in 45 Days", description:"You have 3,200 ICICI Reward Points (₹800) expiring soon. Consider redeeming for Amazon vouchers at 1:1 value or transferring to InterMiles.", priority:"high" },
    { type:"expiry_warning", title:"IndiGo BluChip Points Expiring in 60 Days", description:"2,100 BluChip points (₹2,100) will expire in 2 months. Book a flight or use for seat upgrades before they lapse.", priority:"high" },
    { type:"optimization", title:"Transfer HDFC Points to Air India Miles", description:"Transfer 4,250 HDFC points to Air India at 1:1 ratio. Your Air India miles are worth ₹0.75/mile vs HDFC's ₹0.20/point — a 3.75x value multiplier.", priority:"high" },
    { type:"optimization", title:"Maximize Axis EDGE Rewards via Flipkart", description:"Axis EDGE Rewards give 5x on Flipkart. Your 12,800 points can be redeemed for ₹3,200 in Flipkart vouchers — the highest value redemption option.", priority:"medium" },
    { type:"insight", title:"SBI Rewardz Underutilized", description:"Your SBI card earns fewer rewards per ₹100 spent compared to Axis. Consider using Axis for online shopping and SBI primarily for fuel & grocery (2x categories).", priority:"medium" },
    { type:"card_recommendation", title:"Use HDFC for Travel Bookings", description:"HDFC SmartBuy portal offers 10x reward points on flights and hotels. Always book travel through SmartBuy to maximize point earnings.", priority:"medium" },
    { type:"portfolio_health", title:"Portfolio Diversification Alert", description:"63% of your reward value is concentrated in Air India miles and Marriott Bonvoy. Consider diversifying by redeeming some for liquid cashback.", priority:"low" },
    { type:"insight", title:"Marriott Points Sweet Spot", description:"Your 28,000 Bonvoy points are enough for 2 free nights at Category 3 properties or 1 night at Category 5. Weekend rates give the best cpp value.", priority:"medium" },
  ];
  for (const rec of recs) {
    await prisma.recommendation.create({ data: { userId: user.id, ...rec } });
  }

  const execs = [
    { agentName:"Reward Aggregator", workflowName:"Portfolio Analysis", status:"completed", input:JSON.stringify({userId:user.id}), output:JSON.stringify({totalValueINR:73925,programsAnalyzed:7}), durationMs:1250, executedAt:pastDate(1) },
    { agentName:"Valuation Agent", workflowName:"Portfolio Analysis", status:"completed", input:JSON.stringify({userId:user.id}), output:JSON.stringify({portfolioScore:78,efficiency:"Good"}), durationMs:2100, executedAt:pastDate(1) },
    { agentName:"Monitoring Agent", workflowName:"Expiry Detection", status:"completed", input:JSON.stringify({userId:user.id}), output:JSON.stringify({expiringAccounts:2,totalAtRisk:5300}), durationMs:800, executedAt:pastDate(2) },
    { agentName:"Optimization Agent", workflowName:"Redemption Optimization", status:"completed", input:JSON.stringify({userId:user.id}), output:JSON.stringify({recommendations:3,potentialGain:12500}), durationMs:3200, executedAt:pastDate(3) },
  ];
  for (const ae of execs) {
    await prisma.agentExecution.create({ data: { userId: user.id, ...ae } });
  }

  console.log("Seed completed successfully!");
  console.log(`- 1 user (arjun@rewardos.in / demo1234)`);
  console.log(`- 7 reward programs`);
  console.log(`- 7 reward accounts`);
  console.log(`- ${txCount} transactions`);
  console.log(`- ${valCount} valuations`);
  console.log(`- ${recs.length} recommendations`);
  console.log(`- ${execs.length} agent executions`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
