export interface RewardProgramData {
  id: string;
  name: string;
  provider: string;
  type: string;
  conversionRate: number;
  currencyEquivalent: string;
  expiryRules: string | null;
  transferPartners: string | null;
  category: string;
  logoUrl: string | null;
  color: string | null;
  isActive: boolean;
}

export interface RewardAccountData {
  id: string;
  userId: string;
  programId: string;
  balance: number;
  estimatedValueINR: number;
  lastSynced: string;
  expiryDate: string | null;
  status: string;
  tier: string | null;
  program: RewardProgramData;
}

export interface RewardTransactionData {
  id: string;
  accountId: string;
  type: string;
  points: number;
  valueINR: number;
  description: string;
  transactionDate: string;
}

export interface PortfolioSummary {
  totalValueINR: number;
  totalPoints: number;
  expiringCount: number;
  monthlyGrowthPercent: number;
  accountCount: number;
}

export interface AssetAllocationItem {
  provider: string;
  value: number;
  percent: number;
  color: string;
}

export interface MonthlyGrowthPoint {
  month: string;
  value: number;
}

export interface RecommendationData {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface MockProviderResponse {
  provider: string;
  balance: number;
  lastUpdated: string;
  transactions: {
    date: string;
    type: string;
    points: number;
    description: string;
  }[];
  expiryDate: string | null;
  tier: string;
  pointsName: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  agentName?: string;
  workflowName?: string;
}
