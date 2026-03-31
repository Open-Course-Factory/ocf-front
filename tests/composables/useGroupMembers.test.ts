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

import { useGroupMembers, type GroupMember } from '../../src/composables/useGroupMembers'

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
      isOwner: ref(false)
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
    describe('when isOwner is true', () => {
      beforeEach(() => {
        composable = useGroupMembers({
          groupId: ref('group-1'),
          currentUserId: ref('current-user'),
          isOwner: ref(true)
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

    describe('when isOwner is false', () => {
      beforeEach(() => {
        composable = useGroupMembers({
          groupId: ref('group-1'),
          currentUserId: ref('current-user'),
          isOwner: ref(false)
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
    describe('when isOwner is true', () => {
      beforeEach(() => {
        composable = useGroupMembers({
          groupId: ref('group-1'),
          currentUserId: ref('current-user'),
          isOwner: ref(true)
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

    describe('when isOwner is false', () => {
      beforeEach(() => {
        composable = useGroupMembers({
          groupId: ref('group-1'),
          currentUserId: ref('current-user'),
          isOwner: ref(false)
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
    it('is true when isOwner is true', () => {
      composable = useGroupMembers({
        groupId: ref('group-1'),
        currentUserId: ref('current-user'),
        isOwner: ref(true)
      })
      expect(composable.canManageMembers.value).toBe(true)
    })

    it('is false when isOwner is false', () => {
      composable = useGroupMembers({
        groupId: ref('group-1'),
        currentUserId: ref('current-user'),
        isOwner: ref(false)
      })
      expect(composable.canManageMembers.value).toBe(false)
    })

    it('reacts to changes in isOwner ref', () => {
      const isOwner = ref(false)
      composable = useGroupMembers({
        groupId: ref('group-1'),
        currentUserId: ref('current-user'),
        isOwner
      })
      expect(composable.canManageMembers.value).toBe(false)

      isOwner.value = true
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
