export interface RedeemLink {
  bank: string;
  label: string;
  url: string;
  type: "portal" | "smartbuy" | "catalog" | "transfer";
}

const BANK_REDEEM_LINKS: Record<string, RedeemLink[]> = {
  "HDFC Bank": [
    { bank: "HDFC", label: "SmartBuy Portal", url: "https://offers.smartbuy.hdfcbank.com/", type: "smartbuy" },
    { bank: "HDFC", label: "Redeem Reward Points", url: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/credit-card-rewards", type: "portal" },
    { bank: "HDFC", label: "HDFC Rewards Catalog", url: "https://hdfcbankdiningleagues.com/", type: "catalog" },
  ],
  "Axis Bank": [
    { bank: "Axis", label: "EDGE Rewards Portal", url: "https://www.axisbank.com/retail/cards/credit-card/rewards", type: "portal" },
    { bank: "Axis", label: "Grab Deals", url: "https://grabdeals.in/", type: "smartbuy" },
    { bank: "Axis", label: "EDGE Loyalty Portal", url: "https://edgerewards.axisbank.co.in/", type: "catalog" },
  ],
  "SBI Card": [
    { bank: "SBI", label: "SBI Card Rewards", url: "https://www.sbicard.com/en/personal/rewards.page", type: "portal" },
    { bank: "SBI", label: "Redeem Points", url: "https://www.sbicard.com/en/personal/rewards/redeem-reward-points.page", type: "catalog" },
  ],
  "ICICI Bank": [
    { bank: "ICICI", label: "ICICI Payback Portal", url: "https://www.icicibank.com/Personal-Banking/cards/Consumer-Cards/Credit-Card/reward-points", type: "portal" },
    { bank: "ICICI", label: "iMobile Rewards", url: "https://www.icicibank.com/personal-banking/cards/credit-card/rewards", type: "catalog" },
  ],
  "IDFC FIRST Bank": [
    { bank: "IDFC", label: "IDFC FIRST Rewards", url: "https://www.idfcfirstbank.com/credit-card/rewards", type: "portal" },
    { bank: "IDFC", label: "Redeem Rewards", url: "https://my.idfcfirstbank.com/", type: "catalog" },
  ],
  "AU Small Finance Bank": [
    { bank: "AU", label: "AU Bank Rewards", url: "https://www.aubank.in/credit-card/rewards", type: "portal" },
  ],
  "Kotak Mahindra Bank": [
    { bank: "Kotak", label: "Kotak Rewards", url: "https://www.kotak.com/en/personal-banking/cards/credit-cards/credit-card-reward-points.html", type: "portal" },
  ],
  "YES Bank": [
    { bank: "YES", label: "YES FIRST Rewards", url: "https://www.yesbank.in/personal-banking/yes-first/rewards", type: "portal" },
  ],
  "IndusInd Bank": [
    { bank: "IndusInd", label: "IndusInd Rewards", url: "https://www.indusind.com/in/en/personal/cards/credit-card/reward-points.html", type: "portal" },
  ],
  "RBL Bank": [
    { bank: "RBL", label: "RBL Rewards", url: "https://www.rblbank.com/credit-cards/rewards", type: "portal" },
  ],
  "Standard Chartered": [
    { bank: "SC", label: "SC Rewards", url: "https://www.sc.com/in/credit-cards/rewards/", type: "portal" },
  ],
  "HSBC": [
    { bank: "HSBC", label: "HSBC Rewards", url: "https://www.hsbc.co.in/credit-cards/rewards/", type: "portal" },
  ],
  "Citibank": [
    { bank: "Citi", label: "Citi Rewards", url: "https://www.online.citibank.co.in/credit-card/rewards/rewards.htm", type: "portal" },
  ],
  "Federal Bank": [
    { bank: "Federal", label: "Federal Rewards", url: "https://www.federalbank.co.in/credit-card", type: "portal" },
  ],
  "Bank of Baroda": [
    { bank: "BOB", label: "BOB Rewards", url: "https://www.bankofbaroda.in/personal-banking/digital-products/cards/credit-cards", type: "portal" },
  ],
};

const PROGRAM_REDEEM_LINKS: Record<string, RedeemLink[]> = {
  "HDFC SmartBuy": [
    { bank: "HDFC", label: "SmartBuy Travel", url: "https://offers.smartbuy.hdfcbank.com/flights", type: "smartbuy" },
    { bank: "HDFC", label: "SmartBuy Hotels", url: "https://offers.smartbuy.hdfcbank.com/hotels", type: "smartbuy" },
    { bank: "HDFC", label: "SmartBuy Amazon", url: "https://offers.smartbuy.hdfcbank.com/amazon", type: "smartbuy" },
  ],
  "Axis EDGE": [
    { bank: "Axis", label: "EDGE Rewards", url: "https://edgerewards.axisbank.co.in/", type: "portal" },
    { bank: "Axis", label: "EDGE Travel", url: "https://grabdeals.in/flights", type: "smartbuy" },
  ],
  "SBI Reward Points": [
    { bank: "SBI", label: "SBI Rewards Portal", url: "https://www.sbicard.com/en/personal/rewards/redeem-reward-points.page", type: "portal" },
  ],
  "ICICI Payback": [
    { bank: "ICICI", label: "ICICI Rewards", url: "https://www.icicibank.com/personal-banking/cards/credit-card/rewards", type: "portal" },
  ],
  "IDFC FIRST Rewards": [
    { bank: "IDFC", label: "IDFC Rewards", url: "https://my.idfcfirstbank.com/", type: "portal" },
  ],
};

export function getRedeemLinks(bankName: string): RedeemLink[] {
  return BANK_REDEEM_LINKS[bankName] ?? [];
}

export function getRedeemLinksForProgram(programName: string): RedeemLink[] {
  for (const [key, links] of Object.entries(PROGRAM_REDEEM_LINKS)) {
    if (programName.toLowerCase().includes(key.toLowerCase())) return links;
  }
  return [];
}

export function getAllRedeemLinks(): Record<string, RedeemLink[]> {
  return BANK_REDEEM_LINKS;
}
