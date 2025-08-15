<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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

import Entity from './Entity.vue';
import { useGenerationsStore } from '../../stores/generations';
import GenerateCourseButton from '../Buttons/GenerateCourseButton.vue';
import { useLoginStore } from '../../stores/login';

const entityStore = useGenerationsStore();
const loginStore = useLoginStore();
           
</script>

<template>
    <div class="wrapper">
        <Entity :entity-name='"generations"' :entity-store=entityStore>
            <template #actions="{ entity }">
                <GenerateCourseButton
                    :authorEmail="loginStore.email"
                    :format="entity.format"
                    :courseId="entity.courses"
                    :scheduleId="entity.schedules"
                    :themeId="entity.themes"
                    /> 
            </template>
        </Entity>
    </div>
</template>
