<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
import { useClassContext } from '../../composables/useClassContext'
import GroupSettingsTab from '../Groups/GroupSettingsTab.vue'
import GroupSubgroupsSection from '../Groups/GroupSubgroupsSection.vue'

// Everything the retired "Aperçu" tab showed lives here now: its editable half
// in the settings block, its subgroups half below it.
const {
  group,
  subgroups,
  ownerUser,
  organization,
  memberCount,
  canManageClass,
  canDeleteClass,
  reload
} = useClassContext()
</script>

<template>
  <div v-if="group" class="class-settings-page">
    <GroupSettingsTab
      :group="group"
      :owner-user="ownerUser"
      :group-organization="organization"
      :member-count="memberCount"
      :can-edit-group="canManageClass"
      :can-delete-group="canDeleteClass"
      @group-updated="reload"
    />

    <GroupSubgroupsSection
      v-if="canManageClass"
      :group="group"
      :subgroups="subgroups"
      :can-edit-group="canManageClass"
      @group-updated="reload"
    />
  </div>
</template>
