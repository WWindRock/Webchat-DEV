import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { userAssets, usageLogs, users } from '@/lib/db/schema'
import { eq, and, desc, sum, count, gte, lte, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))

    const assets = await db
      .select()
      .from(userAssets)
      .where(eq(userAssets.userId, session.user.id))
      .orderBy(desc(userAssets.createdAt))
      .limit(50)

    const assetStats = await db
      .select({
        type: userAssets.type,
        count: count(),
      })
      .from(userAssets)
      .where(eq(userAssets.userId, session.user.id))
      .groupBy(userAssets.type)

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const usageThisMonth = await db
      .select({
        totalCredits: sum(usageLogs.creditsUsed),
      })
      .from(usageLogs)
      .where(and(
        eq(usageLogs.userId, session.user.id),
        gte(usageLogs.createdAt, thisMonthStart)
      ))

    const usageLast30Days = await db
      .select({
        date: sql<string>`DATE(${usageLogs.createdAt})`,
        totalCredits: sum(usageLogs.creditsUsed),
      })
      .from(usageLogs)
      .where(and(
        eq(usageLogs.userId, session.user.id),
        gte(usageLogs.createdAt, last30Days)
      ))
      .groupBy(sql`DATE(${usageLogs.createdAt})`)
      .orderBy(sql`DATE(${usageLogs.createdAt})`)

    return NextResponse.json({
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        subscriptionTier: user.subscriptionTier,
        creditsRemaining: user.creditsRemaining,
        creditsUsed: user.creditsUsed,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      } : null,
      assets,
      assetStats: assetStats.reduce((acc, stat) => {
        acc[stat.type] = stat.count
        return acc
      }, {} as Record<string, number>),
      usage: {
        thisMonth: usageThisMonth[0]?.totalCredits || 0,
        last30Days: usageLast30Days.map(u => ({
          date: u.date,
          credits: u.totalCredits || 0,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
