<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useClassContext } from '../../composables/useClassContext'
import { useCurrentUserStore } from '../../stores/currentUser'
import ClassLiveView from '../Groups/ClassLiveView.vue'
import type { ParticipantActionsViewer } from '../Groups/ParticipantActionsMenu.vue'

// The live view keeps its own representation switch: `?view=wall` opens the wall
// of tiles, anything else the progression table.
const { groupId, group, canManageClass, isPlatformAdmin, isOwner, isManager, isOrgManager } = useClassContext()
const currentUser = useCurrentUserStore()

// Who acts on the wall's participants (#384).
const viewer = computed<ParticipantActionsViewer>(() => ({
  userId: currentUser.userId,
  isPlatformAdmin: isPlatformAdmin.value,
  managesClass: isOwner.value || isManager.value || isOrgManager.value,
  managesOrg: isOrgManager.value
}))
</script>

<template>
  <ClassLiveView
    :group-id="groupId"
    :can-supervise="canManageClass"
    :organization-id="group?.organization_id"
    :viewer="viewer"
  />
</template>
