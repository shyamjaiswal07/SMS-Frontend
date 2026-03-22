import {
  useGetAcademicYearsQuery,
  useGetDepartmentsQuery,
  useGetGradeLevelsQuery,
  useGetRoomsQuery,
  useGetSchoolsQuery,
  useGetSectionsQuery,
  useGetSubjectsQuery,
  useGetSubscriptionPlansQuery,
  useGetTenantDomainsQuery,
  useGetTenantSubscriptionsQuery,
  useGetTermsQuery,
} from "./institutionsApiSlice";
import type {
  AcademicYearRow,
  DepartmentRow,
  GradeLevelRow,
  RoomRow,
  SchoolRow,
  SectionRow,
  SubjectRow,
  SubscriptionPlanRow,
  TenantDomainRow,
  TenantSubscriptionRow,
  TermRow,
} from "./institutionsTypes";
import { rowsOf } from "@/utils/platform";

export function useInstitutionsWorkspace() {
  const schoolsQuery = useGetSchoolsQuery({ page: 1, page_size: 100 });
  const tenantDomainsQuery = useGetTenantDomainsQuery({ page: 1, page_size: 200 });
  const subscriptionPlansQuery = useGetSubscriptionPlansQuery({ page: 1, page_size: 100 });
  const tenantSubscriptionsQuery = useGetTenantSubscriptionsQuery({ page: 1, page_size: 200 });
  const academicYearsQuery = useGetAcademicYearsQuery({ page: 1, page_size: 100 });
  const termsQuery = useGetTermsQuery({ page: 1, page_size: 200 });
  const departmentsQuery = useGetDepartmentsQuery({ page: 1, page_size: 200 });
  const gradeLevelsQuery = useGetGradeLevelsQuery({ page: 1, page_size: 200 });
  const sectionsQuery = useGetSectionsQuery({ page: 1, page_size: 200 });
  const subjectsQuery = useGetSubjectsQuery({ page: 1, page_size: 200 });
  const roomsQuery = useGetRoomsQuery({ page: 1, page_size: 200 });

  const loading = [
    schoolsQuery,
    tenantDomainsQuery,
    subscriptionPlansQuery,
    tenantSubscriptionsQuery,
    academicYearsQuery,
    termsQuery,
    departmentsQuery,
    gradeLevelsQuery,
    sectionsQuery,
    subjectsQuery,
    roomsQuery,
  ].some((query) => query.isFetching);

  return {
    schools: rowsOf(schoolsQuery.data) as SchoolRow[],
    tenantDomains: rowsOf(tenantDomainsQuery.data) as TenantDomainRow[],
    subscriptionPlans: rowsOf(subscriptionPlansQuery.data) as SubscriptionPlanRow[],
    tenantSubscriptions: rowsOf(tenantSubscriptionsQuery.data) as TenantSubscriptionRow[],
    academicYears: rowsOf(academicYearsQuery.data) as AcademicYearRow[],
    terms: rowsOf(termsQuery.data) as TermRow[],
    departments: rowsOf(departmentsQuery.data) as DepartmentRow[],
    gradeLevels: rowsOf(gradeLevelsQuery.data) as GradeLevelRow[],
    sections: rowsOf(sectionsQuery.data) as SectionRow[],
    subjects: rowsOf(subjectsQuery.data) as SubjectRow[],
    rooms: rowsOf(roomsQuery.data) as RoomRow[],
    loading,
    async refetchAll() {
      await Promise.all([
        schoolsQuery.refetch(),
        tenantDomainsQuery.refetch(),
        subscriptionPlansQuery.refetch(),
        tenantSubscriptionsQuery.refetch(),
        academicYearsQuery.refetch(),
        termsQuery.refetch(),
        departmentsQuery.refetch(),
        gradeLevelsQuery.refetch(),
        sectionsQuery.refetch(),
        subjectsQuery.refetch(),
        roomsQuery.refetch(),
      ]);
    },
  };
}
