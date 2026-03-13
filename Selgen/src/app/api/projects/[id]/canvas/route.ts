import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { projects, canvasData } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get canvas data
    const [canvas] = await db
      .select()
      .from(canvasData)
      .where(eq(canvasData.projectId, id))

    return NextResponse.json({ canvasData: canvas })
  } catch (error) {
    console.error('Error fetching canvas data:', error)
    return NextResponse.json({ error: 'Failed to fetch canvas data' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { canvasState } = body

    // Check project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if canvas data exists
    const [existingCanvas] = await db
      .select()
      .from(canvasData)
      .where(eq(canvasData.projectId, id))

    if (existingCanvas) {
      // Update existing
      const [updated] = await db
        .update(canvasData)
        .set({
          canvasState,
          version: (existingCanvas?.version ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(canvasData.projectId, id))
        .returning()

      return NextResponse.json({ canvasData: updated })
    } else {
      // Create new
      const [created] = await db
        .insert(canvasData)
        .values({
          id: crypto.randomUUID(),
          projectId: id,
          canvasState,
          version: 1,
        })
        .returning()

      return NextResponse.json({ canvasData: created })
    }
  } catch (error) {
    console.error('Error saving canvas data:', error)
    return NextResponse.json({ error: 'Failed to save canvas data' }, { status: 500 })
  }
}
