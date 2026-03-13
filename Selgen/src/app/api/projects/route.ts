import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { projects, canvasData } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, session.user.id))
      .orderBy(projects.updatedAt)

    return NextResponse.json({ projects: userProjects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, settings } = body

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const projectId = crypto.randomUUID()
    
    const [newProject] = await db
      .insert(projects)
      .values({
        id: projectId,
        userId: session.user.id,
        name,
        description: description || '',
        settings: settings || {},
      })
      .returning()

    // Create initial empty canvas data
    await db.insert(canvasData).values({
      id: crypto.randomUUID(),
      projectId,
      canvasState: { items: [], position: { x: 0, y: 0 }, scale: 1 },
      version: 1,
    })

    return NextResponse.json({ project: newProject })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
