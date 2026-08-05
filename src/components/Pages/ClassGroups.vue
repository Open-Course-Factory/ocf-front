<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useClassGroupsStore } from '../../stores/classGroups';
import { useOrganizationsStore } from '../../stores/organizations';
import { useTeacherGroupsStore } from '../../stores/teacherGroups';
import Entity from './Entity.vue';
import GroupCard from '../Cards/GroupCard.vue';

// Refresh rate the "Mes classes" console promises for the same counts; asking
// for data no older than that keeps the two surfaces telling the same story.
const LIVE_COUNT_MAX_AGE_MS = 30000;

const entityStore = useClassGroupsStore();
const organizationsStore = useOrganizationsStore();
const teacherGroupsStore = useTeacherGroupsStore();

// One request for the whole page: the live counters of every class the viewer
// teaches come from the console's cross-group endpoint, so no card fetches
// anything. Cards for groups the viewer does not teach get `undefined` and show
// no counter.
onMounted(() => {
    teacherGroupsStore.ensureLoaded(LIVE_COUNT_MAX_AGE_MS);
});

// The list itself is scoped to the active organization by the store (see its
// loadEntitiesWithCursor). Entity.vue reloads on route changes, and switching
// organization is not one — so the scope is part of the list's identity here,
// and a switch rebuilds it against the new one.
const listScopeKey = computed(() => organizationsStore.currentOrganization?.id || 'no-organization');

// Cards name the organization and the parent group, but `/class-groups` returns
// only their IDs. Both are resolved from lists the session already holds — the
// organization switcher in TopMenu loads the organizations, and the parent is
// another row of the very list being rendered — so no card issues a request of
// its own. An ID with no match stays unresolved and its line is dropped.
function organizationName(organizationId?: string): string | undefined {
    if (!organizationId) return undefined
    return organizationsStore.getOrganizationById(organizationId)?.display_name
}

function parentGroupName(parentGroupId?: string): string | undefined {
    if (!parentGroupId) return undefined
    const parent = entityStore.entities.find((group: any) => group.id === parentGroupId)
    return parent?.display_name || parent?.name || undefined
}
</script>

<template>
    <div class="wrapper">
        <Entity :key="listScopeKey" :entity-name='"class-groups"' :entity-store=entityStore>
            <template #card="{ entity }">
                <GroupCard
                    :entity="entity"
                    :organization-name="organizationName(entity.organization_id)"
                    :parent-group-name="parentGroupName(entity.parent_group_id)"
                    :live-session-count="teacherGroupsStore.liveSessionCountOf(entity.id)"
                />
            </template>
        </Entity>
    </div>
</template>
