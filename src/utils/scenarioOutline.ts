/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * The scenario editor's step list. A scenario is a sequence, so the list order
 * IS the step order: every reorder, insert or delete ends in renumberSteps.
 */

import { renumberSequence, type RenumberResult } from './renumberSequence'

export const STEP_TYPES = ['terminal', 'flag', 'info', 'quiz'] as const
export type StepType = typeof STEP_TYPES[number]

export const TYPE_ICONS: Record<StepType, string> = {
  terminal: 'fas fa-terminal',
  flag: 'fas fa-flag',
  info: 'fas fa-book-open',
  quiz: 'fas fa-question'
}

/** The drag type the outline accepts step-library steps under (a JSON array of step ids). */
export const LIBRARY_DRAG_TYPE = 'text/x-ocf-library-steps'

export function resolveStepType(step: { step_type?: string } | null | undefined): StepType {
  const type = step?.step_type
  return (STEP_TYPES as readonly string[]).includes(type || '') ? type as StepType : 'terminal'
}

/** A step of the outline. `id` is null for a draft not saved yet. */
export interface OutlineStep {
  id: string | null
  // Stable across a save, so the selection survives a draft getting its id.
  key: string
  order: number
  title: string
  step_type: StepType
  [field: string]: any
}

let draftCounter = 0

export function toOutlineSteps(steps: any[]): OutlineStep[] {
  return [...steps]
    // `??` not `||`: order 0 is the first step, not a missing value.
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(step => ({ ...step, key: step.id, order: step.order ?? 0, step_type: resolveStepType(step) }))
}

export function draftStep(stepType: StepType): OutlineStep {
  draftCounter++
  return { id: null, key: `draft-${draftCounter}`, order: -1, title: '', step_type: stepType, isNew: true }
}

/** A copy of `list` with the item at `from` moved to `to`. Out-of-range is a no-op. */
export function moveStep<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** A copy of `list` with `step` inserted at `index` (clamped to the ends). */
export function insertStep<T>(list: T[], step: T, index: number): T[] {
  const at = Math.max(0, Math.min(index, list.length))
  return [...list.slice(0, at), step, ...list.slice(at)]
}

/**
 * The server-side position of outline index `index`: drafts are not on the
 * server, so only the saved steps before it count.
 */
export function savedPosition(steps: OutlineStep[], index: number): number {
  return steps.slice(0, index).filter(step => step.id).length
}

/**
 * Writes the list's order to the backend. Steps are 0-based: the importer
 * writes Order = i and a session seeds CurrentStep from the first step's Order.
 * Each saved step's `order` is updated in place on success.
 */
export async function renumberSteps(steps: OutlineStep[]): Promise<RenumberResult> {
  const items = steps.map(step => ({ id: step.id, order: step.order, label: step.title || String(step.id) }))
  const result = await renumberSequence(items, { endpoint: '/scenario-steps', orderField: 'order', orderBase: 0 })
  steps.forEach((step, i) => { step.order = items[i].order })
  return result
}
