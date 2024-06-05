import { defineStore } from "pinia"

export const useCoursesStore = defineStore('courses', {
    state() {
        return {
            courses: []
        }
    },
    actions: {
        setCourses(courses) {
            this.courses = courses
        }
    }
})
