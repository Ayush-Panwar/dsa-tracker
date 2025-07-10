import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@lib/supabase/server";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// Generate a random token
function generateToken() {
  return randomBytes(32).toString('hex');
}

// POST /api/extension/token - Generate a new token for extension
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { name } = body;

    // Generate a token
    const token = generateToken();

    // Save the token
    const extensionToken = await prisma.extensionToken.create({
      data: {
        token,
        name: name || "Extension",
        lastUsed: new Date(),
        userId: user.id,
      },
    });

    return NextResponse.json({
      token: extensionToken.token,
      id: extensionToken.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Error generating extension token:", error);
    return NextResponse.json(
      { error: "Failed to generate extension token" },
      { status: 500 }
    );
  }
}

// GET /api/extension/token - Get all tokens for user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get tokens
    const tokens = await prisma.extensionToken.findMany({
      where: {
        userId: user.id,
        revoked: false,
      },
      select: {
        id: true,
        name: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("Error fetching extension tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch extension tokens" },
      { status: 500 }
    );
  }
} 