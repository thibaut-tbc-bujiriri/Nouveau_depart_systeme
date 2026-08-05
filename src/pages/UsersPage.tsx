import { Avatar, DataTable, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { ActionMenu, AppButton, AppInput, AppSelect, SearchInput, AppCombobox } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import { UserCardModal } from '@/components/cards';
import type { ManagedUser } from '@/services/users.service';
import { hasModulePermission } from '@/lib/permissions';
import type { Role } from '@/types';
import { uploadPhoto } from '@/utils/storage';
import { useMemo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import {
  X,
  Check,
  Search,
  ChevronDown,
  Eye,
  EyeOff,
  Upload,
  Save,
  User as UserIcon,
  Shield,
  Lock,
  Building2,
  Briefcase,
  Mail,
  UserCheck,
} from 'lucide-react';

interface EditingUserState {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  branchId: string;
  departmentIds: string[];
  newPassword: string;
  avatarUrl?: string | null;
  status: string;
}

interface NewUserState {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  branchId: string;
  departmentIds: string[];
  primaryDepartmentId: string;
  status: string;
}

const initialNewUserState: NewUserState = {
  fullName: '',
  email: '',
  password: '',
  role: 'department_member',
  branchId: '',
  departmentIds: [],
  primaryDepartmentId: '',
  status: 'active',
};

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'department_manager', label: 'Responsable Departement' },
  { value: 'department_member', label: 'Membre Departement' },
];

/* Custom Searchable Combobox Component */
interface SearchableDepartmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  departments: Array<{ id: string; name: string }>;
  placeholder?: string;
  branchId: string;
}

function SearchableDepartmentSelect({
  value,
  onChange,
  departments,
  placeholder = "Sélectionner un département",
  branchId,
}: SearchableDepartmentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const norm = searchQuery.trim().toLowerCase();
    if (!norm) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(norm));
  }, [departments, searchQuery]);

  const selectedDept = departments.find((d) => d.id === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".combobox-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative combobox-container w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer select-none"
      >
        <span className={selectedDept ? "text-slate-800" : "text-slate-400"}>
          {selectedDept ? selectedDept.name : placeholder}
        </span>
        <span className="pointer-events-none flex items-center pr-1 text-slate-400">
          <ChevronDown size={16} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un département..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto p-1 divide-y divide-slate-50 scrollbar-thin">
            {!branchId ? (
              <p className="text-xs text-slate-400 text-center py-4 px-2">Sélectionnez d'abord une extension.</p>
            ) : departments.length === 0 ? (
              <p className="text-xs text-rose-500 text-center py-4 px-2">Aucun département disponible pour cette extension.</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 px-2">Aucun département trouvé.</p>
            ) : (
              filtered.map((dept) => {
                const isSelected = dept.id === value;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      onChange(dept.id);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors text-left select-none cursor-pointer",
                      isSelected
                        ? "bg-teal-50 text-teal-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span>{dept.name}</span>
                    {isSelected && <Check size={14} className="text-teal-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Custom Image Upload Component */
interface ProfileImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  nameInitial: string;
}

function ProfileImageUpload({ value, onChange, nameInitial }: ProfileImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onChange(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const initials = nameInitial
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '?';

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <UserIcon className="text-slate-400" size={14} />
        Photo de profil
      </label>
      <div className="flex items-center gap-4 bg-slate-50/50 p-4 border border-slate-200 border-dashed rounded-xl">
        <div className="relative size-16 shrink-0 bg-white border border-slate-200 rounded-full flex items-center justify-center overflow-hidden shadow-sm group">
          {preview ? (
            <>
              <img src={preview} alt="Aperçu" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-0 right-0 bg-slate-900/60 hover:bg-rose-600 transition-colors rounded-full p-1 text-white shadow-sm"
                title="Retirer la photo"
              >
                <X size={10} />
              </button>
            </>
          ) : (
            <span className="text-sm font-bold text-slate-400">{initials}</span>
          )}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700 px-3.5 py-2 shadow-sm cursor-pointer select-none"
          >
            <Upload size={14} className="mr-1.5 text-slate-500" />
            Choisir une image
          </button>
          <p className="text-[10px] text-slate-400">PNG, JPG, JPEG jusqu'à 5 Mo</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

/* Custom Account Status Toggle Component */
interface AccountStatusSegmentProps {
  value: string;
  onChange: (value: 'active' | 'inactive') => void;
}

function AccountStatusSegment({ value, onChange }: AccountStatusSegmentProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <UserCheck className="text-slate-400" size={14} />
        Statut du compte
      </label>
      <div className="flex bg-slate-100 p-1 rounded-lg w-52 border border-slate-200">
        <button
          type="button"
          onClick={() => onChange('active')}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all select-none cursor-pointer text-center",
            value === 'active'
              ? "bg-teal-600 text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-800"
          )}
        >
          Actif
        </button>
        <button
          type="button"
          onClick={() => onChange('inactive')}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all select-none cursor-pointer text-center",
            value === 'inactive'
              ? "bg-slate-300 text-slate-700 shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-800"
          )}
        >
          Inactif
        </button>
      </div>
    </div>
  );
}

export function UsersPage() {
  const { user } = useAuth();
  const {
    users,
    branches,
    departments,
    isLoading,
    isSaving,
    isCreating,
    isDeleting,
    error,
    saveUserAccess,
    changeUserPassword,
    createUser,
    deleteUser,
  } = useUsersManagement();

  const canCreate = user ? hasModulePermission(user.role, 'users', 'create') : false;
  const canUpdate = user ? hasModulePermission(user.role, 'users', 'update') : false;
  const canDelete = user ? hasModulePermission(user.role, 'users', 'delete') : false;

  const [query, setQuery] = useState('');
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [cardUser, setCardUser] = useState<ManagedUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUserState>(initialNewUserState);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null | undefined>(undefined);

  const editBranchOptions = useMemo(() => {
    if (!editingUser) return [];
    const firstLabel = editingUser.role === 'superadmin' ? 'Global / Non assigne' : 'Selectionner une extension';
    return [
      { value: '', label: firstLabel },
      ...branches.map((b) => ({ value: b.id, label: b.name }))
    ];
  }, [branches, editingUser?.role]);

  const newBranchOptions = useMemo(() => {
    const firstLabel = newUser.role === 'superadmin' ? 'Global / Non assigne' : 'Selectionner une extension';
    return [
      { value: '', label: firstLabel },
      ...branches.map((b) => ({ value: b.id, label: b.name }))
    ];
  }, [branches, newUser.role]);

  // Password visibility visibility toggles
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Search filter for list checklist in department member mode
  const [memberDeptSearch, setMemberDeptSearch] = useState("");

  const scopedUsers = useMemo(() => {
    if (!user) return [];
    if (user.role === 'superadmin') {
      return users;
    }
    if (user.role === 'admin') {
      return users.filter(
        (u) =>
          u.branchId === user.branchId &&
          (u.role === 'department_manager' || u.role === 'department_member')
      );
    }
    return [];
  }, [users, user]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return scopedUsers;
    }

    return scopedUsers.filter((u) => [u.fullName, u.email, u.role].join(' ').toLowerCase().includes(normalized));
  }, [query, scopedUsers]);

  const editableDepartments = editingUser?.branchId
    ? departments.filter((department) => department.branchId === editingUser.branchId)
    : [];

  const creatableDepartments = newUser.branchId
    ? departments.filter((department) => department.branchId === newUser.branchId)
    : [];

  const isDepartmentManagerRole = newUser.role === 'department_manager';
  const isDepartmentMemberRole = newUser.role === 'department_member';
  const isSuperAdminRole = newUser.role === 'superadmin';
  const isAdminRole = newUser.role === 'admin';

  // Filter checklists
  const filteredEditableMemberDepts = useMemo(() => {
    const norm = memberDeptSearch.trim().toLowerCase();
    if (!norm) return editableDepartments;
    return editableDepartments.filter((d) => d.name.toLowerCase().includes(norm));
  }, [editableDepartments, memberDeptSearch]);

  const filteredCreatableMemberDepts = useMemo(() => {
    const norm = memberDeptSearch.trim().toLowerCase();
    if (!norm) return creatableDepartments;
    return creatableDepartments.filter((d) => d.name.toLowerCase().includes(norm));
  }, [creatableDepartments, memberDeptSearch]);

  const canSubmitCreateForm = (() => {
    const hasName = Boolean(newUser.fullName.trim());
    const hasEmail = Boolean(newUser.email.trim());
    const hasPassword = newUser.password.trim().length >= 8;
    if (!hasName || !hasEmail || !hasPassword) {
      return false;
    }

    if (isSuperAdminRole) {
      return true;
    }
    if (isAdminRole) {
      return typeof newUser.branchId === 'string' && newUser.branchId !== '';
    }
    if (isDepartmentManagerRole) {
      return typeof newUser.branchId === 'string' && newUser.branchId !== '' && typeof newUser.primaryDepartmentId === 'string' && newUser.primaryDepartmentId !== '';
    }
    if (isDepartmentMemberRole) {
      return typeof newUser.branchId === 'string' && newUser.branchId !== '' && newUser.departmentIds.length > 0;
    }
    return true;
  })();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Gestion des comptes, roles et affectations departementales."
        actions={
          canCreate ? (
            <AppButton onClick={() => {
              setPhotoFile(undefined);
              setMemberDeptSearch("");
              setShowCreatePassword(false);
              setNewUser({
                ...initialNewUserState,
                branchId: user?.role === 'admin' ? (user.branchId || '') : '',
              });
              setIsCreateModalOpen(true);
            }}>
              Nouvel utilisateur
            </AppButton>
          ) : undefined
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un utilisateur..." />
      </PageHeader>

      {error ? (
        <EmptyState
          title="Donnees utilisateurs partielles"
          description={error}
        />
      ) : null}

      {isLoading ? (
        <LoadingState message="Chargement des utilisateurs..." />
      ) : (
        <DataTable
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: 'name',
              label: 'Utilisateur',
              render: (item) => (
                <div className="flex items-center gap-3">
                  <Avatar name={item.fullName} avatarUrl={item.avatarUrl} size="md" />
                  <div className="text-left">
                    <p className="font-medium text-slate-800">{item.fullName}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                  </div>
                </div>
              ),
            },
            { key: 'role', label: 'Role', render: (item) => item.role },
            {
              key: 'branch',
              label: 'Extension',
              render: (item) => branches.find((branch) => branch.id === item.branchId)?.name ?? 'Global',
            },
            {
              key: 'departments',
              label: 'Departements',
              render: (item) => (item.departmentIds.length > 0 ? item.departmentIds.length : '-'),
            },
            {
              key: 'status',
              label: 'Statut',
              render: (item) => (
                <span className={item.status === 'active' ? 'text-emerald-600 font-semibold' : 'text-rose-600'}>
                  {item.status}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (item) => (
                <ActionMenu
                  items={[
                    canUpdate ? { label: 'Modifier', onClick: () => {
                        setPhotoFile(undefined);
                        setMemberDeptSearch("");
                        setShowEditPassword(false);
                        setEditingUser({
                          id: item.id,
                          fullName: item.fullName,
                          email: item.email,
                          role: item.role,
                          branchId: item.branchId || '',
                          departmentIds: [...item.departmentIds],
                          newPassword: '',
                          avatarUrl: item.avatarUrl,
                          status: item.status || 'active',
                        });
                      } } : null,
                    user.role === 'superadmin' ? { label: 'Carte', onClick: () => setCardUser(item) } : null,
                    canDelete && item.id !== user?.id ? { label: 'Supprimer', variant: 'danger', onClick: () => setDeleteUserId(item.id) } : null,
                  ].filter(Boolean)}
                />
              ),
            },
          ]}
        />
      )}

      <UserCardModal
        isOpen={Boolean(cardUser)}
        onClose={() => setCardUser(null)}
        user={cardUser}
        branchName={cardUser ? branches.find((branch) => branch.id === cardUser.branchId)?.name : undefined}
        departmentNames={cardUser ? cardUser.departmentIds.map((id) => departments.find((department) => department.id === id)?.name).filter((name): name is string => Boolean(name)) : []}
      />

      {/* EDIT USER ACCESS / RIGHTS MODAL */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={editingUser ? `Accès utilisateur - ${editingUser.fullName}` : 'Accès utilisateur'}
        subtitle="Définir le rôle, l’affectation et les accès de l’utilisateur."
        className="max-w-4xl"
      >
        {editingUser ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Rôle */}
                <div>
                  <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Shield className="text-slate-400" size={14} />
                    Rôle
                  </label>
                  <AppSelect
                    value={editingUser.role}
                    onChange={(event) =>
                      setEditingUser((current) => {
                        if (!current) return null;
                        const nextRole = event.target.value as Role;
                        return {
                          ...current,
                          role: nextRole,
                          branchId: nextRole === 'superadmin' ? '' : current.branchId,
                          departmentIds: nextRole === 'superadmin' || nextRole === 'admin' ? [] : current.departmentIds,
                        };
                      })
                    }
                  >
                    {roleOptions
                      .filter((opt) => user?.role === 'superadmin' ? true : (opt.value === 'department_manager' || opt.value === 'department_member'))
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </AppSelect>
                </div>

                {/* Password Change */}
                <div>
                  <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock className="text-slate-400" size={14} />
                    Nouveau mot de passe (optionnel)
                  </label>
                  <div className="relative">
                    <AppInput
                      type={showEditPassword ? "text" : "password"}
                      value={editingUser.newPassword}
                      onChange={(event) =>
                        setEditingUser((current) =>
                          current
                            ? {
                                ...current,
                                newPassword: event.target.value,
                              }
                            : current,
                        )
                      }
                      placeholder="Laisser vide pour ne pas changer"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Avatar upload */}
                <ProfileImageUpload
                  value={editingUser.avatarUrl}
                  onChange={setPhotoFile}
                  nameInitial={editingUser.fullName}
                />

                {/* Account status segmented switch */}
                <AccountStatusSegment
                  value={editingUser.status}
                  onChange={(val) => setEditingUser((current) => current ? { ...current, status: val } : current)}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Extension */}
                <div>
                  <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="text-slate-400" size={14} />
                    Extension
                  </label>
                  <AppCombobox
                    value={editingUser.branchId}
                    onChange={(val) =>
                      setEditingUser((current) =>
                        current
                          ? {
                              ...current,
                              branchId: val,
                              departmentIds: [],
                            }
                          : current,
                      )
                    }
                    options={editBranchOptions}
                    disabled={user?.role === 'admin'}
                  />
                </div>

                {/* Department responsible: Combobox */}
                {editingUser.role === 'department_manager' && (
                  <div>
                    <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Briefcase className="text-slate-400" size={14} />
                      Département responsable
                    </label>
                    <SearchableDepartmentSelect
                      value={editingUser.departmentIds[0] || ''}
                      onChange={(val) =>
                        setEditingUser((current) =>
                          current
                            ? {
                                ...current,
                                departmentIds: val ? [val] : [],
                              }
                            : current,
                        )
                      }
                      departments={editableDepartments}
                      branchId={editingUser.branchId}
                      placeholder="Sélectionner un département"
                    />
                    {editingUser.branchId && editableDepartments.length === 0 && (
                      <p className="mt-1.5 text-xs text-rose-500 font-medium">Aucun departement n'existe dans cette extension.</p>
                    )}
                  </div>
                )}

                {/* Department member: Checklist */}
                {editingUser.role === 'department_member' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Briefcase className="text-slate-400" size={14} />
                      Départements
                    </label>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                      {/* Search Bar inside Member Checklist */}
                      <div className="bg-slate-50 border-b border-slate-100 p-2 flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={memberDeptSearch}
                            onChange={(e) => setMemberDeptSearch(e.target.value)}
                            placeholder="Rechercher un département..."
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        {memberDeptSearch && (
                          <button
                            type="button"
                            onClick={() => setMemberDeptSearch("")}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Checklist Options List */}
                      <div className="max-h-44 overflow-y-auto p-2 divide-y divide-slate-50 scrollbar-thin">
                        {!editingUser.branchId ? (
                          <p className="text-xs text-slate-400 text-center py-4">Selectionnez d'abord une extension.</p>
                        ) : editableDepartments.length === 0 ? (
                          <p className="text-xs text-rose-500 text-center py-4 font-medium">Aucun departement n'existe dans cette extension.</p>
                        ) : filteredEditableMemberDepts.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">Aucun résultat trouvé.</p>
                        ) : (
                          filteredEditableMemberDepts.map((department) => (
                            <label
                              key={department.id}
                              className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 hover:bg-slate-50 transition-colors rounded-lg select-none text-xs text-slate-700"
                            >
                              <input
                                type="checkbox"
                                checked={editingUser.departmentIds.includes(department.id)}
                                onChange={(event) =>
                                  setEditingUser((current) => {
                                    if (!current) return current;
                                    const selected = new Set(current.departmentIds);
                                    if (event.target.checked) {
                                      selected.add(department.id);
                                    } else {
                                      selected.delete(department.id);
                                    }
                                    return { ...current, departmentIds: Array.from(selected) };
                                  })
                                }
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                              />
                              <span>{department.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Administrator rights info card */}
                {(editingUser.role === 'superadmin' || editingUser.role === 'admin') && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 leading-normal space-y-2">
                    <p className="font-semibold text-slate-700">Droits d'accès élargis :</p>
                    <p>Cet utilisateur dispose d'un rôle d'administration global ou partiel. Il n'est pas nécessaire de l'assigner à des départements spécifiques.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal action buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <AppButton variant="secondary" onClick={() => setEditingUser(null)} className="cursor-pointer select-none">
                Annuler
              </AppButton>
              <AppButton
                isLoading={isSaving}
                onClick={async () => {
                  setEditError(null);
                  if (editingUser.newPassword && editingUser.newPassword.length < 8) {
                    setEditError('Le mot de passe doit contenir au moins 8 caractères.');
                    return;
                  }

                  if (editingUser.role === 'admin' && !editingUser.branchId) {
                    setEditError("L'extension est obligatoire pour le role Admin.");
                    return;
                  }
                  if (editingUser.role === 'department_manager') {
                    if (!editingUser.branchId) {
                      setEditError("L'extension est obligatoire pour le role Responsable.");
                      return;
                    }
                    if (editingUser.departmentIds.length === 0) {
                      setEditError("Le departement responsable est obligatoire.");
                      return;
                    }
                  }
                  if (editingUser.role === 'department_member') {
                    if (!editingUser.branchId) {
                      setEditError("L'extension est obligatoire pour le role Membre.");
                      return;
                    }
                    if (editingUser.departmentIds.length === 0) {
                      setEditError("Au moins un departement est obligatoire.");
                      return;
                    }
                  }

                  let uploadedUrl = (editingUser as any).avatarUrl || null;
                  if (photoFile) {
                    try {
                      uploadedUrl = await uploadPhoto(photoFile, 'profiles');
                    } catch (err) {
                      setEditError("Impossible d'uploader la photo.");
                      return;
                    }
                  } else if (photoFile === null) {
                    uploadedUrl = null;
                  }

                  const success = await saveUserAccess(editingUser.id, {
                    role: editingUser.role,
                    branchId: editingUser.branchId,
                    departmentIds: editingUser.departmentIds,
                    avatarUrl: uploadedUrl,
                    status: editingUser.status,
                  });

                  if (!success) {
                    setEditError(error || "Erreur lors de l'enregistrement des droits utilisateur.");
                    return;
                  }

                  if (editingUser.newPassword) {
                    try {
                      const passwordUpdated = await changeUserPassword(editingUser.id, editingUser.newPassword);
                      if (!passwordUpdated) {
                        setEditError('Erreur lors de la modification du mot de passe.');
                        return;
                      }
                    } catch (err: unknown) {
                      const message =
                        err instanceof Error
                          ? err.message
                          : typeof err === 'object' && err !== null && 'message' in err
                          ? String((err as { message?: unknown }).message ?? '')
                          : '';
                      setEditError(message || 'Erreur lors de la modification du mot de passe.');
                      return;
                    }
                  }

                  if (success) {
                    setEditSuccess(true);
                    setTimeout(() => {
                      setEditSuccess(false);
                      setEditingUser(null);
                    }, 1500);
                  }
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer select-none flex items-center gap-1.5"
              >
                <Save size={14} />
                Enregistrer
              </AppButton>
            </div>

            {editSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Modifications enregistrées avec succès !
              </div>
            )}
            {editError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {editError}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* CREATE NEW USER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewUser(initialNewUserState);
        }}
        title="Créer un utilisateur"
        subtitle="Créer un nouveau profil d'accès avec rôles et affectations système."
        className="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Nom complet */}
              <div>
                <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <UserIcon className="text-slate-400" size={14} />
                  Nom complet
                </label>
                <AppInput
                  value={newUser.fullName}
                  onChange={(event) => setNewUser((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Ex: Jean Kasongo"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="text-slate-400" size={14} />
                  Email
                </label>
                <AppInput
                  type="email"
                  value={newUser.email}
                  onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Ex: jean.kasongo@eglise.org"
                />
              </div>

              {/* Provisory Password */}
              <div>
                <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="text-slate-400" size={14} />
                  Mot de passe provisoire
                </label>
                <div className="relative">
                  <AppInput
                    type={showCreatePassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Minimum 8 caractères"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Rôle */}
              <div>
                <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Shield className="text-slate-400" size={14} />
                  Rôle
                </label>
                <AppSelect
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser((current) => {
                      const nextRole = event.target.value as Role;
                      return {
                        ...current,
                        role: nextRole,
                        branchId: nextRole === 'superadmin' ? '' : current.branchId,
                        departmentIds: [],
                        primaryDepartmentId: '',
                      };
                    })
                  }
                >
                  {roleOptions
                    .filter((opt) => user?.role === 'superadmin' ? true : (opt.value === 'department_manager' || opt.value === 'department_member'))
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </AppSelect>
              </div>

              {/* Avatar Upload */}
              <ProfileImageUpload
                value={null}
                onChange={setPhotoFile}
                nameInitial={newUser.fullName || 'U'}
              />

              {/* Account Status Segment */}
              <AccountStatusSegment
                value={newUser.status}
                onChange={(val) => setNewUser((current) => ({ ...current, status: val }))}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Extension */}
              <div>
                <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="text-slate-400" size={14} />
                  Extension
                </label>
                <AppCombobox
                  value={newUser.branchId}
                  onChange={(val) =>
                    setNewUser((current) => ({
                      ...current,
                      branchId: val,
                      departmentIds: [],
                      primaryDepartmentId: '',
                    }))
                  }
                  options={newBranchOptions}
                  disabled={user?.role === 'admin'}
                />
              </div>

              {/* Department manager: Searchable Select */}
              {newUser.role === 'department_manager' && (
                <div>
                  <label className="mb-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="text-slate-400" size={14} />
                    Département responsable
                  </label>
                  <SearchableDepartmentSelect
                    value={newUser.primaryDepartmentId}
                    onChange={(val) =>
                      setNewUser((current) => {
                        const selectedDepartment = departments.find((department) => department.id === val);
                        return {
                          ...current,
                          primaryDepartmentId: val,
                          departmentIds: val ? [val] : [],
                          branchId: selectedDepartment?.branchId ?? current.branchId,
                        };
                      })
                    }
                    departments={creatableDepartments}
                    branchId={newUser.branchId}
                    placeholder="Sélectionner un département"
                  />
                  {newUser.branchId && creatableDepartments.length === 0 && (
                    <p className="mt-1.5 text-xs text-rose-500 font-medium">Aucun departement n'existe dans cette extension.</p>
                  )}
                </div>
              )}

              {/* Department Member: Searchable Checklist */}
              {newUser.role === 'department_member' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="text-slate-400" size={14} />
                    Départements
                  </label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    {/* Search Bar inside Member Checklist */}
                    <div className="bg-slate-50 border-b border-slate-100 p-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={memberDeptSearch}
                          onChange={(e) => setMemberDeptSearch(e.target.value)}
                          placeholder="Rechercher un département..."
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      {memberDeptSearch && (
                        <button
                          type="button"
                          onClick={() => setMemberDeptSearch("")}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Checklist Options List */}
                    <div className="max-h-44 overflow-y-auto p-2 divide-y divide-slate-50 scrollbar-thin">
                      {!newUser.branchId ? (
                        <p className="text-xs text-slate-400 text-center py-4">Selectionnez d'abord une extension.</p>
                      ) : creatableDepartments.length === 0 ? (
                        <p className="text-xs text-rose-500 text-center py-4 font-medium">Aucun departement n'existe dans cette extension.</p>
                      ) : filteredCreatableMemberDepts.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Aucun résultat trouvé.</p>
                      ) : (
                        filteredCreatableMemberDepts.map((department) => (
                          <label
                            key={department.id}
                            className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 hover:bg-slate-50 transition-colors rounded-lg select-none text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={newUser.departmentIds.includes(department.id)}
                              onChange={(event) =>
                                setNewUser((current) => {
                                  const selected = new Set(current.departmentIds);
                                  if (event.target.checked) {
                                    selected.add(department.id);
                                  } else {
                                    selected.delete(department.id);
                                  }
                                  return { ...current, departmentIds: Array.from(selected) };
                                })
                              }
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span>{department.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Administrator rights info card */}
              {(newUser.role === 'superadmin' || newUser.role === 'admin') && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 leading-normal space-y-2">
                  <p className="font-semibold text-slate-700">Droits d'accès élargis :</p>
                  <p>Cet utilisateur dispose d'un rôle d'administration global ou partiel. Il n'est pas nécessaire de l'assigner à des départements spécifiques.</p>
                </div>
              )}

              {/* Creation reservation notice card */}
              <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-xs text-teal-800 leading-normal">
                Creation reservee a l'administration. Seul le super admin doit creer les comptes responsables.
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {/* Modal action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <AppButton
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewUser(initialNewUserState);
              }}
              className="cursor-pointer select-none"
            >
              Annuler
            </AppButton>
            <AppButton
              isLoading={isCreating}
              disabled={!canSubmitCreateForm}
              onClick={async () => {
                const fullName = newUser.fullName.trim();
                const email = newUser.email.trim().toLowerCase();
                const password = newUser.password.trim();

                if (!fullName || !email || password.length < 8) {
                  return;
                }

                if (newUser.role === 'admin' && !newUser.branchId) {
                  return;
                }
                if (newUser.role === 'department_manager' && (!newUser.branchId || !newUser.primaryDepartmentId)) {
                  return;
                }
                if (newUser.role === 'department_member' && (!newUser.branchId || newUser.departmentIds.length === 0)) {
                  return;
                }

                let uploadedUrl: string | null = null;
                if (photoFile) {
                  try {
                    uploadedUrl = await uploadPhoto(photoFile, 'profiles');
                  } catch (err) {
                    return;
                  }
                }

                const success = await createUser({
                  fullName,
                  email,
                  password,
                  role: newUser.role,
                  branchId: newUser.branchId,
                  departmentIds: newUser.departmentIds,
                  avatarUrl: uploadedUrl,
                  status: newUser.status,
                });

                if (success) {
                  setIsCreateModalOpen(false);
                  setNewUser(initialNewUserState);
                }
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer select-none flex items-center gap-1.5"
            >
              <Save size={14} />
              Créer le compte
            </AppButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteUserId)}
        title="Supprimer cet utilisateur ?"
        description="Cette action supprime le profil utilisateur et ses affectations departementales."
        onCancel={() => setDeleteUserId(null)}
        onConfirm={async () => {
          if (!deleteUserId) {
            return;
          }

          const ok = await deleteUser(deleteUserId);
          if (ok) {
            setDeleteUserId(null);
          }
        }}
        confirmLabel={isDeleting ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  );
}
