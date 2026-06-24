import { prisma } from "../src/cli/lib/db.js";

const MERCHANT_CATEGORIES: { code: string; name: string; group: string; description: string }[] = [
  { code: "dining", name: "Dining", group: "food", description: "Restaurants, cafes, and food delivery" },
  { code: "fuel", name: "Fuel", group: "transport", description: "Petrol, diesel, and gas stations" },
  { code: "grocery", name: "Grocery", group: "food", description: "Supermarkets and grocery stores" },
  { code: "travel", name: "Travel", group: "travel", description: "General travel and tourism spends" },
  { code: "flights", name: "Flights", group: "travel", description: "Airline tickets and flight bookings" },
  { code: "hotels", name: "Hotels", group: "travel", description: "Hotel stays and accommodation" },
  { code: "amazon", name: "Amazon", group: "shopping", description: "Amazon.in and Amazon Pay purchases" },
  { code: "flipkart", name: "Flipkart", group: "shopping", description: "Flipkart online shopping" },
  { code: "swiggy", name: "Swiggy", group: "food", description: "Swiggy food delivery orders" },
  { code: "zomato", name: "Zomato", group: "food", description: "Zomato food delivery and dining" },
  { code: "uber", name: "Uber", group: "transport", description: "Uber rides and Uber Eats" },
  { code: "insurance", name: "Insurance", group: "finance", description: "Insurance premiums and policies" },
  { code: "utilities", name: "Utilities", group: "utilities", description: "Electricity, water, and utility bills" },
  { code: "education", name: "Education", group: "lifestyle", description: "School fees, courses, and education" },
  { code: "medical", name: "Medical", group: "lifestyle", description: "Hospitals, clinics, and healthcare" },
  { code: "entertainment", name: "Entertainment", group: "lifestyle", description: "Movies, streaming, and events" },
  { code: "fashion", name: "Fashion", group: "shopping", description: "Clothing, footwear, and accessories" },
  { code: "electronics", name: "Electronics", group: "shopping", description: "Electronics and gadgets" },
  { code: "international", name: "International", group: "travel", description: "Foreign currency and overseas spends" },
  { code: "government", name: "Government", group: "finance", description: "Government fees, taxes, and services" },
  { code: "telecom", name: "Telecom", group: "utilities", description: "Mobile recharges and telecom bills" },
  { code: "pharmacy", name: "Pharmacy", group: "lifestyle", description: "Pharmacies and medicines" },
  { code: "furniture", name: "Furniture", group: "shopping", description: "Furniture and home furnishings" },
  { code: "sports", name: "Sports", group: "lifestyle", description: "Sports equipment and fitness" },
  { code: "books", name: "Books", group: "shopping", description: "Books and stationery" },
  { code: "subscriptions", name: "Subscriptions", group: "lifestyle", description: "Digital subscriptions and memberships" },
  { code: "jewelry", name: "Jewelry", group: "shopping", description: "Jewelry and precious metals" },
  { code: "automobile", name: "Automobile", group: "transport", description: "Vehicle purchases and servicing" },
  { code: "charity", name: "Charity", group: "lifestyle", description: "Charitable donations" },
  { code: "rent", name: "Rent", group: "finance", description: "Rent and housing payments" },
];

async function main() {
  console.log("Deleting existing merchant categories...");
  await prisma.merchantCategory.deleteMany();

  console.log("Seeding merchant categories...");
  for (const cat of MERCHANT_CATEGORIES) {
    await prisma.merchantCategory.create({ data: cat });
  }

  const count = await prisma.merchantCategory.count();
  console.log(`Done. Seeded ${count} merchant categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
