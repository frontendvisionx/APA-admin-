import { useState, useEffect, useRef } from "react"
import { UsersIcon, TrashIcon, SearchIcon, CloseIcon, FilterIcon } from "../components/Icons"
import UserDetailsModal from "../components/UserDetailsModal"
import useUserStore from "../stores/useUserStore"

interface Project {
  _id: string;
  name: string;
  description: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  isApproved: boolean;
  projects?: Project[];
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [approvalMessage, setApprovalMessage] = useState("")
  const [showMessage, setShowMessage] = useState(false)

  const { users, isLoading, error, totalPages, fetchUsers, deleteUser } = useUserStore()

  useEffect(() => {
    const loadUsers = async () => {
      // Always get projectId from localStorage to ensure we use the selected project
      const projectId = localStorage.getItem('projectId');
      if (!projectId) {
        // Wait for a short time and try again (in case project is still being loaded)
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryProjectId = localStorage.getItem('projectId');
        if (retryProjectId) {
          await fetchUsers(1);
        }
      } else {
        await fetchUsers(1);
      }
    };
    loadUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const projectId = localStorage.getItem('projectId');
    if (projectId) {
      fetchUsers(currentPage);
    }
  }, [currentPage, fetchUsers]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete._id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      
      // Close details modal if the deleted user was being viewed
      if (selectedUser && selectedUser._id === userToDelete._id) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user. Please try again.");
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
  }

  const handleCloseUserDetails = () => {
    setSelectedUser(null)
  }

  const handleSearchFocus = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Filter users based on search term and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = selectedRole === "all" || user.role === selectedRole

