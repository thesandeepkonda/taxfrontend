// src/features/admin/CreateEmployee.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreateEmployeeModal from './resueables/CreateEmployeeModal';

const CreateEmployee: React.FC = () => {
  const navigate = useNavigate();
  return (
    <CreateEmployeeModal
      isOpen={true}
      onClose={() => navigate(-1)}
    />
  );
};

export default CreateEmployee;