import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock axios at the HTTP boundary BEFORE importing the service.
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

import axios from 'axios'
import { teacherService } from '../../src/services/domain/scenario/teacherService'
import type {
  SessionDetailResponse,
  SessionCommandsResponse
} from '../../src/services/domain/scenario/teacherService'

const mockedAxios = vi.mocked(axios)

describe('teacherService.getSessionCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs the commands endpoint with default limit/offset', async () => {
    const payload: SessionCommandsResponse = {
      commands: [
        { session_uuid: 's1', sequence_num: 1, command_text: 'ls', executed_at: 1700000000 }
      ],
      total: 1,
      limit: 100,
      offset: 0
    }
    mockedAxios.get.mockResolvedValueOnce({ data: payload })

    const result = await teacherService.getSessionCommands('group-1', 'session-1')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/teacher/groups/group-1/sessions/session-1/commands',
      { params: { limit: 100, offset: 0 } }
    )
    expect(result).toEqual(payload)
  })

  it('passes custom limit and offset', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { commands: [], total: 0, limit: 50, offset: 100 }
    })

    await teacherService.getSessionCommands('group-1', 'session-1', 50, 100)

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/teacher/groups/group-1/sessions/session-1/commands',
      { params: { limit: 50, offset: 100 } }
    )
  })

  it('returns the raw response data shape', async () => {
    const payload: SessionCommandsResponse = {
      commands: [
        { session_uuid: 's', sequence_num: 1, command_text: 'echo hello', executed_at: 1700000100 },
        { session_uuid: 's', sequence_num: 2, command_text: 'pwd', executed_at: 1700000110 }
      ],
      total: 2,
      limit: 100,
      offset: 0
    }
    mockedAxios.get.mockResolvedValueOnce({ data: payload })

    const result = await teacherService.getSessionCommands('group-1', 'session-1')

    expect(result.commands).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.commands[0].command_text).toBe('echo hello')
  })
})

describe('teacherService.getSessionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs the session detail endpoint and returns typed shape', async () => {
    const payload: SessionDetailResponse = {
      session_id: 'session-1',
      user_id: 'user-1',
      user_name: 'Alice',
      user_email: 'alice@example.com',
      scenario_id: 'scenario-1',
      scenario_title: 'Linux basics',
      status: 'in_progress',
      grade: 50,
      started_at: '2026-05-01T10:00:00Z',
      steps: [
        {
          step_order: 0,
          step_title: 'Step 1',
          step_type: 'terminal',
          status: 'completed',
          verify_attempts: 1,
          hints_revealed: 0,
          started_at: '2026-05-01T10:00:00Z',
          completed_at: '2026-05-01T10:05:00Z',
          time_spent_seconds: 300
        },
        {
          step_order: 1,
          step_title: 'Quiz',
          step_type: 'quiz',
          status: 'completed',
          verify_attempts: 1,
          hints_revealed: 0,
          started_at: '2026-05-01T10:05:00Z',
          completed_at: '2026-05-01T10:10:00Z',
          time_spent_seconds: 300,
          quiz_score: 0.66,
          questions: [
            {
              id: 'q1',
              order: 0,
              question_text: 'Pick A',
              question_type: 'multiple_choice',
              options: '["A","B","C"]',
              correct_answer: 'A',
              student_answer: 'A',
              is_correct: true,
              points: 1
            }
          ]
        }
      ]
    }
    mockedAxios.get.mockResolvedValueOnce({ data: payload })

    const result = await teacherService.getSessionDetail('group-1', 'session-1')

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/teacher/groups/group-1/sessions/session-1/detail'
    )
    // New fields are preserved through the typed call.
    expect(result.steps[0].started_at).toBe('2026-05-01T10:00:00Z')
    expect(result.steps[1].quiz_score).toBe(0.66)
    expect(result.steps[1].questions).toBeDefined()
    expect(result.steps[1].questions?.[0].is_correct).toBe(true)
    expect(result.steps[1].questions?.[0].options).toBe('["A","B","C"]')
  })

  it('tolerates missing optional fields (older sessions)', async () => {
    const payload: SessionDetailResponse = {
      session_id: 'session-1',
      user_id: 'user-1',
      scenario_id: 'scenario-1',
      scenario_title: 'Old scenario',
      status: 'completed',
      started_at: '2026-04-01T10:00:00Z',
      completed_at: '2026-04-01T10:30:00Z',
      steps: [
        {
          step_order: 0,
          step_title: 'Old step',
          status: 'completed',
          verify_attempts: 1,
          hints_revealed: 0,
          time_spent_seconds: 100
        }
      ]
    }
    mockedAxios.get.mockResolvedValueOnce({ data: payload })

    const result = await teacherService.getSessionDetail('group-1', 'session-1')

    expect(result.steps[0].started_at).toBeUndefined()
    expect(result.steps[0].questions).toBeUndefined()
  })
})
