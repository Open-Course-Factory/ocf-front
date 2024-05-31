import { defineStore } from "pinia"

export const useCoursesStore = defineStore('courses', {
    state() {
        return {
            Name: "",
            Theme: "",
            Format: "",
            AuthorEmail: "",
            Category: "",
            Version: "",
            Title: "",
            Subtitle: "",
            Header: "",
            Footer: "",
            Logo: "",
            Description: "",
            CourseID_str: "",
            Schedule: "",
            Prelude: "",
            LearningObjectives: "",
            Chapters: []
        }
    }
})