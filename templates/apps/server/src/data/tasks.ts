import type { TaskDetail, TaskListItem } from '@contracts/core'
import type { Context } from '../trpc/context'

export async function listTasks(ctx: Context): Promise<TaskListItem[]> {
  const items = await ctx.store.list()
  return items
}

export async function createTask(ctx: Context, text: string): Promise<TaskDetail> {
  const inferred = await ctx.llm.annotateTask(text)
  return ctx.store.create({ text, inferred })
}


