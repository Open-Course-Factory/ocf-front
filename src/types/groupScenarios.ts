/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Shared types for the group scenarios feature (GroupScenariosTab + its modals).
 * Extracted from the previously-local interfaces in GroupScenariosTab.vue
 * (commit c2 of #244).
 */

export interface ScenarioAssignment {
  id: string
  scenario_id: string
  group_id: string
  scope: string
  start_date?: string
  deadline?: string
  is_active: boolean
  scenario?: {
    id: string
    name: string
    title: string
    difficulty: string
    organization_id?: string
  }
}

export interface Scenario {
  id: string
  name: string
  title: string
  difficulty: string
  source: 'org' | 'group'
}

export interface NoKeyUser {
  user_id: string
  user_name?: string
  user_email?: string
}

export interface AssignmentResultError {
  user_id: string
  error?: string
}

export interface Distribution {
  prefix: string
  name: string
  description: string
  os_type?: string
  is_global: boolean
}

export interface ScenarioResultItem {
  session_id: string
  user_id: string
  user_name?: string
  user_email?: string
  status: string
  grade?: number
  // Sum of correct quiz answers + correct flag captures
  correct_count?: number
  // Total quiz questions + count of flag-bearing steps in the scenario (static per scenario)
  total_correct_possible?: number
  current_step: number
  total_steps: number
  completed_steps: number
  total_hints_used: number
  started_at: string
  completed_at?: string
}
