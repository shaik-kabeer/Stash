import { MockProviderResponse } from "@/types";

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

export function fetchHDFC(): MockProviderResponse {
  return {
    provider: "HDFC",
    balance: 4250,
    lastUpdated: pastDate(1),
    tier: "Preferred",
    pointsName: "Reward Points",
    expiryDate: futureDate(180),
    transactions: [
      { date: pastDate(2), type: "earn", points: 350, description: "Amazon Shopping - 3x points" },
      { date: pastDate(5), type: "earn", points: 120, description: "Grocery at BigBasket" },
      { date: pastDate(12), type: "earn", points: 500, description: "Flight booking on MakeMyTrip" },
      { date: pastDate(18), type: "redeem", points: -200, description: "Statement credit redemption" },
      { date: pastDate(25), type: "earn", points: 80, description: "Fuel station transaction" },
      { date: pastDate(35), type: "earn", points: 220, description: "Dining at Mainland China" },
    ],
  };
}

export function fetchAxis(): MockProviderResponse {
  return {
    provider: "Axis",
    balance: 12800,
    lastUpdated: pastDate(1),
    tier: "Burgundy",
    pointsName: "EDGE Rewards",
    expiryDate: futureDate(365),
    transactions: [
      { date: pastDate(1), type: "earn", points: 640, description: "Online shopping - 5x EDGE Rewards" },
      { date: pastDate(4), type: "earn", points: 320, description: "Utility bill payment" },
      { date: pastDate(8), type: "earn", points: 1200, description: "International transaction bonus" },
      { date: pastDate(15), type: "earn", points: 200, description: "Swiggy food order" },
      { date: pastDate(22), type: "redeem", points: -500, description: "Amazon voucher redemption" },
      { date: pastDate(30), type: "earn", points: 450, description: "Flipkart sale purchase" },
    ],
  };
}

export function fetchSBI(): MockProviderResponse {
  return {
    provider: "SBI",
    balance: 8500,
    lastUpdated: pastDate(2),
    tier: "Elite",
    pointsName: "SBI Rewardz",
    expiryDate: futureDate(270),
    transactions: [
      { date: pastDate(3), type: "earn", points: 400, description: "Monthly spend bonus" },
      { date: pastDate(7), type: "earn", points: 250, description: "Electronics purchase" },
      { date: pastDate(14), type: "earn", points: 180, description: "Grocery shopping" },
      { date: pastDate(21), type: "earn", points: 600, description: "Travel booking bonus" },
      { date: pastDate(28), type: "redeem", points: -1000, description: "Gift card redemption" },
    ],
  };
}

export function fetchICICI(): MockProviderResponse {
  return {
    provider: "ICICI",
    balance: 3200,
    lastUpdated: pastDate(1),
    tier: "Sapphiro",
    pointsName: "Reward Points",
    expiryDate: futureDate(45),
    transactions: [
      { date: pastDate(2), type: "earn", points: 280, description: "Online subscription payment" },
      { date: pastDate(9), type: "earn", points: 150, description: "Restaurant dining" },
      { date: pastDate(16), type: "earn", points: 420, description: "Weekend shopping spree" },
      { date: pastDate(24), type: "redeem", points: -300, description: "Cashback redemption" },
    ],
  };
}

export function fetchAirIndia(): MockProviderResponse {
  return {
    provider: "Air India",
    balance: 45000,
    lastUpdated: pastDate(3),
    tier: "Gold",
    pointsName: "Flying Returns Miles",
    expiryDate: futureDate(540),
    transactions: [
      { date: pastDate(10), type: "earn", points: 8500, description: "DEL-BOM round trip" },
      { date: pastDate(30), type: "earn", points: 12000, description: "DEL-LHR international flight" },
      { date: pastDate(60), type: "earn", points: 4500, description: "BOM-BLR one way" },
      { date: pastDate(90), type: "earn", points: 15000, description: "Welcome bonus miles" },
      { date: pastDate(120), type: "earn", points: 5000, description: "Credit card transfer miles" },
    ],
  };
}

export function fetchIndiGo(): MockProviderResponse {
  return {
    provider: "IndiGo",
    balance: 2100,
    lastUpdated: pastDate(5),
    tier: "Plus",
    pointsName: "BluChip Points",
    expiryDate: futureDate(60),
    transactions: [
      { date: pastDate(7), type: "earn", points: 450, description: "DEL-BLR flight" },
      { date: pastDate(20), type: "earn", points: 300, description: "Add-on meal & seat selection" },
      { date: pastDate(40), type: "earn", points: 600, description: "BOM-GOA flight" },
      { date: pastDate(55), type: "redeem", points: -250, description: "Seat upgrade redemption" },
      { date: pastDate(70), type: "earn", points: 1000, description: "Promotional bonus" },
    ],
  };
}

export function fetchMarriott(): MockProviderResponse {
  return {
    provider: "Marriott",
    balance: 28000,
    lastUpdated: pastDate(2),
    tier: "Platinum Elite",
    pointsName: "Bonvoy Points",
    expiryDate: futureDate(730),
    transactions: [
      { date: pastDate(5), type: "earn", points: 5500, description: "2-night stay at JW Marriott Mumbai" },
      { date: pastDate(20), type: "earn", points: 3200, description: "Courtyard Bengaluru stay" },
      { date: pastDate(45), type: "earn", points: 8000, description: "Westin Goa resort weekend" },
      { date: pastDate(60), type: "earn", points: 2000, description: "Dining at hotel restaurant" },
      { date: pastDate(80), type: "redeem", points: -5000, description: "Free night award" },
      { date: pastDate(100), type: "earn", points: 14300, description: "Credit card sign-up bonus" },
    ],
  };
}

export const allProviders = {
  hdfc: fetchHDFC,
  axis: fetchAxis,
  sbi: fetchSBI,
  icici: fetchICICI,
  airindia: fetchAirIndia,
  indigo: fetchIndiGo,
  marriott: fetchMarriott,
};
