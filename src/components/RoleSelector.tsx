import React, { useState } from "react";

interface RoleSelectorProps {
  roles: string[];
  onRolesChange: (selectedRoles: string[]) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  roles,
  onRolesChange,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      event.target.selectedOptions,
      (option) => option.value
    );
    setSelectedRoles(selectedOptions);
    onRolesChange(selectedOptions);
  };

  return (
    <div className="mb-3">
      <label className="form-label">Select Roles:</label>
      <select
        multiple
        className="form-select"
        onChange={handleChange}
        value={selectedRoles}
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RoleSelector;
