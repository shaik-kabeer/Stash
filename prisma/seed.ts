const { PrismaClient } = require("../src/generated/prisma/client.ts");
const bcryptjs = require("bcryptjs");
const { hashSync } = bcryptjs;

const prisma = new PrismaClient();

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
      avatar: null,
    },
  });

  const programs = await Promise.all([
    prisma.rewardProgram.create({
      data: {
        id: "prog_hdfc",
        name: "HDFC Reward Points",
        provider: "HDFC Bank",
        type: "credit_card",
        conversionRate: 0.20,
        currencyEquivalent: "INR",
        expiryRules: "Points expire 2 years from earning date",
        transferPartners: "SmartBuy, Air India, Marriott",
        category: "Banking",
        color: "#004B87",
        isActive: true,
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_axis",
        name: "Axis EDGE Rewards",
        provider: "Axis Bank",
        type: "credit_card",
        conversionRate: 0.25,
        currencyEquivalent: "INR",
        expiryRules: "Points expire 3 years from earning date",
        transferPartners: "InterMiles, Marriott, ITC Hotels",
        category: "Banking",
        color: "#97144D",
        isActive: true,
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_sbi",
        name: "SBI Rewardz",
        provider: "SBI Card",
        type: "credit_card",
        conversionRate: 0.25,
        currencyEquivalent: "INR",
        expiryRules: "Points valid for 2 years",
        transferPartners: "Air India, Vistara",
        category: "Banking",
        color: "#22409A",
        isActive: true,
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_icici",
        name: "ICICI Reward Points",
        provider: "ICICI Bank",
        type: "credit_card",
        conversionRate: 0.25,
        currencyEquivalent: "INR",
        expiryRules: "Points expire in 18 months",
        transferPartners: "InterMiles, ITC",
        category: "Banking",
        color: "#F58220",
        isActive: true,
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_airindia",
        name: "Air India Flying Returns",
        provider: "Air India",
        type: "airline_miles",
        conversionRate: 0.75,
        currencyEquivalent: "INR",
        expiryRules: "Miles expire 36 months after earning",
        transferPartners: "Star Alliance partners, Vistara",
        category: "Travel",
        color: "#E31837",
        isActive: true,
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_indigo",
        name: "IndiGo BluChip",
        provider: "IndiGo Airlines",
        type: "airline_miles",
        conversionRate: 1.00,
        currencyEquivalent: "INR",
        expiryRules: "Points expire in 12 months",
        transferPartners: "None",
        category: "Travel",
        color: "#3F1D75",
        isActive: true,
      },
    }),
    prisma.rewardProgram.create({
      data: {
        id: "prog_marriott",
        name: "Marriott Bonvoy",
        provider: "Marriott International",
        type: "hotel_loyalty",
        conversionRate: 0.65,
        currencyEquivalent: "INR",
        expiryRules: "Points expire after 24 months of inactivity",
        transferPartners: "40+ airline partners worldwide",
        category: "Hospitality",
        color: "#1C1C1C",
        isActive: true,
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
        userId: user.id,
        programId: ad.programId,
        balance: ad.balance,
        estimatedValueINR: ad.balance * program.conversionRate,
        lastSynced: pastDate(1),
        expiryDate: ad.expiryDate,
        status: "active",
        tier: ad.tier,
      },
    });
    accounts.push(acc);
  }

  const transactionSets: {
    accountIdx: number;
    transactions: { type: string; points: number; desc: string; daysAgo: number }[];
  }[] = [
    {
      accountIdx: 0, // HDFC
      transactions: [
        { type: "earn", points: 350, desc: "Amazon Shopping - 3x points", daysAgo: 2 },
        { type: "earn", points: 120, desc: "Grocery at BigBasket", daysAgo: 5 },
        { type: "earn", points: 500, desc: "Flight booking on MakeMyTrip", daysAgo: 12 },
        { type: "redeem", points: -200, desc: "Statement credit redemption", daysAgo: 18 },
        { type: "earn", points: 80, desc: "Fuel station transaction", daysAgo: 25 },
        { type: "earn", points: 220, desc: "Dining at Mainland China", daysAgo: 35 },
        { type: "earn", points: 180, desc: "Movie tickets via BMS", daysAgo: 42 },
        { type: "earn", points: 300, desc: "Insurance premium payment", daysAgo: 55 },
        { type: "earn", points: 150, desc: "Croma electronics purchase", daysAgo: 68 },
        { type: "earn", points: 400, desc: "Hotel booking on OYO", daysAgo: 80 },
        { type: "redeem", points: -500, desc: "Amazon voucher redemption", daysAgo: 95 },
        { type: "earn", points: 280, desc: "Myntra fashion sale", daysAgo: 110 },
        { type: "earn", points: 350, desc: "Monthly bonus points", daysAgo: 130 },
        { type: "earn", points: 200, desc: "PhonePe recharge", daysAgo: 150 },
        { type: "earn", points: 450, desc: "Quarterly milestone bonus", daysAgo: 180 },
        { type: "earn", points: 170, desc: "Zomato dining", daysAgo: 200 },
        { type: "earn", points: 600, desc: "Annual fee waiver bonus", daysAgo: 250 },
        { type: "redeem", points: -300, desc: "Flight upgrade redemption", daysAgo: 280 },
        { type: "earn", points: 100, desc: "Grocery run", daysAgo: 310 },
        { type: "earn", points: 250, desc: "Welcome bonus", daysAgo: 360 },
      ],
    },
    {
      accountIdx: 1, // Axis
      transactions: [
        { type: "earn", points: 640, desc: "Online shopping - 5x EDGE Rewards", daysAgo: 1 },
        { type: "earn", points: 320, desc: "Utility bill payment", daysAgo: 4 },
        { type: "earn", points: 1200, desc: "International transaction bonus", daysAgo: 8 },
        { type: "earn", points: 200, desc: "Swiggy food order", daysAgo: 15 },
        { type: "redeem", points: -500, desc: "Amazon voucher redemption", daysAgo: 22 },
        { type: "earn", points: 450, desc: "Flipkart sale purchase", daysAgo: 30 },
        { type: "earn", points: 800, desc: "International flight booking", daysAgo: 50 },
        { type: "earn", points: 350, desc: "Subscription renewals", daysAgo: 70 },
        { type: "earn", points: 1500, desc: "Annual spend milestone", daysAgo: 90 },
        { type: "redeem", points: -1000, desc: "Flipkart voucher", daysAgo: 120 },
        { type: "earn", points: 600, desc: "Weekend shopping", daysAgo: 150 },
        { type: "earn", points: 420, desc: "Dining rewards", daysAgo: 180 },
        { type: "earn", points: 900, desc: "Travel booking bonus", daysAgo: 210 },
        { type: "earn", points: 350, desc: "Fuel surcharge waiver", daysAgo: 240 },
        { type: "earn", points: 1100, desc: "Quarter milestone bonus", daysAgo: 270 },
        { type: "earn", points: 280, desc: "Movie booking", daysAgo: 300 },
        { type: "earn", points: 500, desc: "Activation bonus", daysAgo: 340 },
      ],
    },
    {
      accountIdx: 2, // SBI
      transactions: [
        { type: "earn", points: 400, desc: "Monthly spend bonus", daysAgo: 3 },
        { type: "earn", points: 250, desc: "Electronics purchase at Reliance", daysAgo: 7 },
        { type: "earn", points: 180, desc: "Grocery shopping DMart", daysAgo: 14 },
        { type: "earn", points: 600, desc: "Travel booking bonus", daysAgo: 21 },
        { type: "redeem", points: -1000, desc: "Gift card redemption", daysAgo: 28 },
        { type: "earn", points: 350, desc: "Insurance premium", daysAgo: 45 },
        { type: "earn", points: 200, desc: "Cab rides Uber", daysAgo: 60 },
        { type: "earn", points: 500, desc: "Anniversary bonus", daysAgo: 90 },
        { type: "earn", points: 300, desc: "Clothing purchase", daysAgo: 120 },
        { type: "earn", points: 450, desc: "EMI purchase bonus", daysAgo: 150 },
        { type: "redeem", points: -800, desc: "Statement credit", daysAgo: 180 },
        { type: "earn", points: 700, desc: "Festival season bonus", daysAgo: 220 },
        { type: "earn", points: 150, desc: "Petrol pump", daysAgo: 260 },
        { type: "earn", points: 350, desc: "Welcome points", daysAgo: 300 },
      ],
    },
    {
      accountIdx: 3, // ICICI
      transactions: [
        { type: "earn", points: 280, desc: "Online subscription payment", daysAgo: 2 },
        { type: "earn", points: 150, desc: "Restaurant dining at ITC", daysAgo: 9 },
        { type: "earn", points: 420, desc: "Weekend shopping spree", daysAgo: 16 },
        { type: "redeem", points: -300, desc: "Cashback redemption", daysAgo: 24 },
        { type: "earn", points: 200, desc: "Mobile recharge", daysAgo: 35 },
        { type: "earn", points: 500, desc: "Travel booking", daysAgo: 50 },
        { type: "earn", points: 180, desc: "Grocery shopping", daysAgo: 70 },
        { type: "earn", points: 350, desc: "Electronics purchase", daysAgo: 100 },
        { type: "redeem", points: -250, desc: "Voucher redemption", daysAgo: 130 },
        { type: "earn", points: 600, desc: "Festival bonus", daysAgo: 170 },
        { type: "earn", points: 300, desc: "Welcome bonus", daysAgo: 300 },
      ],
    },
    {
      accountIdx: 4, // Air India
      transactions: [
        { type: "earn", points: 8500, desc: "DEL-BOM round trip Business", daysAgo: 10 },
        { type: "earn", points: 12000, desc: "DEL-LHR international flight", daysAgo: 30 },
        { type: "earn", points: 4500, desc: "BOM-BLR economy flight", daysAgo: 60 },
        { type: "earn", points: 15000, desc: "Welcome bonus miles", daysAgo: 90 },
        { type: "earn", points: 5000, desc: "HDFC credit card transfer", daysAgo: 120 },
        { type: "earn", points: 3500, desc: "DEL-CCU flight", daysAgo: 160 },
        { type: "redeem", points: -8000, desc: "BOM-GOA award flight", daysAgo: 200 },
        { type: "earn", points: 6000, desc: "BLR-DEL round trip", daysAgo: 240 },
        { type: "earn", points: 2000, desc: "Star Alliance partner credit", daysAgo: 280 },
        { type: "earn", points: 4500, desc: "Tier bonus miles", daysAgo: 320 },
      ],
    },
    {
      accountIdx: 5, // IndiGo
      transactions: [
        { type: "earn", points: 450, desc: "DEL-BLR 6E flight", daysAgo: 7 },
        { type: "earn", points: 300, desc: "Meal & seat selection add-on", daysAgo: 20 },
        { type: "earn", points: 600, desc: "BOM-GOA 6E flight", daysAgo: 40 },
        { type: "redeem", points: -250, desc: "Seat upgrade redemption", daysAgo: 55 },
        { type: "earn", points: 1000, desc: "Promotional bonus points", daysAgo: 70 },
        { type: "earn", points: 350, desc: "HYD-DEL flight", daysAgo: 100 },
        { type: "earn", points: 200, desc: "In-flight purchase", daysAgo: 140 },
        { type: "redeem", points: -400, desc: "Baggage allowance upgrade", daysAgo: 180 },
        { type: "earn", points: 500, desc: "Festival travel bonus", daysAgo: 220 },
      ],
    },
    {
      accountIdx: 6, // Marriott
      transactions: [
        { type: "earn", points: 5500, desc: "2-night stay at JW Marriott Mumbai", daysAgo: 5 },
        { type: "earn", points: 3200, desc: "Courtyard by Marriott Bengaluru", daysAgo: 20 },
        { type: "earn", points: 8000, desc: "Westin Goa resort weekend", daysAgo: 45 },
        { type: "earn", points: 2000, desc: "Dining at hotel restaurant", daysAgo: 60 },
        { type: "redeem", points: -5000, desc: "Free night award - Fairfield", daysAgo: 80 },
        { type: "earn", points: 14300, desc: "HDFC credit card sign-up bonus", daysAgo: 100 },
        { type: "earn", points: 4000, desc: "Sheraton New Delhi stay", daysAgo: 140 },
        { type: "earn", points: 1800, desc: "Room upgrade bonus", daysAgo: 180 },
        { type: "redeem", points: -3500, desc: "Spa service redemption", daysAgo: 220 },
        { type: "earn", points: 6000, desc: "Quarter stay bonus", daysAgo: 260 },
        { type: "earn", points: 2500, desc: "Referral bonus", daysAgo: 300 },
        { type: "earn", points: 3200, desc: "Welcome gift", daysAgo: 350 },
      ],
    },
  ];

  for (const ts of transactionSets) {
    const account = accounts[ts.accountIdx];
    const program = programs[ts.accountIdx];
    for (const t of ts.transactions) {
      await prisma.rewardTransaction.create({
        data: {
          accountId: account.id,
          type: t.type,
          points: t.points,
          valueINR: Math.abs(t.points) * program.conversionRate,
          description: t.desc,
          transactionDate: pastDate(t.daysAgo),
        },
      });
    }
  }

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const program = programs[i];
    for (let m = 0; m < 12; m++) {
      const balanceAtMonth = account.balance * (1 - m * 0.06 + Math.random() * 0.04);
      await prisma.rewardValuation.create({
        data: {
          accountId: account.id,
          programId: program.id,
          pointsValued: Math.max(0, balanceAtMonth),
          inrValue: Math.max(0, balanceAtMonth) * program.conversionRate,
          redemptionEfficiency: 85 + Math.random() * 30,
          valuedAt: monthsAgoDate(m),
        },
      });
    }
  }

  const recommendations = [
    {
      type: "expiry_warning",
      title: "ICICI Points Expiring in 45 Days",
      description: "You have 3,200 ICICI Reward Points (₹800) expiring soon. Consider redeeming for Amazon vouchers at 1:1 value or transferring to InterMiles.",
      priority: "high",
    },
    {
      type: "expiry_warning",
      title: "IndiGo BluChip Points Expiring in 60 Days",
      description: "2,100 BluChip points (₹2,100) will expire in 2 months. Book a flight or use for seat upgrades before they lapse.",
      priority: "high",
    },
    {
      type: "optimization",
      title: "Transfer HDFC Points to Air India Miles",
      description: "Transfer 4,250 HDFC points to Air India at 1:1 ratio. Your Air India miles are worth ₹0.75/mile vs HDFC's ₹0.20/point — a 3.75x value multiplier.",
      priority: "high",
    },
    {
      type: "optimization",
      title: "Maximize Axis EDGE Rewards via Flipkart",
      description: "Axis EDGE Rewards give 5x on Flipkart. Your 12,800 points can be redeemed for ₹3,200 in Flipkart vouchers — the highest value redemption option.",
      priority: "medium",
    },
    {
      type: "insight",
      title: "SBI Rewardz Underutilized",
      description: "Your SBI card earns fewer rewards per ₹100 spent compared to Axis. Consider using Axis for online shopping and SBI primarily for fuel & grocery (2x categories).",
      priority: "medium",
    },
    {
      type: "card_recommendation",
      title: "Use HDFC for Travel Bookings",
      description: "HDFC SmartBuy portal offers 10x reward points on flights and hotels. Always book travel through SmartBuy to maximize point earnings.",
      priority: "medium",
    },
    {
      type: "portfolio_health",
      title: "Portfolio Diversification Alert",
      description: "63% of your reward value is concentrated in Air India miles and Marriott Bonvoy. Consider diversifying by redeeming some for liquid cashback.",
      priority: "low",
    },
    {
      type: "insight",
      title: "Marriott Points Sweet Spot",
      description: "Your 28,000 Bonvoy points are enough for 2 free nights at Category 3 properties or 1 night at Category 5. Weekend rates give the best cpp value.",
      priority: "medium",
    },
  ];

  for (const rec of recommendations) {
    await prisma.recommendation.create({
      data: {
        userId: user.id,
        ...rec,
      },
    });
  }

  const agentExecutions = [
    {
      agentName: "Reward Aggregator",
      workflowName: "Portfolio Analysis",
      status: "completed",
      input: JSON.stringify({ userId: user.id }),
      output: JSON.stringify({ totalValueINR: 73925, programsAnalyzed: 7 }),
      durationMs: 1250,
      executedAt: pastDate(1),
    },
    {
      agentName: "Valuation Agent",
      workflowName: "Portfolio Analysis",
      status: "completed",
      input: JSON.stringify({ userId: user.id }),
      output: JSON.stringify({ portfolioScore: 78, efficiency: "Good" }),
      durationMs: 2100,
      executedAt: pastDate(1),
    },
    {
      agentName: "Monitoring Agent",
      workflowName: "Expiry Detection",
      status: "completed",
      input: JSON.stringify({ userId: user.id }),
      output: JSON.stringify({ expiringAccounts: 2, totalAtRisk: 5300 }),
      durationMs: 800,
      executedAt: pastDate(2),
    },
    {
      agentName: "Optimization Agent",
      workflowName: "Redemption Optimization",
      status: "completed",
      input: JSON.stringify({ userId: user.id }),
      output: JSON.stringify({ recommendations: 3, potentialGain: 12500 }),
      durationMs: 3200,
      executedAt: pastDate(3),
    },
  ];

  for (const ae of agentExecutions) {
    await prisma.agentExecution.create({
      data: {
        userId: user.id,
        ...ae,
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log(`- 1 user created (arjun@rewardos.in / demo1234)`);
  console.log(`- 7 reward programs created`);
  console.log(`- 7 reward accounts created`);
  console.log(`- ${transactionSets.reduce((sum, ts) => sum + ts.transactions.length, 0)} transactions created`);
  console.log(`- ${accounts.length * 12} valuations created`);
  console.log(`- ${recommendations.length} recommendations created`);
  console.log(`- ${agentExecutions.length} agent executions created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
