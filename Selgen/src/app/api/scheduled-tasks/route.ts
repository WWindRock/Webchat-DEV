import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { scheduledTasks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import cron from 'cronstrue'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await db
      .select()
      .from(scheduledTasks)
      .where(eq(scheduledTasks.userId, session.user.id))
      .orderBy(scheduledTasks.createdAt)

    const formattedTasks = tasks.map(task => ({
      ...task,
      scheduleDescription: task.scheduleExpression 
        ? cron.toString(task.scheduleExpression)
        : null,
    }))

    return NextResponse.json({ tasks: formattedTasks })
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, taskConfig, scheduleExpression, projectId } = body

    if (!name || !taskConfig) {
      return NextResponse.json(
        { error: 'Name and task config are required' },
        { status: 400 }
      )
    }

    const nextRunAt = calculateNextRun(scheduleExpression)

    const [task] = await db
      .insert(scheduledTasks)
      .values({
        userId: session.user.id,
        projectId: projectId || null,
        name,
        taskConfig,
        scheduleExpression: scheduleExpression || null,
        isActive: true,
        nextRunAt,
      })
      .returning()

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error creating scheduled task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, isActive, name, scheduleExpression } = body

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const updates: any = {}
    if (isActive !== undefined) updates.isActive = isActive
    if (name) updates.name = name
    if (scheduleExpression) {
      updates.scheduleExpression = scheduleExpression
      updates.nextRunAt = calculateNextRun(scheduleExpression)
    }

    const [task] = await db
      .update(scheduledTasks)
      .set(updates)
      .where(and(
        eq(scheduledTasks.id, id),
        eq(scheduledTasks.userId, session.user.id)
      ))
      .returning()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating scheduled task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    await db
      .delete(scheduledTasks)
      .where(and(
        eq(scheduledTasks.id, id),
        eq(scheduledTasks.userId, session.user.id)
      ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scheduled task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}

function calculateNextRun(expression: string | null): Date | null {
  if (!expression) return null

  try {
    const now = new Date()
    const parts = expression.split(' ')
    
    if (parts.length < 5) return null

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
    
    const next = new Date(now)
    next.setSeconds(0)
    next.setMilliseconds(0)

    if (minute !== '*') next.setMinutes(parseInt(minute))
    else next.setMinutes(next.getMinutes() + 1)

    if (hour !== '*') next.setHours(parseInt(hour))
    
    if (dayOfMonth !== '*') next.setDate(parseInt(dayOfMonth))
    if (month !== '*') next.setMonth(parseInt(month) - 1)
    if (dayOfWeek !== '*') next.setDate(next.getDate() + (parseInt(dayOfWeek) - next.getDay()))

    if (next <= now) {
      next.setHours(next.getHours() + 1)
    }

    return next
  } catch {
    return null
  }
}
