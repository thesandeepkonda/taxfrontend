// src/features/admin/resueables/CreateEmployeeModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { createEmployee, clearError } from '../../../store/slices/usersSlice';
import {
  fetchTeamsByDepartment,
  clearDepartmentTeams,
} from '../../../store/slices/teamsSlice';
import { fetchAttendancePolicies } from '../../../store/slices/attendanceSlice';
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS } from '../../../constants/enums';
import { useToast } from '../../../contexts/ToastContext';
import {
  UserPlus, CheckCircle, Loader2, Users, Building2,
  Shield, ChevronRight, ChevronLeft, Briefcase, IdCard, Check,
  AlertCircle, Clock, X, Phone,
} from 'lucide-react';

interface FormErrors {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  teamId?: string;
  role?: string;
  attendancePolicyId?: string;
  workMode?: string;
}

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedDepartment?: string | null;
  preSelectedTeamId?: number | null;
}

const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedDepartment = null,
  preSelectedTeamId = null,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const { loading } = useSelector((state: RootState) => state.users);
  // ✅ Teams come from departmentTeams (server-side filter by enum)
  const { departmentTeams, loading: teamsLoading } = useSelector(
    (state: RootState) => state.teams
  );
  const { list: attendancePolicies } = useSelector(
    (state: RootState) => state.attendance
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    teamId: '',
    role: '',
    attendancePolicyId: '',
    workMode: '',
    callHippoApiToken: '',
    callHippoFromNumber: '',
    callHippoAgentId: '',
  });

  const [success, setSuccess] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const fetchedOnceRef = useRef(false);
  const lastFetchedDeptRef = useRef<string>('');

  // ============================================================
  // Effect 1: Fetch attendance policies only (teams are per-dept)
  // ============================================================
  useEffect(() => {
    if (!isOpen) {
      fetchedOnceRef.current = false;
      lastFetchedDeptRef.current = '';
      return;
    }

    if (fetchedOnceRef.current) return;
    fetchedOnceRef.current = true;

    setFetchingData(true);
    (async () => {
      try {
        await dispatch(fetchAttendancePolicies())
          .unwrap()
          .catch(() => null);
      } catch (err) {
        console.error('Error fetching attendance policies:', err);
      } finally {
        setFetchingData(false);
      }
    })();
  }, [isOpen, dispatch]);

  // ============================================================
  // Effect 2: Apply defaults (no API calls)
  // ============================================================
  useEffect(() => {
    if (!isOpen) return;

    setFormData((prev) => ({
      ...prev,
      department:
        prev.department ||
        preSelectedDepartment ||
        DEPARTMENT_OPTIONS[0].value,
      role: prev.role || ROLE_OPTIONS[0].value,
      attendancePolicyId:
        prev.attendancePolicyId ||
        (attendancePolicies.length > 0
          ? String(attendancePolicies[0].attendancePolicyId)
          : ''),
      workMode: prev.workMode || 'OFFICE',
    }));
  }, [
    isOpen,
    preSelectedDepartment,
    preSelectedTeamId,
    attendancePolicies,
  ]);

  // ============================================================
  // Effect 3: Fetch teams whenever department enum changes
  // ============================================================
  useEffect(() => {
    if (!isOpen) return;
    const deptEnum = formData.department;
    if (!deptEnum) return;

    // avoid refetch if same dept already loaded
    if (lastFetchedDeptRef.current === deptEnum && departmentTeams.length > 0) {
      return;
    }
    lastFetchedDeptRef.current = deptEnum;

    dispatch(clearDepartmentTeams());
    dispatch(fetchTeamsByDepartment(deptEnum));
  }, [isOpen, formData.department, dispatch]);

  // ============================================================
  // Effect 4: Reset form when modal closes
  // ============================================================
  useEffect(() => {
    if (isOpen) return;

    setFormData({
      employeeCode: '', firstName: '', lastName: '', email: '', phone: '',
      department: '', teamId: '', role: '', attendancePolicyId: '', workMode: '',
      callHippoApiToken: '', callHippoFromNumber: '', callHippoAgentId: '',
    });
    setFormErrors({});
    setTouched({});
    setCurrentStep(1);
    setSuccess(false);
    setCreatedEmployee(null);
    dispatch(clearDepartmentTeams());
    dispatch(clearError());
  }, [isOpen, dispatch]);

  // ============================================================
  // Effect 5: Preselect team (only after teams load)
  // ============================================================
  useEffect(() => {
    if (!isOpen) return;
    if (!preSelectedTeamId) return;
    if (formData.teamId) return;
    if (departmentTeams.length === 0) return;

    const exists = departmentTeams.some((t) => t.id === preSelectedTeamId);
    if (exists) {
      setFormData((prev) => ({ ...prev, teamId: String(preSelectedTeamId) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, departmentTeams.length, preSelectedTeamId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'department') updated.teamId = '';
      return updated;
    });
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    const errors: FormErrors = { ...formErrors };

    switch (name) {
      case 'employeeCode':
        if (!value.trim()) errors.employeeCode = 'Employee code is required';
        else if (value.trim().length < 3)
          errors.employeeCode = 'Must be at least 3 characters';
        else if (value.trim().length > 30)
          errors.employeeCode = 'Must not exceed 30 characters';
        else delete errors.employeeCode;
        break;
      case 'firstName':
        if (!value.trim()) errors.firstName = 'First name is required';
        else if (value.trim().length > 100)
          errors.firstName = 'Must not exceed 100 characters';
        else delete errors.firstName;
        break;
      case 'email':
        if (!value.trim()) errors.email = 'Email is required';
        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim()))
          errors.email = 'Enter a valid email address';
        else delete errors.email;
        break;
      case 'phone':
        if (!value.trim()) errors.phone = 'Phone number is required';
        else if (!/^[0-9]{10}$/.test(value.trim()))
          errors.phone = 'Phone number must be exactly 10 digits';
        else delete errors.phone;
        break;
      case 'department':
        if (!value) errors.department = 'Department is required';
        else delete errors.department;
        break;
      case 'teamId':
        if (!value) errors.teamId = 'Team is required';
        else delete errors.teamId;
        break;
      case 'role':
        if (!value) errors.role = 'Role is required';
        else delete errors.role;
        break;
      case 'attendancePolicyId':
        if (!value) errors.attendancePolicyId = 'Attendance policy is required';
        else delete errors.attendancePolicyId;
        break;
      case 'workMode':
        if (!value) errors.workMode = 'Work mode is required';
        else delete errors.workMode;
        break;
    }

    setFormErrors(errors);
    return errors;
  };

  const validateStep = (step: number): boolean => {
    const fields: Record<number, string[]> = {
      1: ['employeeCode', 'firstName', 'lastName', 'email', 'phone'],
      2: ['department', 'teamId', 'role', 'attendancePolicyId', 'workMode'],
    };

    const stepFields = fields[step] || [];
    let isValid = true;
    const newErrors: FormErrors = { ...formErrors };

    stepFields.forEach((field) => {
      const value = formData[field as keyof typeof formData] as string;
      const errors = validateField(field, value);
      if (errors[field as keyof FormErrors]) {
        isValid = false;
        newErrors[field as keyof FormErrors] = errors[field as keyof FormErrors];
      }
    });

    setFormErrors(newErrors);
    const newTouched: Record<string, boolean> = {};
    stepFields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched((prev) => ({ ...prev, ...newTouched }));
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep((prev) => prev + 1);
    else showToast('Please fix all errors before proceeding', 'error');
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) {
      showToast('Please fix all errors before submitting', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      setSuccess(false);
      dispatch(clearError());

      const payload = {
        employeeCode: formData.employeeCode.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || null,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department,       // ✅ enum
        teamId: Number(formData.teamId),
        role: formData.role,                    // ✅ enum
        attendancePolicyId: Number(formData.attendancePolicyId),
        workMode: formData.workMode as 'OFFICE' | 'WORK_FROM_HOME' | 'HYBRID',
        callHippoApiToken: formData.callHippoApiToken.trim() || undefined,
        callHippoFromNumber: formData.callHippoFromNumber.trim() || undefined,
        callHippoAgentId: formData.callHippoAgentId.trim() || undefined,
      };

      console.log('📤 createEmployee payload:', payload);

      const result = await dispatch(createEmployee(payload)).unwrap();
      setCreatedEmployee(result);
      setSuccess(true);
      showToast(
        `Employee "${result.firstName} ${result.lastName || ''}" created!`,
        'success'
      );

      setFormData({
        employeeCode: '', firstName: '', lastName: '', email: '', phone: '',
        department: formData.department,
        teamId: '',
        role: formData.role,
        attendancePolicyId: formData.attendancePolicyId,
        workMode: formData.workMode,
        callHippoApiToken: '', callHippoFromNumber: '', callHippoAgentId: '',
      });
      setFormErrors({});
      setTouched({});
      setCurrentStep(1);

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setSuccess(false);
        setCreatedEmployee(null);
      }, 5000);
    } catch (err: any) {
      showToast(err || 'Failed to create employee', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-100">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5f41b2]/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#5f41b2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1b2559]">
                Create New Employee
              </h3>
              <p className="text-xs text-slate-500">
                Add a new employee to the system
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {fetchingData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#5f41b2] animate-spin mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Loading form data...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-emerald-800">
                        Employee Created Successfully!
                      </h4>
                      <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">
                        <span className="font-bold">
                          {createdEmployee?.firstName}{' '}
                          {createdEmployee?.lastName}
                        </span>{' '}
                        ({createdEmployee?.employeeCode})
                      </p>
                      <div className="mt-2.5 p-2.5 bg-emerald-100/60 rounded-lg border border-emerald-200 text-xs text-emerald-800 space-y-1">
                        <p>
                          <span className="font-semibold">
                            Temporary Password:
                          </span>{' '}
                          <span className="font-mono font-bold">
                            {createdEmployee?.temporaryPassword}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold">Role:</span>{' '}
                          {createdEmployee?.roleName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <IdCard className="w-5 h-5 text-[#5f41b2]" />
                    <h2 className="text-sm sm:text-base font-bold text-[#1b2559]">
                      Personal Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        Employee Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="employeeCode"
                        value={formData.employeeCode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g., EMP001"
                        className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] ${
                          touched.employeeCode && formErrors.employeeCode
                            ? 'border-rose-500'
                            : 'border-slate-300'
                        }`}
                        disabled={isSubmitting}
                        required
                        autoFocus
                      />
                      {touched.employeeCode && formErrors.employeeCode && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.employeeCode}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g., John"
                        className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] ${
                          touched.firstName && formErrors.firstName
                            ? 'border-rose-500'
                            : 'border-slate-300'
                        }`}
                        disabled={isSubmitting}
                        required
                      />
                      {touched.firstName && formErrors.firstName && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.firstName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        Last Name{' '}
                        <span className="text-slate-400 font-normal">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g., Doe"
                        className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2]"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="john.doe@company.com"
                        className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] ${
                          touched.email && formErrors.email
                            ? 'border-rose-500'
                            : 'border-slate-300'
                        }`}
                        disabled={isSubmitting}
                        required
                      />
                      {touched.email && formErrors.email && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="9876543210 (10 digits)"
                      className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] ${
                        touched.phone && formErrors.phone
                          ? 'border-rose-500'
                          : 'border-slate-300'
                      }`}
                      disabled={isSubmitting}
                      required
                    />
                    {touched.phone && formErrors.phone && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white font-bold px-6 py-2.5 rounded-xl transition active:scale-95"
                    >
                      <span>Next Step</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Briefcase className="w-5 h-5 text-[#5f41b2]" />
                    <h2 className="text-sm sm:text-base font-bold text-[#1b2559]">
                      Role & Work Configuration
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    {/* Department - ENUM */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        <Building2 className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                        Department <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white"
                        disabled={isSubmitting}
                        required
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENT_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                      {touched.department && formErrors.department && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.department}
                        </p>
                      )}
                    </div>

                    {/* Team - fetched by department enum */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        <Users className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                        Team <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="teamId"
                        value={formData.teamId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white"
                        disabled={
                          isSubmitting || !formData.department || teamsLoading
                        }
                        required
                      >
                        <option value="">
                          {teamsLoading
                            ? 'Loading teams...'
                            : !formData.department
                            ? 'Select department first'
                            : 'Select Team'}
                        </option>
                        {departmentTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      {touched.teamId && formErrors.teamId && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.teamId}
                        </p>
                      )}
                      {!teamsLoading &&
                        formData.department &&
                        departmentTeams.length === 0 && (
                          <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            No teams in this department
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Role - ENUM */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                      <Shield className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                      Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white"
                      disabled={isSubmitting}
                      required
                    >
                      <option value="">Select a Role</option>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {touched.role && formErrors.role && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.role}
                      </p>
                    )}
                  </div>

                  {/* Attendance Policy */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                      Attendance Policy{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="attendancePolicyId"
                      value={formData.attendancePolicyId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white"
                      disabled={isSubmitting || attendancePolicies.length === 0}
                      required
                    >
                      <option value="">Select Attendance Policy</option>
                      {attendancePolicies.map((policy) => (
                        <option
                          key={policy.attendancePolicyId}
                          value={policy.attendancePolicyId}
                        >
                          {policy.name} ({policy.startTime} - {policy.endTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Work Mode */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                      Work Mode <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['OFFICE', 'WORK_FROM_HOME', 'HYBRID'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, workMode: mode }));
                            setTouched((prev) => ({ ...prev, workMode: true }));
                            validateField('workMode', mode);
                          }}
                          className={`min-h-[44px] px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border transition ${
                            formData.workMode === mode
                              ? 'bg-[#5f41b2] text-white border-[#5f41b2]'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {mode.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CallHippo */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Phone className="w-4 h-4 text-[#5f41b2]" />
                      <h3 className="text-xs sm:text-sm font-bold text-[#1b2559]">
                        CallHippo Configuration{' '}
                        <span className="text-slate-400 font-normal">
                          (Optional)
                        </span>
                      </h3>
                    </div>

                    <input
                      type="text"
                      name="callHippoApiToken"
                      value={formData.callHippoApiToken}
                      onChange={handleChange}
                      placeholder="Enter CallHippo API Token"
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white font-mono"
                      disabled={isSubmitting}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="callHippoFromNumber"
                        value={formData.callHippoFromNumber}
                        onChange={handleChange}
                        placeholder="e.g., +1234567890"
                        className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white"
                        disabled={isSubmitting}
                      />
                      <input
                        type="text"
                        name="callHippoAgentId"
                        value={formData.callHippoAgentId}
                        onChange={handleChange}
                        placeholder="Enter Agent ID"
                        className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-between gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="min-h-[44px] flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-h-[44px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-sm active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Create Employee</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEmployeeModal;