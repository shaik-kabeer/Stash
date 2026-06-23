import { prisma } from "./lib/db.js";

interface SourceSeed {
  url: string;
  bankCode: string;
  pageType: string;
}

const SOURCES: SourceSeed[] = [
  // HDFC Bank
  { url: "https://www.hdfcbank.com/personal/pay/cards/credit-cards", bankCode: "HDFC", pageType: "card_page" },
  { url: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold-credit-card", bankCode: "HDFC", pageType: "card_page" },
  { url: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/millennia-credit-card", bankCode: "HDFC", pageType: "card_page" },
  { url: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/infinia-credit-card", bankCode: "HDFC", pageType: "card_page" },
  { url: "https://www.hdfcbank.com/personal/offers/card-offers", bankCode: "HDFC", pageType: "offers" },

  // Axis Bank
  { url: "https://www.axisbank.com/retail/cards/credit-card", bankCode: "AXIS", pageType: "card_page" },
  { url: "https://www.axisbank.com/retail/cards/credit-card/axis-bank-magnus-credit-card", bankCode: "AXIS", pageType: "card_page" },
  { url: "https://www.axisbank.com/retail/cards/credit-card/axis-bank-atlas-credit-card", bankCode: "AXIS", pageType: "card_page" },
  { url: "https://www.axisbank.com/retail/cards/credit-card/offers", bankCode: "AXIS", pageType: "offers" },

  // SBI Card
  { url: "https://www.sbicard.com/en/personal/credit-cards.page", bankCode: "SBI", pageType: "card_page" },
  { url: "https://www.sbicard.com/en/personal/credit-cards/cashback/sbi-card-cashback.page", bankCode: "SBI", pageType: "card_page" },
  { url: "https://www.sbicard.com/en/personal/offers.page", bankCode: "SBI", pageType: "offers" },

  // ICICI Bank
  { url: "https://www.icicibank.com/credit-card", bankCode: "ICICI", pageType: "card_page" },
  { url: "https://www.icicibank.com/credit-card/amazon-pay-credit-card", bankCode: "ICICI", pageType: "card_page" },
  { url: "https://www.icicibank.com/offers/credit-card-offers", bankCode: "ICICI", pageType: "offers" },

  // IDFC FIRST Bank
  { url: "https://www.idfcfirstbank.com/credit-card", bankCode: "IDFC", pageType: "card_page" },
  { url: "https://www.idfcfirstbank.com/credit-card/wealth-credit-card", bankCode: "IDFC", pageType: "card_page" },
  { url: "https://www.idfcfirstbank.com/offers", bankCode: "IDFC", pageType: "offers" },

  // AU Small Finance Bank
  { url: "https://www.aubank.in/credit-card", bankCode: "AU", pageType: "card_page" },
  { url: "https://www.aubank.in/credit-card/zenith-plus-credit-card", bankCode: "AU", pageType: "card_page" },
  { url: "https://www.aubank.in/offers", bankCode: "AU", pageType: "offers" },
];

async function seedSources() {
  console.log("Seeding source pages...");

  const banks = await prisma.bank.findMany();
  const bankMap = new Map(banks.map((b) => [b.code, b.id]));

  let created = 0;
  let skipped = 0;

  for (const src of SOURCES) {
    const existing = await prisma.sourcePage.findUnique({ where: { url: src.url } });
    if (existing) {
      skipped++;
      continue;
    }

    const bankId = bankMap.get(src.bankCode);
    await prisma.sourcePage.create({
      data: {
        url: src.url,
        bankId: bankId ?? null,
        pageType: src.pageType,
        status: "pending",
      },
    });
    created++;
    console.log(`  + ${src.url}`);
  }

  console.log(`\nDone. Created: ${created}, Skipped (existing): ${skipped}`);
  console.log(`Total source pages: ${await prisma.sourcePage.count()}`);
}

seedSources()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
