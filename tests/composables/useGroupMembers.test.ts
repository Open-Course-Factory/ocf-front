import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

// Mock axios before importing the composable
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

// Mock useTranslations to avoid needing a real vue-i18n instance
vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: (messages: any) => ({
    t: (key: string, params?: any) => key,
    te: (key: string) => true,
    locale: ref('en'),
    i18n: {}
  }),
  useStoreTranslations: (messages: any) => ({
    t: (key: string, params?: any) => key,
    te: (key: string) => true,
    locale: ref('en'),
    i18n: {}
  })
}))

// Mock the error handler used by withAsync
vi.mock('../../src/services/core/error', () => ({
  handleStoreError: (err: any, fallbackKey: string) => fallbackKey
}))

import axios from 'axios'
import { useGroupMembers, fetchGroupMembers, type GroupMember } from '../../src/composables/useGroupMembers'

function createMember(overrides: Partial<GroupMember> = {}): GroupMember {
  return {
    id: 'member-1',
    user_id: 'user-1',
    role: 'member',
    joined_at: '2025-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      email: 'user@example.com',
      username: 'testuser',
      display_name: 'Test User'
    },
    ...overrides
  }
}

describe('useGroupMembers', () => {
  let composable: ReturnType<typeof useGroupMembers>

  beforeEach(() => {
    composable = useGroupMembers({
      groupId: ref('group-1'),
      currentUserId: ref('current-user'),
      canManageMembers: ref(false)
    })
  })

  describe('roleOrder correctness', () => {
    it('sorts owners before managers before members', () => {
      const ownerMember = createMember({ id: 'o1', user_id: 'u1', role: 'owner' })
      const managerMember = createMember({ id: 'm1', user_id: 'u2', role: 'manager' })
      const regularMember = createMember({ id: 'r1', user_id: 'u3', role: 'member' })

      // Add in reverse order to verify sorting works
      composable.members.value = [regularMember, ownerMember, managerMember]

      const sorted = composable.sortedMembers.value
      expect(sorted[0].role).toBe('owner')
      expect(sorted[1].role).toBe('manager')
      expect(sorted[2].role).toBe('member')
    })

    it('handles multiple members with the same role', () => {
      const member1 = createMember({ id: 'm1', user_id: 'u1', role: 'member' })
      const member2 = createMember({ id: 'm2', user_id: 'u2', role: 'member' })
      const owner = createMember({ id: 'o1', user_id: 'u3', role: 'owner' })

      composable.members.value = [member1, owner, member2]

      const sorted = composable.sortedMembers.value
      expect(sorted[0].role).toBe('owner')
      expect(sorted[1].role).toBe('member')
      expect(sorted[2].role).toBe('member')
    })

    it('returns empty array when there are no members', () => {
      composable.members.value = []
      expect(composable.sortedMembers.value).toEqual([])
    })
  })

  describe('canEditMember', () => {
    describe('when the caller manages the class', () => {
      beforeEach(() => {
        composable = useGroupMembers({
          groupId: ref('group-1'),
          currentUserId: ref('current-user'),
          canManageMembers: ref(true)
        })
      })

      it('can edit a regular member', () => {
        const member = createMember({ role: 'member' })
        expect(composable.canEditMember(member)).toBe(true)
      })

      it('can edit a manager', () => {
        const member = createMember({ role: 'manager' })
        expect(composable.canEditMember(member)).toBe(true)
      })

      it('cannot edit an owner member', () => {
        const member = createMember({ role: 'owner' })
        expect(composable.canEditMember(member)).toBe(false)
      })
    })

    describe('when the caller does not manage the class', () => {
      beforeEach(() => {
        composable = useGroupMembers({
          groupId: ref('group-1'),
          currentUserId: ref('current-user'),
          canManageMembers: ref(false)
        })
      })

      it('cannot edit a regular member', () => {
        const member = createMember({ role: 'member' })
        expect(composable.canEditMember(member)).toBe(false)
      })

      it('cannot edit a manager', () => {
        const member = createMember({ role: 'manager' })
        expect(composable.canEditMember(member)).toBe(false)
      })

      it('cannot edit an owner member', () => {
        const member = createMember({ role: 'owner' })
        expect(composable.canEditMember(member)).toBe(false)
      })
    })
  })

  describe('canRemoveMember', () => {
    describe('when the caller manages the class', () => {
      beforeEach(() => {
        composable = useGroupMembers({
          groupId: ref('group-1'),
          currentUserId: ref('current-user'),
          canManageMembers: ref(true)
        })
      })

      it('can remove a non-owner, non-self member', () => {
        const member = createMember({ user_id: 'other-user', role: 'member' })
        expect(composable.canRemoveMember(member)).toBe(true)
      })

      it('can remove a manager who is not self', () => {
        const member = createMember({ user_id: 'other-user', role: 'manager' })
        expect(composable.canRemoveMember(member)).toBe(true)
      })

      it('cannot remove an owner member', () => {
        const member = createMember({ user_id: 'other-user', role: 'owner' })
        expect(composable.canRemoveMember(member)).toBe(false)
      })

      it('cannot remove themselves', () => {
        const member = createMember({ user_id: 'current-user', role: 'member' })
        expect(composable.canRemoveMember(member)).toBe(false)
      })

      it('cannot remove themselves even if they are a manager', () => {
        const member = createMember({ user_id: 'current-user', role: 'manager' })
        expect(composable.canRemoveMember(member)).toBe(false)
      })
    })

    describe('when the caller does not manage the class', () => {
      beforeEach(() => {
        composable = useGroupMembers({
          groupId: ref('group-1'),
          currentUserId: ref('current-user'),
          canManageMembers: ref(false)
        })
      })

      it('cannot remove any member', () => {
        const member = createMember({ user_id: 'other-user', role: 'member' })
        expect(composable.canRemoveMember(member)).toBe(false)
      })

      it('cannot remove a manager', () => {
        const member = createMember({ user_id: 'other-user', role: 'manager' })
        expect(composable.canRemoveMember(member)).toBe(false)
      })
    })
  })

  describe('canManageMembers', () => {
    it('is true when the caller manages the class', () => {
      composable = useGroupMembers({
        groupId: ref('group-1'),
        currentUserId: ref('current-user'),
        canManageMembers: ref(true)
      })
      expect(composable.canManageMembers.value).toBe(true)
    })

    it('is false when the caller does not manage the class', () => {
      composable = useGroupMembers({
        groupId: ref('group-1'),
        currentUserId: ref('current-user'),
        canManageMembers: ref(false)
      })
      expect(composable.canManageMembers.value).toBe(false)
    })

    it('reacts to changes in the manage-class right', () => {
      const canManageMembers = ref(false)
      composable = useGroupMembers({
        groupId: ref('group-1'),
        currentUserId: ref('current-user'),
        canManageMembers
      })
      expect(composable.canManageMembers.value).toBe(false)

      canManageMembers.value = true
      expect(composable.canManageMembers.value).toBe(true)
    })
  })

  describe('filteredMembers', () => {
    it('returns all members when search query is empty', () => {
      const member1 = createMember({ id: 'm1', user_id: 'u1' })
      const member2 = createMember({ id: 'm2', user_id: 'u2' })
      composable.members.value = [member1, member2]

      expect(composable.filteredMembers.value).toHaveLength(2)
    })

    it('filters members by email', () => {
      const member1 = createMember({
        id: 'm1', user_id: 'u1',
        user: { id: 'u1', email: 'alice@example.com', username: 'alice', display_name: 'Alice' }
      })
      const member2 = createMember({
        id: 'm2', user_id: 'u2',
        user: { id: 'u2', email: 'bob@example.com', username: 'bob', display_name: 'Bob' }
      })
      composable.members.value = [member1, member2]

      composable.memberSearchQuery.value = 'alice'
      expect(composable.filteredMembers.value).toHaveLength(1)
      expect(composable.filteredMembers.value[0].user_id).toBe('u1')
    })

    it('filters members by display_name', () => {
      const member1 = createMember({
        id: 'm1', user_id: 'u1',
        user: { id: 'u1', email: 'a@example.com', username: 'a', display_name: 'Alice Smith' }
      })
      const member2 = createMember({
        id: 'm2', user_id: 'u2',
        user: { id: 'u2', email: 'b@example.com', username: 'b', display_name: 'Bob Jones' }
      })
      composable.members.value = [member1, member2]

      composable.memberSearchQuery.value = 'smith'
      expect(composable.filteredMembers.value).toHaveLength(1)
      expect(composable.filteredMembers.value[0].user_id).toBe('u1')
    })

    it('is case-insensitive', () => {
      const member = createMember({
        id: 'm1', user_id: 'u1',
        user: { id: 'u1', email: 'Alice@Example.COM', username: 'Alice', display_name: 'Alice' }
      })
      composable.members.value = [member]

      composable.memberSearchQuery.value = 'ALICE'
      expect(composable.filteredMembers.value).toHaveLength(1)
    })
  })

  describe('newMemberData defaults', () => {
    it('defaults role to member', () => {
      expect(composable.newMemberData.value.role).toBe('member')
    })

    it('defaults user_id to empty string', () => {
      expect(composable.newMemberData.value.user_id).toBe('')
    })
  })

  describe('sortedMembers respects filter', () => {
    it('sorts only filtered results', () => {
      const owner = createMember({
        id: 'o1', user_id: 'u1', role: 'owner',
        user: { id: 'u1', email: 'owner@example.com', username: 'owner', display_name: 'Owner' }
      })
      const manager = createMember({
        id: 'm1', user_id: 'u2', role: 'manager',
        user: { id: 'u2', email: 'manager@example.com', username: 'manager', display_name: 'Manager' }
      })
      const member = createMember({
        id: 'r1', user_id: 'u3', role: 'member',
        user: { id: 'u3', email: 'member@other.com', username: 'member', display_name: 'Member' }
      })
      composable.members.value = [member, owner, manager]

      // Filter to only @example.com
      composable.memberSearchQuery.value = 'example'
      const sorted = composable.sortedMembers.value
      expect(sorted).toHaveLength(2)
      expect(sorted[0].role).toBe('owner')
      expect(sorted[1].role).toBe('manager')
    })
  })
})

