import type { ChurchMember, Department, Profile, UserDepartmentRelation } from '@/types';

interface DepartmentScopeParams {
  departments: Department[];
  user: Profile;
  relations: UserDepartmentRelation[];
}

interface DepartmentResponsibleParams {
  department: Department;
  users: Profile[];
  relations: UserDepartmentRelation[];
}

interface DepartmentChurchMembersParams {
  departmentId: string;
  user: Profile;
  churchMembers: ChurchMember[];
}

export const getUserDepartmentIds = (userId: string, relations: UserDepartmentRelation[]) => {
  return relations.filter((relation) => relation.userId === userId).map((relation) => relation.departmentId);
};

export const getScopedDepartmentsByRole = ({ departments, user, relations }: DepartmentScopeParams) => {
  if (user.role === 'superadmin') {
    return departments;
  }

  if (user.role === 'admin') {
    return departments.filter((department) => department.branchId === user.branchId);
  }

  const relatedDepartmentIds = new Set(getUserDepartmentIds(user.id, relations));
  return departments.filter((department) => relatedDepartmentIds.has(department.id));
};

export const canViewDepartment = (department: Department, user: Profile, relations: UserDepartmentRelation[]) => {
  if (user.role === 'superadmin') {
    return true;
  }

  if (user.role === 'admin') {
    return department.branchId === user.branchId;
  }

  return getUserDepartmentIds(user.id, relations).includes(department.id);
};

export const getDepartmentResponsible = ({ department, users, relations }: DepartmentResponsibleParams) => {
  const relationManager = relations.find(
    (relation) => relation.departmentId === department.id && relation.roleInDepartment === 'department_manager',
  );

  if (relationManager) {
    return users.find((profile) => profile.id === relationManager.userId) ?? null;
  }

  return users.find((profile) => profile.id === department.managerId) ?? null;
};

export const getChurchMembersByDepartment = ({
  departmentId,
  user,
  churchMembers,
}: DepartmentChurchMembersParams) => {
  const departmentMembers = churchMembers.filter((member) => member.departmentIds.includes(departmentId));

  if (user.role === 'superadmin') {
    return departmentMembers;
  }

  if (user.role === 'admin') {
    return departmentMembers.filter((member) => member.branchId === user.branchId);
  }

  return departmentMembers;
};

export const getDepartmentMemberPreview = (departmentId: string, churchMembers: ChurchMember[], max = 3) => {
  return churchMembers
    .filter((member) => member.departmentIds.includes(departmentId))
    .slice(0, max)
    .map((member) => `${member.firstName} ${member.lastName}`);
};

export const getDepartmentUsers = (departmentId: string, users: Profile[], relations: UserDepartmentRelation[]) => {
  return relations
    .filter((relation) => relation.departmentId === departmentId)
    .map((relation) => {
      const profile = users.find((user) => user.id === relation.userId);

      if (!profile) {
        return null;
      }

      return {
        profile,
        roleInDepartment: relation.roleInDepartment,
        joinedAt: relation.joinedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

