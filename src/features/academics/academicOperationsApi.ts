import apiClient from "@/services/apiClient";

type QueryParams = Record<string, unknown>;

async function get(url: string, params?: QueryParams) {
  const response = await apiClient.get(url, params ? { params } : undefined);
  return response.data;
}

async function post(url: string, payload?: unknown) {
  const response = await apiClient.post(url, payload ?? {});
  return response.data;
}

export const academicOperationsApi = {
  artifacts: {
    async load() {
      const artifactData = await get("/api/academics/artifacts/", { page: 1, page_size: 200 });
      return { artifactData };
    },
    generateArtifact(type: "REPORT_CARD" | "CERTIFICATE" | "TRANSCRIPT", payload: Record<string, unknown>) {
      const endpoint =
        type === "REPORT_CARD"
          ? "/api/academics/artifacts/report-card/generate/"
          : type === "CERTIFICATE"
            ? "/api/academics/artifacts/certificate/generate/"
            : "/api/academics/artifacts/transcript/generate/";
      return post(endpoint, payload);
    },
    verifyArtifact(params: Record<string, unknown>) {
      return get("/api/academics/artifacts/verify/", params);
    },
  },
  workflow: {
    async load() {
      const [eventData, assignmentData, submissionData] = await Promise.all([
        get("/api/academics/calendar-events/", { page: 1, page_size: 200 }),
        get("/api/academics/assignments/", { page: 1, page_size: 200 }),
        get("/api/academics/assignment-submissions/", { page: 1, page_size: 500 }),
      ]);

      return { eventData, assignmentData, submissionData };
    },
    createCalendarEvent(payload: Record<string, unknown>) {
      return post("/api/academics/calendar-events/", payload);
    },
    createAssignment(payload: Record<string, unknown>) {
      return post("/api/academics/assignments/", payload);
    },
    publishAssignment(id: number) {
      return post(`/api/academics/assignments/${id}/publish/`, {});
    },
    closeAssignment(id: number) {
      return post(`/api/academics/assignments/${id}/close/`, {});
    },
    cancelAssignment(id: number) {
      return post(`/api/academics/assignments/${id}/cancel/`, {});
    },
    archiveAssignment(id: number) {
      return post(`/api/academics/assignments/${id}/archive/`, {});
    },
    submitAssignment(id: number, payload: Record<string, unknown>) {
      return post(`/api/academics/assignments/${id}/submit/`, payload);
    },
    extendAssignment(id: number, payload: Record<string, unknown>) {
      return post(`/api/academics/assignments/${id}/extend-deadline/`, payload);
    },
    gradeSubmission(id: number, payload: Record<string, unknown>) {
      return post(`/api/academics/assignment-submissions/${id}/grade/`, payload);
    },
  },
  attendanceRisk: {
    async load() {
      const [flagData] = await Promise.all([
        get("/api/academics/attendance-risk-flags/", { page: 1, page_size: 200 }),
      ]);

      return { flagData };
    },
    getHistory(id: number) {
      return get(`/api/academics/attendance-risk-flags/${id}/history/`);
    },
    reopenFlag(id: number) {
      return post(`/api/academics/attendance-risk-flags/${id}/reopen/`, {});
    },
    runSectionReport(payload: Record<string, unknown>) {
      return post("/api/academics/attendance-records/section-report/", payload);
    },
    evaluateFlags(payload: Record<string, unknown>) {
      return post("/api/academics/attendance-risk-flags/evaluate/", payload);
    },
    transitionFlag(
      id: number,
      action: "acknowledge" | "escalate" | "resolve" | "dismiss" | "reopen",
      payload: Record<string, unknown>,
    ) {
      return post(`/api/academics/attendance-risk-flags/${id}/${action}/`, payload);
    },
  },
  curriculum: {
    async load() {
      const [curriculumData, mappingData] = await Promise.all([
        get("/api/academics/curriculum-versions/", { page: 1, page_size: 100 }),
        get("/api/academics/curriculum-version-courses/", { page: 1, page_size: 200 }),
      ]);

      return { curriculumData, mappingData };
    },
    publishCurriculum(id: number) {
      return post(`/api/academics/curriculum-versions/${id}/publish/`, {});
    },
    cloneCurriculum(id: number) {
      return post(`/api/academics/curriculum-versions/${id}/clone/`, {});
    },
    createCurriculum(payload: Record<string, unknown>) {
      return post("/api/academics/curriculum-versions/", payload);
    },
    createCurriculumMapping(payload: Record<string, unknown>) {
      return post("/api/academics/curriculum-version-courses/", payload);
    },
  },
  grading: {
    async load() {
      const [
        assessmentTypeData,
        schemeData,
        policyData,
        gpaRecordData,
      ] = await Promise.all([
        get("/api/academics/assessment-types/", { page: 1, page_size: 100 }),
        get("/api/academics/grading-schemes/", { page: 1, page_size: 100 }),
        get("/api/academics/course-grading-policies/", { page: 1, page_size: 100 }),
        get("/api/academics/gpa-records/", { page: 1, page_size: 200 }),
      ]);

      return {
        assessmentTypeData,
        schemeData,
        policyData,
        gpaRecordData,
      };
    },
    createGradingScheme(payload: Record<string, unknown>) {
      return post("/api/academics/grading-schemes/", payload);
    },
    createGradeBand(payload: Record<string, unknown>) {
      return post("/api/academics/grade-bands/", payload);
    },
    createCoursePolicy(payload: Record<string, unknown>) {
      return post("/api/academics/course-grading-policies/", payload);
    },
    createWeightRule(payload: Record<string, unknown>) {
      return post("/api/academics/assessment-weight-rules/", payload);
    },
    recalculateGpa(payload: Record<string, unknown>) {
      return post("/api/academics/gpa/recalculate/", payload);
    },
  },
};
