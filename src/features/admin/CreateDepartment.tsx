// src/features/admin/CreateDepartment.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createDepartment, clearError } from '../../store/slices/departmentsSlice';
import { useToast } from '../../contexts/ToastContext';
import { Building2, CheckCircle, XCircle, Loader2, ChevronDown, AlertCircle, Plus } from 'lucide-react';

const CreateDepartment: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.departments);
  const { showToast } = useToast();

  // Base predefined options
  const baseOptions = [
    { value: 'DOCUMENTATION', label: 'DOCUMENTATION' },
    { value: 'PREPARATION', label: 'PREPARATION' },
    { value: 'ESTIMATION', label: 'ESTIMATION' },
    { value: 'PAYMENTS', label: 'PAYMENTS' },
    { value: 'E-FILING', label: 'E-FILING' },
  ];

  // State for dropdown options (includes custom ones)
  const [options, setOptions] = useState(baseOptions);
  const [departmentName, setDepartmentName] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdDepartment, setCreatedDepartment] = useState<any>(null);
  const [touched, setTouched] = useState<{ name: boolean; description: boolean }>({
    name: false,
    description: false,
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({});

  // New custom input state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const customInputRef = useRef<HTMLInputElement>(null);

  // Focus custom input when shown
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  const validateField = (name: string, value: string) => {
    const errors = { ...formErrors };

    if (name === 'name') {
      if (!value.trim()) {
        errors.name = 'Department name is required';
      } else if (value.trim().length < 2) {
        errors.name = 'Department name must be at least 2 characters';
      } else if (value.trim().length > 100) {
        errors.name = 'Department name must not exceed 100 characters';
      } else {
        delete errors.name;
      }
    }

    if (name === 'description') {
      if (value.trim().length > 255) {
        errors.description = 'Description must not exceed 255 characters';
      } else {
        delete errors.description;
      }
    }

    setFormErrors(errors);
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'departmentName') {
      // Check if "add-new" is selected
      if (value === 'ADD_NEW') {
        setShowCustomInput(true);
        setDepartmentName('');
        setTouched(prev => ({ ...prev, name: true }));
        return;
      }

      setShowCustomInput(false);
      setDepartmentName(value);
      setTouched(prev => ({ ...prev, name: true }));
      validateField('name', value);
    } else if (name === 'description') {
      setDescription(value);
      setTouched(prev => ({ ...prev, description: true }));
      validateField('description', value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'departmentName') {
      setTouched(prev => ({ ...prev, name: true }));
      validateField('name', value);
    } else if (name === 'description') {
      setTouched(prev => ({ ...prev, description: true }));
      validateField('description', value);
    }
  };

  // Handle adding custom department name
  const handleAddCustomName = () => {
    const trimmed = customName.trim().toUpperCase();
    if (!trimmed) {
      showToast('Please enter a department name', 'error');
      return;
    }

    // Check if already exists in options
    const exists = options.some(opt => opt.value === trimmed);
    if (exists) {
      showToast(`Department "${trimmed}" already exists in the list`, 'warning');
      setShowCustomInput(false);
      setCustomName('');
      // Select the existing one
      setDepartmentName(trimmed);
      return;
    }

    // Add new option
    const newOption = { value: trimmed, label: trimmed };
    setOptions(prev => [...prev, newOption]);
    setDepartmentName(trimmed);
    setShowCustomInput(false);
    setCustomName('');
    // Validate the new name
    validateField('name', trimmed);
    setTouched(prev => ({ ...prev, name: true }));
  };

  // Handle cancel custom input
  const handleCancelCustom = () => {
    setShowCustomInput(false);
    setCustomName('');
    // Reset to first option or empty
    setDepartmentName('');
  };

  // Handle pressing Enter in custom input
  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomName();
    } else if (e.key === 'Escape') {
      handleCancelCustom();
    }
  };

  const validateForm = (): boolean => {
    const nameErrors = validateField('name', departmentName);
    const descErrors = validateField('description', description);
    setTouched({ name: true, description: true });
    return Object.keys(nameErrors).length === 0 && Object.keys(descErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix all errors before submitting', 'error');
      return;
    }

    try {
      setSuccess(false);
      dispatch(clearError());

      const result = await dispatch(createDepartment({
        name: departmentName.trim(),
        description: description.trim() || null,
      })).unwrap();

      setCreatedDepartment(result);
      setSuccess(true);
      showToast(`Department "${result.name}" created successfully!`, 'success');

      setDepartmentName('');
      setDescription('');
      setFormErrors({});
      setTouched({ name: false, description: false });
      setShowCustomInput(false);
      setCustomName('');
      // Reset options to base (custom ones are not permanent across submissions)
      setOptions(baseOptions);

      setTimeout(() => {
        setSuccess(false);
        setCreatedDepartment(null);
      }, 5000);

    } catch (err: any) {
      const errorMessage = err || 'Failed to create department. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  return (
    <div className="w-full flex flex-col font-sans overflow-x-hidden gap-y-4">
      {/* Main Content Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-6 lg:p-8">
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 mb-5 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-emerald-800">Department Created Successfully!</h4>
                <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">
                  Department <span className="font-bold">{createdDepartment?.name}</span> created with ID: {createdDepartment?.id}
                </p>
                {createdDepartment?.description && (
                  <p className="text-xs text-emerald-600 mt-1">Description: {createdDepartment.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5 flex items-start gap-3 animate-in fade-in">
            <XCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-rose-800">Error</h4>
              <p className="text-xs sm:text-sm text-rose-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {/* Department Name - Dropdown + Custom Input */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5" htmlFor="departmentName">
              Department Name <span className="text-rose-500">*</span>
            </label>

            {!showCustomInput ? (
              <div className="relative">
                <select
                  id="departmentName"
                  name="departmentName"
                  value={departmentName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full min-h-[44px] px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent transition-all appearance-none bg-white pr-10 ${
                    touched.name && formErrors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                  disabled={loading}
                  required
                >
                  <option value="">Select a department...</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  <option value="ADD_NEW" className="text-[#5f41b2] font-bold">
                    ➕ Add new...
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={customInputRef}
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      onKeyDown={handleCustomKeyDown}
                      placeholder="Enter new department name..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-[#5f41b2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-purple-50/30 pr-10"
                      disabled={loading}
                    />
                    <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5f41b2]" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomName}
                    className="min-h-[44px] px-4 py-2 bg-[#5f41b2] text-white text-sm font-bold rounded-xl hover:bg-[#4d3396] transition shadow-sm whitespace-nowrap"
                    disabled={loading}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCustom}
                    className="min-h-[44px] px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-300 transition"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Type the new department name and press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-bold">Enter</kbd> or click Add
                </p>
                {touched.name && formErrors.name && (
                  <p className="text-[11px] sm:text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.name}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5" htmlFor="description">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Brief description of this department's purpose"
              rows={3}
              className={`w-full p-3 sm:p-4 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent transition-all placeholder-slate-400 resize-none ${
                touched.description && formErrors.description ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300'
              }`}
              disabled={loading}
            />
            <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 mt-1">
              <span>Maximum 255 characters</span>
              <span>{description.length}/255</span>
            </div>
            {touched.description && formErrors.description && (
              <p className="text-[11px] sm:text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {formErrors.description}
              </p>
            )}
          </div>

          {/* Responsive Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
            <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preview</h4>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#5f41b2]/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#5f41b2]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-[#1b2559] truncate">
                  {departmentName || 'DEPARTMENT_NAME'}
                </p>
                {description && <p className="text-xs text-slate-600 truncate mt-0.5">{description}</p>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-start gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setDepartmentName('');
                setDescription('');
                dispatch(clearError());
                setSuccess(false);
                setFormErrors({});
                setTouched({ name: false, description: false });
                setShowCustomInput(false);
                setCustomName('');
                setOptions(baseOptions);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition text-center"
              disabled={loading}
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={loading || !departmentName.trim()}
              className="min-h-[44px] flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition shadow-sm cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Department...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Create Department</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDepartment;