import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Subscription tier enum - use text instead
// export const subscriptionTierEnum = sqliteEnum('subscription_tier', ['free', 'pro', 'enterprise'])

// User table (extends NextAuth)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'timestamp' }),
  image: text('image'),
  subscriptionTier: text('subscription_tier').default('free'),
  creditsRemaining: integer('credits_remaining').default(100),
  creditsUsed: integer('credits_used').default(0),
  subscriptionExpiresAt: integer('subscription_expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Account table (for OAuth and credentials)
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
  password: text('password'),
})

// Session table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
})

// Verification Token table
export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
})

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  settings: text('settings', { mode: 'json' }).default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Canvas data table
export const canvasData = sqliteTable('canvas_data', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull(),
  canvasState: text('canvas_state', { mode: 'json' }).notNull(),
  version: integer('version').default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Scheduled tasks table
export const scheduledTasks = sqliteTable('scheduled_tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  projectId: text('project_id'),
  name: text('name').notNull(),
  taskConfig: text('task_config', { mode: 'json' }).notNull(),
  scheduleExpression: text('schedule_expression'),
  isActive: integer('is_active', { mode: 'boolean' }).default(1),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  nextRunAt: integer('next_run_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// User assets table
export const userAssets = sqliteTable('user_assets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  projectId: text('project_id'),
  taskId: text('task_id'),
  type: text('type').notNull(),
  title: text('title'),
  description: text('description'),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
  fileSize: integer('file_size'),
  creditsCost: integer('credits_cost').default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Usage logs table
export const usageLogs = sqliteTable('usage_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  projectId: text('project_id'),
  action: text('action').notNull(),
  creditsUsed: integer('credits_used').default(0),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Conversations table
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  projectId: text('project_id'),
  title: text('title').notNull(),
  context: text('context', { mode: 'json' }).default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Messages table
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversation_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  type: text('type').default('text'),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Agent memories table
export const agentMemories = sqliteTable('agent_memories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  projectId: text('project_id'),
  conversationId: text('conversation_id'),
  memoryType: text('memory_type').notNull(),
  content: text('content').notNull(),
  importance: integer('importance').default(1),
  vectorId: text('vector_id'),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  projects: many(projects),
  assets: many(userAssets),
  usageLogs: many(usageLogs),
  conversations: many(conversations),
  memories: many(agentMemories),
  scheduledTasks: many(scheduledTasks),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  canvasData: many(canvasData),
  conversations: many(conversations),
  assets: many(userAssets),
  scheduledTasks: many(scheduledTasks),
}))

export const canvasDataRelations = relations(canvasData, ({ one }) => ({
  project: one(projects, {
    fields: [canvasData.projectId],
    references: [projects.id],
  }),
}))

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [conversations.projectId],
    references: [projects.id],
  }),
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}))

export const userAssetsRelations = relations(userAssets, ({ one }) => ({
  user: one(users, {
    fields: [userAssets.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [userAssets.projectId],
    references: [projects.id],
  }),
}))

export const scheduledTasksRelations = relations(scheduledTasks, ({ one }) => ({
  user: one(users, {
    fields: [scheduledTasks.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [scheduledTasks.projectId],
    references: [projects.id],
  }),
}))

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  user: one(users, {
    fields: [usageLogs.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [usageLogs.projectId],
    references: [projects.id],
  }),
}))

export const agentMemoriesRelations = relations(agentMemories, ({ one }) => ({
  user: one(users, {
    fields: [agentMemories.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [agentMemories.projectId],
    references: [projects.id],
  }),
  conversation: one(conversations, {
    fields: [agentMemories.conversationId],
    references: [conversations.id],
  }),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type CanvasData = typeof canvasData.$inferSelect
export type NewCanvasData = typeof canvasData.$inferInsert
export type ScheduledTask = typeof scheduledTasks.$inferSelect
export type NewScheduledTask = typeof scheduledTasks.$inferInsert
export type UserAsset = typeof userAssets.$inferSelect
export type NewUserAsset = typeof userAssets.$inferInsert
export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type AgentMemory = typeof agentMemories.$inferSelect
export type NewAgentMemory = typeof agentMemories.$inferInsert
export type UsageLog = typeof usageLogs.$inferSelect
export type NewUsageLog = typeof usageLogs.$inferInsert
