import { XIcon, TrashIcon, CalendarIcon, MailIcon } from "./Icons"

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
}

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function UserDetailsModal({ user, onClose, onDelete }: UserDetailsModalProps) {
  const handleDelete = () => {
    onDelete(user._id)
  }

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

  const roleStyle = getRoleColor(user.role)

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="modal-content">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>User Details</h2>
          <button style={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <XIcon />
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.userProfile}>
            <div style={styles.avatarLarge}>{user.name.charAt(0).toUpperCase()}</div>
            <div style={styles.userProfileInfo}>
              <h3 style={styles.userName}>{user.name}</h3>
              <div style={styles.userEmail}>
                <MailIcon />
                <span>{user.email}</span>
              </div>
              <div style={styles.userMeta}>
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
            </div>
          </div>

          <div style={styles.userDetails}>
            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>Activity</h4>
              <div style={styles.detailItem}>
                <CalendarIcon />
                <div style={styles.detailContent}>
                  <div style={styles.detailLabel}>Last Login</div>
                  <div style={styles.detailValue}>
                    {new Date(user.lastLogin).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>Access Information</h4>
              <div style={styles.accessInfo}>
                <div style={styles.accessItem}>
                  <div style={styles.accessLabel}>Role</div>
                  <div style={styles.accessValue}>{user.role}</div>
                </div>
                <div style={styles.accessItem}>
                  <div style={styles.accessLabel}>Account Created</div>
                  <div style={styles.accessValue}>
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.deleteButton} onClick={handleDelete} className="delete-user-button">
            <TrashIcon />
            <span>Delete User</span>
          </button>
          <button style={styles.closeModalButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style>{`
        .modal-content {
          animation: zoomIn 0.3s ease-out;
        }
        
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .delete-user-button {
          transition: all 0.2s ease;
        }
        
        .delete-user-button:hover {
          background-color: #fee2e2;
          color: #dc2626;
          border-color: #fecaca;
        }
      `}</style>
    </div>
  )
}

const styles = {
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
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "#1e293b",
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  modalBody: {
    padding: "24px",
  },
  userProfile: {
    display: "flex",
    gap: "20px",
    marginBottom: "24px",
  },
  avatarLarge: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    color: "#64748b",
    fontSize: "28px",
  },
  userProfileInfo: {
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
  },
  userName: {
    fontSize: "22px",
    fontWeight: 600,
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  userEmail: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "15px",
    color: "#64748b",
    marginBottom: "12px",
  },
  userMeta: {
    display: "flex",
    gap: "8px",
  },
  roleBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 500,
  },
  userDetails: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
  },
  detailSection: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "20px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: "16px",
  },
  detailItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    fontSize: "14px",
  },
  detailContent: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  detailLabel: {
    color: "#64748b",
    fontSize: "13px",
  },
  detailValue: {
    color: "#334155",
    fontWeight: 500,
  },
  accessInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  accessItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    padding: "8px 0",
    borderBottom: "1px solid #f8fafc",
  },
  accessLabel: {
    color: "#64748b",
  },
  accessValue: {
    color: "#334155",
    fontWeight: 500,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  closeModalButton: {
    padding: "8px 16px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
}

