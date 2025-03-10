import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import { Select, SelectOption } from "./Select";

const options = [
  { label: "ROLE_USER", value: 1 },
  { label: "ROLE_DESIGNER", value: 2 },
  { label: "ROLE_PORTOFOLIO_MANAGER", value: 3 },
  { label: "ROLE_SELLER", value: 4 },
  { label: "ROLE_ADMIN", value: 5 },
];

interface UserListProps {
  refresh: boolean;
  onRoleChange: () => void;
}

interface Role {
  id: number;
  name: string;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  roles: Role[];
}

const UserList: React.FC<UserListProps> = ({ refresh, onRoleChange }) => {
  const [selectedRolesMap, setSelectedRolesMap] = useState<
    Record<number, SelectOption[]>
  >({});
  const [visibilityMap, setVisibilityMap] = useState<Record<number, boolean>>(
    {}
  );

  const [isVisible, setIsVisible] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { accessToken } = useAuth();
  const { user } = useAuth();

  const handleDelete = (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    axios
      .delete(`http://localhost:8080/api/users/delete/${userId}`, {
        headers: accessToken ? { Authorization: "Bearer " + accessToken } : {},
      })
      .then(() => {
        setUsers(users.filter((user) => user.id !== userId));
        onRoleChange();
      })
      .catch((err) => {
        setError(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
      });
  };

  const toggleVisibility = (userId: number) => {
    setVisibilityMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleRoleSelectionChange = (
    options: SelectOption[],
    userId: number
  ) => {
    setSelectedRolesMap((prev) => ({
      ...prev,
      [userId]: options,
    }));
  };

  const handleSaveRoles = (userId: number) => {
    const selectedOptions = selectedRolesMap[userId] || [];
    const roleLabels = selectedOptions.map((option) => option.label);

    handleRolesChange(roleLabels, userId);
    console.log(roleLabels);
  };

  const handleRolesChange = (selectedRoles: string[], userId: number) => {
    axios
      .put(
        `http://localhost:8080/api/users/update-role/${userId}`,
        selectedRoles,
        {
          headers: accessToken
            ? { Authorization: "Bearer " + accessToken }
            : {},
        }
      )
      .then(() => {
        onRoleChange();
      })
      .catch((err) => {
        setError(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
      });
  };

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/users/get-all", {
        headers: accessToken ? { Authorization: "Bearer " + accessToken } : {},
      })
      .then((response) => {
        console.log(response.data);
        setUsers(response.data);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setError(
          err.response ? JSON.stringify(err.response.data) : err.message
        );
      });
  }, [accessToken, refresh]);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const [value, setValue] = useState<SelectOption[]>([options[0]]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">User Management</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {users.length === 0 ? (
        <p className="text-center">No users found.</p>
      ) : (
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {users.map((user) => (
            <div key={user.id} className="col">
              <div className="card h-100 shadow-sm border rounded">
                <div className="card-body">
                  <h5 className="card-title fw-bold">{user.username}</h5>
                  <p className="text-muted">{user.email}</p>
                  <div className="mb-2">
                    {user.roles.map((role) => (
                      <span key={role.id} className="badge bg-secondary me-1">
                        {role.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card-footer bg-white border-0 d-flex flex-column gap-2">
                  <button
                    className={`btn ${
                      visibilityMap[user.id] ? "btn-secondary" : "btn-primary"
                    } btn-sm`}
                    onClick={() =>
                      setVisibilityMap((prev) => ({
                        ...prev,
                        [user.id]: !prev[user.id],
                      }))
                    }
                  >
                    {visibilityMap[user.id]
                      ? "Hide Role Selection"
                      : "Assign Roles"}
                  </button>

                  {visibilityMap[user.id] && (
                    <div className="mt-2">
                      <Select
                        multiple
                        options={options}
                        value={
                          selectedRolesMap[user.id] ??
                          user.roles.map(
                            (role) =>
                              options.find((opt) => opt.label === role.name)!
                          )
                        }
                        onChange={(o) => handleRoleSelectionChange(o, user.id)}
                      />
                      <button
                        className="btn btn-success btn-sm mt-2 w-100"
                        onClick={() => handleSaveRoles(user.id)}
                      >
                        Save Roles
                      </button>
                    </div>
                  )}

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;
