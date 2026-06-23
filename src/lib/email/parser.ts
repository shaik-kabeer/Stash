import { simpleParser, type ParsedMail } from "mailparser";

export interface ParsedRewardEmail {
  from: string;
  subject: string;
  date: Date | null;
  bank: string | null;
  extractedBalances: ExtractedBalance[];
  extractedTransactions: ExtractedTransaction[];
  rawText: string;
}

export interface ExtractedBalance {
  programName: string;
  pointName: string;
  balance: number;
  confidence: number;
}

export interface ExtractedTransaction {
  merchant: string;
  amount: number;
  pointsEarned: number | null;
  date: string | null;
}

const BANK_PATTERNS: { bank: string; patterns: RegExp[] }[] = [
  { bank: "HDFC Bank", patterns: [/hdfc/i, /hdfcbank/i, /smartbuy/i] },
  { bank: "Axis Bank", patterns: [/axis\s*bank/i, /axisbank/i, /edge\s*reward/i] },
  { bank: "SBI Card", patterns: [/sbi\s*card/i, /sbicard/i] },
  { bank: "ICICI Bank", patterns: [/icici/i, /payback/i] },
  { bank: "IDFC FIRST Bank", patterns: [/idfc/i, /idfc\s*first/i] },
  { bank: "AU Small Finance Bank", patterns: [/au\s*(small|bank)/i, /aubank/i] },
  { bank: "Kotak Mahindra Bank", patterns: [/kotak/i] },
  { bank: "Yes Bank", patterns: [/yes\s*bank/i] },
  { bank: "IndusInd Bank", patterns: [/indusind/i] },
  { bank: "American Express", patterns: [/amex/i, /american\s*express/i] },
];

const BALANCE_PATTERNS: { pattern: RegExp; pointName: string }[] = [
  { pattern: /reward\s*points?\s*(?:balance|available|earned|total)\s*[:\-=]?\s*([\d,]+)/i, pointName: "Reward Points" },
  { pattern: /(?:balance|available|earned|total)\s*(?:reward)?\s*points?\s*[:\-=]?\s*([\d,]+)/i, pointName: "Reward Points" },
  { pattern: /(?:you\s+have|your)\s+([\d,]+)\s*(?:reward)?\s*points?/i, pointName: "Reward Points" },
  { pattern: /edge\s*(?:reward)?\s*(?:miles|points)\s*[:\-=]?\s*([\d,]+)/i, pointName: "EDGE Miles" },
  { pattern: /cashback\s*(?:balance|earned|available)\s*[:\-=]?\s*₹?\s*([\d,]+\.?\d*)/i, pointName: "Cashback" },
  { pattern: /miles?\s*(?:balance|earned|available)\s*[:\-=]?\s*([\d,]+)/i, pointName: "Miles" },
  { pattern: /([\d,]+)\s*(?:reward)?\s*points?\s*(?:have\s+been|were|are)\s+(?:credited|added|earned)/i, pointName: "Reward Points" },
  { pattern: /(?:total|cumulative)\s*(?:reward)?\s*points?\s*[:\-=]?\s*([\d,]+)/i, pointName: "Reward Points" },
];

const TRANSACTION_PATTERN = /(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)\s+(?:at|on|towards|for)\s+(.+?)(?:\s+on\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}))?/gi;
const POINTS_EARNED_PATTERN = /([\d,]+)\s*(?:reward)?\s*points?\s*(?:earned|credited|added)/gi;

function detectBank(text: string, from: string): string | null {
  const combined = `${from} ${text}`.toLowerCase();
  for (const { bank, patterns } of BANK_PATTERNS) {
    if (patterns.some((p) => p.test(combined))) return bank;
  }
  return null;
}

function extractBalances(text: string): ExtractedBalance[] {
  const results: ExtractedBalance[] = [];
  const seen = new Set<number>();

  for (const { pattern, pointName } of BALANCE_PATTERNS) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      const balance = parseFloat(match[1].replace(/,/g, ""));
      if (balance > 0 && !seen.has(balance)) {
        seen.add(balance);
        results.push({
          programName: pointName,
          pointName,
          balance,
          confidence: balance > 100 && balance < 1000000 ? 0.8 : 0.5,
        });
      }
    }
  }

  return results;
}

function extractTransactions(text: string): ExtractedTransaction[] {
  const results: ExtractedTransaction[] = [];
  let match: RegExpExecArray | null;

  while ((match = TRANSACTION_PATTERN.exec(text)) !== null) {
    results.push({
      amount: parseFloat(match[1].replace(/,/g, "")),
      merchant: match[2].trim().slice(0, 100),
      pointsEarned: null,
      date: match[3] ?? null,
    });
  }

  const pointsMatches: RegExpExecArray[] = [];
  let pm: RegExpExecArray | null;
  while ((pm = POINTS_EARNED_PATTERN.exec(text)) !== null) {
    pointsMatches.push(pm);
  }

  if (pointsMatches.length === 1 && results.length > 0) {
    results[0].pointsEarned = parseInt(pointsMatches[0][1].replace(/,/g, ""));
  }

  return results.slice(0, 20);
}

export async function parseRewardEmail(source: string | Buffer): Promise<ParsedRewardEmail> {
  let parsed: ParsedMail;

  if (typeof source === "string" && !source.includes("\n") && !source.startsWith("From:")) {
    parsed = await simpleParser(Buffer.from(source, "utf-8"));
  } else {
    parsed = await simpleParser(source);
  }

  const textContent = parsed.text ?? "";
  const htmlContent = typeof parsed.html === "string" ? parsed.html : "";
  const rawText = textContent || htmlContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  const from = typeof parsed.from?.text === "string" ? parsed.from.text : "";
  const subject = parsed.subject ?? "";
  const date = parsed.date ?? null;

  const bank = detectBank(`${from} ${subject} ${rawText}`, from);
  const extractedBalances = extractBalances(rawText);
  const extractedTransactions = extractTransactions(rawText);

  if (bank && extractedBalances.length > 0) {
    for (const b of extractedBalances) {
      b.programName = `${bank} ${b.pointName}`;
      b.confidence = Math.min(b.confidence + 0.1, 1.0);
    }
  }

  return {
    from,
    subject,
    date,
    bank,
    extractedBalances,
    extractedTransactions,
    rawText: rawText.slice(0, 5000),
  };
}

export async function parseRawText(text: string, subjectHint?: string): Promise<ParsedRewardEmail> {
  const bank = detectBank(text, subjectHint ?? "");
  const extractedBalances = extractBalances(text);
  const extractedTransactions = extractTransactions(text);

  if (bank && extractedBalances.length > 0) {
    for (const b of extractedBalances) {
      b.programName = `${bank} ${b.pointName}`;
    }
  }

  return {
    from: "",
    subject: subjectHint ?? "",
    date: new Date(),
    bank,
    extractedBalances,
    extractedTransactions,
    rawText: text.slice(0, 5000),
  };
}