    return matchesSearch && matchesRole
  })

  // Sort users by last login date (most recent first)
  const sortedUsers = [...filteredUsers].sort(
    (a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime(),
  )

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return { bg: "#eef2ff", text: "#3b82f6" }
      case "user":
        return { bg: "#f0fdf4", text: "#16a34a" }
      default:
        return { bg: "#f8fafc", text: "#64748b" }
    }
  }

  // Add handleApproveUser function
  const handleApproveUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const response = await fetch(`${baseUrl}/api/users/approve/${userId}`, {
        method: 'put',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to approve user')
      }

      // Refresh the users list to get updated approval status
      await fetchUsers(currentPage)
      
      setApprovalMessage("User approved successfully")
      setShowMessage(true)

      // Hide message after 3 seconds
      setTimeout(() => {
        setShowMessage(false)
        setApprovalMessage("")
      }, 3000)

    } catch (error) {
      console.error('Failed to approve user:', error)
      setApprovalMessage("Failed to approve user")
      setShowMessage(true)
      setTimeout(() => {
        setShowMessage(false)
        setApprovalMessage("")
      }, 3000)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Users</h1>
          <p style={styles.subtitle}>Manage building users and access</p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          Error: {error}
        </div>
      )}

      {showMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          backgroundColor: approvalMessage.includes('success') ? '#10b981' : '#ef4444',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out',
        }}>
          {approvalMessage}
        </div>
      )}

      <div style={styles.searchAndFilterContainer}>
        <div style={styles.searchContainer} onClick={handleSearchFocus}>
          <SearchIcon />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button style={styles.clearSearchButton} onClick={() => setSearchTerm("")} aria-label="Clear search">
              <CloseIcon />
            </button>
          )}
        </div>

        <div style={styles.filterContainer}>
          <div style={styles.filterLabel}>
            <FilterIcon />
            <span>Role:</span>
          </div>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={styles.filterSelect}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="developer">Developer</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div style={styles.usersContainer}>
          {sortedUsers.length === 0 ? (
            <div style={styles.emptyState}>
              <UsersIcon />
              <h3>No users found</h3>
              <p>
                {searchTerm || selectedRole !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No users are currently in the system"}
              </p>
              {(searchTerm || selectedRole !== "all") && (
                <button
                  style={styles.resetFiltersButton}
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedRole("all")
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={styles.usersTable}>
                <div style={styles.tableHeader}>
                  <div style={styles.tableHeaderCell} className="user-col">
                    User
                  </div>
                  <div style={styles.tableHeaderCell} className="role-col">
                    Role
                  </div>
                  <div style={styles.tableHeaderCell} className="last-login-col">
                    Last Login
                  </div>
                  <div style={styles.tableHeaderCell} className="actions-col">
                    Actions
                  </div>
                </div>
                <div style={styles.tableBody}>
                  {sortedUsers.map((user) => {
                    const roleStyle = getRoleColor(user.role)

                    return (
                      <div key={user._id} style={styles.tableRow} className="user-row">
                        <div style={styles.tableCell} className="user-col">
                          <div style={styles.userInfo} onClick={() => handleViewUser(user)}>
                            <div style={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
                            <div style={styles.userDetails}>
                              <div style={styles.userName}>{user.name}</div>
                              <div style={styles.userEmail}>{user.email}</div>
                            </div>
                          </div>
                        </div>
                        <div style={styles.tableCell} className="role-col">
                          <span
                            style={{
                              ...styles.roleBadge,
                              backgroundColor: roleStyle.bg,
                              color: roleStyle.text,
                            }}
                          >
                            {user.role}
                          </span>
                        </div>
                        <div style={styles.tableCell} className="last-login-col">
                          {new Date(user.lastLogin).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div style={styles.tableCell} className="actions-col">
                          <div style={styles.actionButtons}>
                            {!user.isApproved && (
                              <button
                                style={styles.approveButton}
                                onClick={() => handleApproveUser(user._id)}
                                title="Approve User"
                                className="approve-button"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              style={styles.actionButton}
                              onClick={() => handleDeleteClick(user)}
                              title="Delete User"
                              className="delete-button"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    style={{
                      ...styles.paginationButton,
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span style={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    style={{
                      ...styles.paginationButton,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={handleCloseUserDetails} 
          onDelete={() => handleDeleteClick(selectedUser)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div style={styles.modalOverlay} onClick={handleCancelDelete}>
          <div style={styles.deleteModalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.deleteModalHeader}>
              <h2 style={styles.deleteModalTitle}>Confirm Delete</h2>
              <button style={styles.closeButton} onClick={handleCancelDelete}>
                <CloseIcon />
              </button>
            </div>
            <div style={styles.deleteModalBody}>
              <p style={styles.deleteModalText}>
                Are you sure you want to delete the user <strong>{userToDelete.name}</strong>?
                <br />
                This action cannot be undone.
              </p>
              <div style={styles.deleteModalActions}>
                <button style={styles.cancelButton} onClick={handleCancelDelete}>
                  Cancel
                </button>
                <button style={styles.deleteButton} onClick={handleConfirmDelete}>
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .loading-spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 3px solid #3b82f6;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .user-row {
          animation: fadeIn 0.5s ease-out;
          animation-fill-mode: both;
          transition: all 0.2s ease;
        }
        
        .user-row:hover {
          background-color: #f8fafc;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .user-row:nth-child(1) { animation-delay: 0.1s; }
        .user-row:nth-child(2) { animation-delay: 0.15s; }
        .user-row:nth-child(3) { animation-delay: 0.2s; }
        .user-row:nth-child(4) { animation-delay: 0.25s; }
        .user-row:nth-child(5) { animation-delay: 0.3s; }
        
        .delete-button {
          opacity: 0.7;
          transition: all 0.2s ease;
        }
        
        .delete-button:hover {
          opacity: 1;
          color: #ef4444;
        }
        
        @media (max-width: 768px) {
          .role-col, .last-login-col {
            display: none;
          }
          
          .user-col {
            flex: 1;
          }
          
          .actions-col {
            width: 60px;
          }
        }

        .delete-modal-content {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translate(-50%, -40%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }

        .approve-button {
          opacity: 0.9;
          transition: all 0.2s ease;
        }
        
        .approve-button:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    position: "relative" as const,
    minHeight: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap" as const,
    gap: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
  },
  searchAndFilterContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap" as const,
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    flex: "1 1 300px",
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "0 12px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
  },
  searchInput: {
    flex: 1,
    border: "none",
    padding: "12px 8px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "transparent",
  },
  clearSearchButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
  },
  filterContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "0 12px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
  },
  filterLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#64748b",
    fontSize: "14px",
  },
  filterSelect: {
    border: "none",
    padding: "12px 8px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "transparent",
    color: "#0f172a",
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0px center",
    backgroundSize: "16px",
    paddingRight: "20px",
  },
  usersContainer: {
    marginBottom: "40px",
  },
  usersTable: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  tableHeader: {
    display: "flex",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    padding: "12px 20px",
    fontWeight: 600,
    color: "#475569",
    fontSize: "14px",
  },
  tableHeaderCell: {
    flex: 1,
  },
  tableBody: {
    display: "flex",
    flexDirection: "column" as const,
  },
  tableRow: {
    display: "flex",
    borderBottom: "1px solid #f1f5f9",
    padding: "16px 20px",
    alignItems: "center",
    cursor: "pointer",
  },
  tableCell: {
    flex: 1,
    fontSize: "14px",
    color: "#334155",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    color: "#64748b",
    fontSize: "16px",
  },
  userDetails: {
    display: "flex",
    flexDirection: "column" as const,
  },
  userName: {
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: "2px",
  },
  userEmail: {
    fontSize: "13px",
    color: "#64748b",
  },
  roleBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 500,
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },
  actionButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    borderRadius: "4px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center" as const,
    color: "#64748b",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  resetFiltersButton: {
    marginTop: "16px",
    padding: "8px 16px",
    backgroundColor: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
    color: "#64748b",
  },
  loadingSpinner: {
    border: "3px solid rgba(0, 0, 0, 0.1)",
    borderRadius: "50%",
    borderTop: "3px solid #3b82f6",
    width: "30px",
    height: "30px",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "24px",
  },
  paginationButton: {
    padding: "8px 16px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  pageInfo: {
    fontSize: "14px",
    color: "#64748b",
  },
  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  deleteModalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    animation: "slideIn 0.3s ease-out",
  },
  deleteModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  deleteModalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "#1e293b",
  },
  deleteModalBody: {
    padding: "24px",
  },
  deleteModalText: {
    fontSize: "15px",
    color: "#475569",
    marginBottom: "24px",
    lineHeight: 1.5,
  },
  deleteModalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "8px 16px",
    backgroundColor: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  deleteButton: {
    padding: "8px 16px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
  },
  approveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
}

