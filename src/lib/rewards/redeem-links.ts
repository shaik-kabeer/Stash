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
};

export function getRedeemLinks(bankName: string): RedeemLink[] {
  return BANK_REDEEM_LINKS[bankName] ?? [];
}

export function getAllRedeemLinks(): Record<string, RedeemLink[]> {
  return BANK_REDEEM_LINKS;
}
