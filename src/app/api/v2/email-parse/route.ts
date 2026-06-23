import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseRewardEmail, parseRawText } from "@/lib/email/parser";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") ?? "";

    let result;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      result = await parseRewardEmail(buffer);
    } else {
      const body = await req.json();
      if (body.rawText) {
        result = await parseRawText(body.rawText, body.subject);
      } else if (body.emlContent) {
        result = await parseRewardEmail(body.emlContent);
      } else {
        return NextResponse.json({ error: "Provide rawText, emlContent, or upload a .eml file" }, { status: 400 });
      }
    }

    let autoUpdated = 0;
    if (result.bank && result.extractedBalances.length > 0) {
      for (const bal of result.extractedBalances) {
        if (bal.confidence < 0.7) continue;

        const program = await prisma.normalizedProgram.findFirst({
          where: {
            card: { bank: { name: { contains: result.bank!.split(" ")[0] } } },
          },
        });

        if (program) {
          await prisma.userReward.upsert({
            where: { userId_programId: { userId, programId: program.id } },
            update: { balance: bal.balance, lastSynced: new Date() },
            create: { userId, programId: program.id, balance: bal.balance },
          });
          autoUpdated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      parsed: {
        from: result.from,
        subject: result.subject,
        date: result.date,
        bank: result.bank,
        balancesFound: result.extractedBalances.length,
        transactionsFound: result.extractedTransactions.length,
      },
      extractedBalances: result.extractedBalances,
      extractedTransactions: result.extractedTransactions,
      autoUpdated,
    });
  } catch (error) {
    console.error("POST /api/v2/email-parse error:", error);
    return NextResponse.json({ error: "Email parsing failed" }, { status: 500 });
  }
}