describe('fetchGroupMembers loads every page', () => {
  // ocf-core's generic list is offset-paginated (default 20, max 100): a single
  // request only returned the first page, so a 47-member class showed 20.
  function rosterOf(count: number): GroupMember[] {
    return Array.from({ length: count }, (_, i) =>
      createMember({ id: `gm-${i}`, user_id: `u-${i}` })
    )
  }

  // Answers like ocf-core: slices the roster by the `page` and `size` params.
  function serve(all: GroupMember[]) {
    vi.mocked(axios.get).mockReset()
    vi.mocked(axios.get).mockImplementation(async (_url: string, config?: any) => {
      const size = config?.params?.size ?? 20
      const page = config?.params?.page ?? 1
      const data = all.slice((page - 1) * size, page * size)
      const totalPages = Math.max(1, Math.ceil(all.length / size))
      return {
        data: {
          data,
          total: all.length,
          currentPage: page,
          pageSize: size,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    })
  }

  it('returns all 47 members of a class, not just the first page', async () => {
    serve(rosterOf(47))

    const members = await fetchGroupMembers('group-1')

    expect(members).toHaveLength(47)
    expect(new Set(members.map(m => m.id)).size).toBe(47)
  })

  it('walks every page of a 147-member class with the largest page size', async () => {
    serve(rosterOf(147))

    const members = await fetchGroupMembers('group-1')

    expect(members).toHaveLength(147)
    const calls = vi.mocked(axios.get).mock.calls
    expect(calls).toHaveLength(2)
    for (const [url, config] of calls) {
      expect(url).toBe('/group-members')
      expect((config as any).params).toMatchObject({ group_id: 'group-1', size: 100 })
    }
    expect(calls.map(([, config]) => (config as any).params.page)).toEqual([1, 2])
  })

  it('stops on an empty page even if the server claims there is more', async () => {
    vi.mocked(axios.get).mockReset()
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: { data: rosterOf(3), hasNextPage: true } })
      .mockResolvedValueOnce({ data: { data: [], hasNextPage: true } })
      .mockResolvedValue({ data: { data: rosterOf(3), hasNextPage: true } })

    const members = await fetchGroupMembers('group-1')

    expect(members).toHaveLength(3)
    expect(vi.mocked(axios.get)).toHaveBeenCalledTimes(2)
  })

  it('rejects when a later page fails, rather than returning a partial roster', async () => {
    vi.mocked(axios.get).mockReset()
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: { data: rosterOf(100), hasNextPage: true } })
      .mockRejectedValueOnce(new Error('page 2 failed'))

    await expect(fetchGroupMembers('group-1')).rejects.toThrow('page 2 failed')
    expect(vi.mocked(axios.get)).toHaveBeenCalledTimes(2)
  })

  it('still accepts a plain array response', async () => {
    vi.mocked(axios.get).mockReset()
    vi.mocked(axios.get).mockResolvedValue({ data: rosterOf(5) })

    const members = await fetchGroupMembers('group-1')

    expect(members).toHaveLength(5)
  })
})
