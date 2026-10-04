/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'

/**
 * One item of an ordered sequence, as the renumber sees it. `id` is null for an
 * item the backend does not know yet: it still takes a position, it is just not
 * written.
 */
export interface SequenceItem {
  id: string | null
  order: number
  label: string
}

export interface RenumberOptions {
  // REST collection to PATCH each item's order onto.
  endpoint: string
  // Field name carrying the order value (usually 'order').
  orderField: string
  // Value given to the first item. Courses number from 1; scenario steps are
  // 0-based, matching the importer (ScenarioStep.Order = i) and
  // ScenarioSession.CurrentStep.
  orderBase: number
}

export interface RenumberResult {
  patched: number
  // Items that kept their old position because their PATCH failed. Named, not
  // counted: a half-applied renumber leaves duplicate orders, and the author
  // needs to know which items to fix.
  failedLabels: string[]
}

/**
 * Writes `items`' positions as their order, PATCHing only the ones that moved.
 *
 * The one renumber of the editors: the course canvas feeds it the chain it
 * walked along the edges, the scenario outline feeds it its list. An item whose
 * PATCH succeeds has its `order` updated in place, so the caller's copy matches
 * the database without a reload.
 */
export async function renumberSequence(items: SequenceItem[], options: RenumberOptions): Promise<RenumberResult> {
  let patched = 0
  const failedLabels: string[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const newOrder = i + options.orderBase
    if (!item.id || item.order === newOrder) continue

    try {
      await axios.patch(`${options.endpoint}/${item.id}`, { [options.orderField]: newOrder })
      item.order = newOrder
      patched++
    } catch (err) {
      console.error(`Failed to update order for ${options.endpoint} ${item.id}:`, err)
      failedLabels.push(item.label)
    }
  }

  return { patched, failedLabels }
}
