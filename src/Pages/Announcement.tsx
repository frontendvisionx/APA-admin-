import { useState, useEffect } from "react"
import {  BellIcon, TrashIcon, CalendarIcon, InfoIcon, AlertIcon, CheckIcon, PlusIcon } from "../components/Icons"
import useAnnouncementStore from "../stores/useAnnouncementStore"
import AnnouncementForm from "../components/AnnouncementForm"

type AnnouncementType = 'information' | 'alert' | 'success' | 'warning' | 'error';
type AnnouncementCategory = 'AGM/SGM' | 'Prebid Meeting' | 'Corrigendum/Additions' | 'Comparision Of Bids' | 'Presentations of Developers' | 'Other';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  projectId: string;
  announcementType: AnnouncementType;
  category: AnnouncementCategory;
  createdAt: string;
  isPinned?: boolean;
  isScheduled?: boolean;
  scheduledDate?: string;
  documents?: string[];
}


const AnnouncementSkeleton = () => (
  <div style={styles.announcementCard} className="skeleton-card">
    <div style={styles.cardHeader}>
      <div style={styles.skeletonType} className="skeleton-animation" />
      <div style={styles.skeletonActions} className="skeleton-animation" />
    </div>
    <div style={styles.skeletonTitle} className="skeleton-animation" />
    <div style={styles.skeletonContent} className="skeleton-animation" />
    <div style={styles.skeletonFooter} className="skeleton-animation" />
  </div>
);

export default function AnnouncementsPage() {
  const [filter, setFilter] = useState<AnnouncementType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<AnnouncementCategory | 'all'>('all')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set())
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { announcements, isLoading, fetchAnnouncements, deleteAnnouncement } = useAnnouncementStore()

  useEffect(() => {
    const fetchData = async () => {
      // Always get projectId from localStorage to ensure we use the selected project
      const projectId = localStorage.getItem('projectId');
      if (!projectId) {
        // Wait for a short time and try again (in case project is still being loaded)
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryProjectId = localStorage.getItem('projectId');
        if (retryProjectId) {
          await fetchAnnouncements(retryProjectId);
        }
      } else {
        await fetchAnnouncements(projectId);
      }
    };

    fetchData();
  }, [fetchAnnouncements]);

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteAnnouncement(id)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Error deleting announcement:', error)
    }
  }

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesType = filter === 'all' || announcement.announcementType === filter;
    const matchesCategory = categoryFilter === 'all' || announcement.category === categoryFilter;
    return matchesType && matchesCategory;
  });

  // Sort announcements: pinned first, then by date
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getTypeIcon = (type: AnnouncementType | undefined) => {
    switch (type) {
      case 'information':
        return <InfoIcon />
      case 'alert':
      case 'warning':
      case 'error':
        return <AlertIcon />
      case 'success':
        return <CheckIcon />
      default:
        return <InfoIcon />
    }
  }

  const getTypeColor = (type: AnnouncementType | undefined) => {
    switch (type) {
      case 'information':
        return { bg: "rgba(59, 130, 246, 0.08)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" }
      case 'alert':
        return { bg: "rgba(225, 29, 72, 0.08)", text: "#e11d48", border: "rgba(225, 29, 72, 0.3)" }
      case 'success':
        return { bg: "rgba(16, 185, 129, 0.08)", text: "#10b981", border: "rgba(16, 185, 129, 0.3)" }
      case 'warning':
        return { bg: "rgba(249, 115, 22, 0.08)", text: "#f97316", border: "rgba(249, 115, 22, 0.3)" }
      case 'error':
        return { bg: "rgba(220, 38, 38, 0.08)", text: "#dc2626", border: "rgba(220, 38, 38, 0.3)" }
      default:
        return { bg: "rgba(107, 114, 128, 0.08)", text: "#6b7280", border: "rgba(107, 114, 128, 0.3)" }
    }
  }

  const toggleDocuments = (announcementId: string) => {
    setExpandedDocuments(prev => {
      const next = new Set(prev)
      if (next.has(announcementId)) {
        next.delete(announcementId)
      } else {
        next.add(announcementId)
      }
      return next
    })
  }

  const hasValidDocuments = (announcement: Announcement) => {
    return announcement.documents && announcement.documents.length > 0;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Announcements</h1>
          <p style={styles.subtitle}>Manage project announcements and updates</p>
        </div>
        <button
          style={styles.addButton}
          onClick={() => setIsFormOpen(true)}
          className="add-announcement-button"
        >
          <PlusIcon />
          <span>Add Announcement</span>
        </button>
      </div>

      <div style={styles.filterContainer}>
        <div style={styles.filterButtons}>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === "all" ? styles.activeFilter : {}),
            }}
            onClick={() => setFilter("all")}
            className="filter-button"
          >
            All
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === "information" ? { ...styles.activeFilter, backgroundColor: "rgba(59, 130, 246, 0.08)", color: "#3b82f6", borderColor: "rgba(59, 130, 246, 0.3)" } : {}),
            }}
            onClick={() => setFilter("information")}
            className="filter-button"
          >
            <InfoIcon />
            <span>Information</span>
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === "alert" ? { ...styles.activeFilter, backgroundColor: "rgba(225, 29, 72, 0.08)", color: "#e11d48", borderColor: "rgba(225, 29, 72, 0.3)" } : {}),
            }}
            onClick={() => setFilter("alert")}
            className="filter-button"
          >
            <AlertIcon />
            <span>Alert</span>
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === "success" ? { ...styles.activeFilter, backgroundColor: "rgba(16, 185, 129, 0.08)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" } : {}),
            }}
            onClick={() => setFilter("success")}
            className="filter-button"
          >
            <CheckIcon />
            <span>Success</span>
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === "warning" ? { ...styles.activeFilter, backgroundColor: "rgba(249, 115, 22, 0.08)", color: "#f97316", borderColor: "rgba(249, 115, 22, 0.3)" } : {}),
            }}
            onClick={() => setFilter("warning")}
            className="filter-button"
          >
            <AlertIcon />
            <span>Warning</span>
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === "error" ? { ...styles.activeFilter, backgroundColor: "rgba(220, 38, 38, 0.08)", color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.3)" } : {}),
            }}
            onClick={() => setFilter("error")}
            className="filter-button"
          >
            <AlertIcon />
            <span>Error</span>
          </button>
        </div>
        
        <div style={styles.categoryFilter}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as AnnouncementCategory | 'all')}
            style={styles.categorySelect}
          >
            <option value="all">All Categories</option>
            <option value="AGM/SGM">AGM/SGM</option>
            <option value="Prebid Meeting">Prebid Meeting</option>
            <option value="Corrigendum/Additions">Corrigendum/Additions</option>
            <option value="Comparision Of Bids">Comparision Of Bids</option>
            <option value="Presentations of Developers">Presentations of Developers</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={styles.announcementsList}>
          {[1, 2, 3].map((i) => (
            <AnnouncementSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div style={styles.announcementsList}>
          {sortedAnnouncements.length === 0 ? (
            <div style={styles.emptyState}>
              <BellIcon />
              <h3>No announcements found</h3>
              <p>Create your first announcement to keep everyone updated</p>
            </div>
          ) : (
            sortedAnnouncements.map((announcement, index) => {
              const typeStyle = getTypeColor(announcement.announcementType)
              const hasDocuments = hasValidDocuments(announcement)
              const isExpanded = expandedDocuments.has(announcement._id)

              return (
                <div
                  key={announcement._id}
                  style={styles.announcementCard}
                  className={`announcement-card ${announcement.isPinned ? "pinned" : ""}`}
                  data-index={index}
                >
                  {announcement.isPinned && (
                    <div style={styles.pinnedBadge} className="pinned-badge">
                      <span>📌 Pinned</span>
                    </div>
                  )}
                  <div style={styles.cardHeader}>
                    <div style={styles.cardHeaderLeft}>
                      <div
                        style={{
                          ...styles.typeIndicator,
                          backgroundColor: typeStyle.bg,
                          color: typeStyle.text,
                          borderColor: typeStyle.border,
                        }}
                      >
                        {getTypeIcon(announcement.announcementType)}
                        <span>{announcement.announcementType?.charAt(0).toUpperCase() + announcement.announcementType?.slice(1) || 'Information'}</span>
                      </div>
                      <div style={styles.categoryBadge}>
                        {announcement.category}
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button
                        style={styles.actionButton}
                        onClick={() => setDeleteConfirmId(announcement._id)}
                        title="Delete"
                        className="delete-button"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <h3 style={styles.announcementTitle}>{announcement.title}</h3>
                  {announcement.content && (
                        <div className="notification-content">
                          <p>{announcement.content}</p>
                        </div>   )}
                  <div style={styles.announcementFooter}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "6px 12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <CalendarIcon />
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px"
                      }}>
                        <span style={{
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: 500
                        }}>Created on</span>
                        <span style={{
                          fontSize: "14px",
                          color: "#0f172a",
                          fontWeight: 600
                        }}>
                          {new Date(announcement.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    {hasDocuments && (
                      <button
                        onClick={() => toggleDocuments(announcement._id)}
                        style={styles.documentToggle}
                        className="document-toggle"
                      >
                        {isExpanded ? "Hide Documents" : `Show Documents (${announcement.documents?.length})`}
                      </button>
                    )}
                  </div>
                  
                  {isExpanded && hasDocuments && (
                    <div style={styles.documentsContainer}>
                      <div style={styles.documentsList}>
                        {announcement.documents?.map((url, index) => (
                          <div key={index} style={styles.documentItem}>
                            <div style={styles.documentIcon}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                            </div>
                            <div style={styles.documentInfo}>
                              <span style={styles.documentName}>Document {index + 1}</span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.downloadLink}
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {deleteConfirmId && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirmId(null)} className="modal-overlay">
          <div style={styles.deleteConfirmModal} onClick={e => e.stopPropagation()} className="delete-confirm-modal">
            <h3 style={styles.deleteConfirmTitle}>Delete Announcement</h3>
            <p style={styles.deleteConfirmText}>Are you sure you want to delete this announcement? This action cannot be undone.</p>
            <div style={styles.deleteConfirmActions}>
              <button
                style={styles.cancelDeleteButton}
                onClick={() => setDeleteConfirmId(null)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                style={styles.confirmDeleteButton}
                onClick={() => handleDeleteAnnouncement(deleteConfirmId)}
                className="confirm-delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <AnnouncementForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      <style>{`
        .add-announcement-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-announcement-button:hover {
          background-color: #1d4ed8;
          transform: translateY(-1px);
        }

        .add-announcement-button:active {
          transform: translateY(0);
        }
        
        .filter-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          z-index: 1;
        }
        
        .filter-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: currentColor;
          opacity: 0;
          transform: translateY(100%);
          transition: all 0.3s ease;
          z-index: -1;
        }
        
        .filter-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .filter-button:hover::before {
          opacity: 0.03;
          transform: translateY(0);
        }
        
        .announcement-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform: translateY(0);
          position: relative;
          overflow: hidden;
          animation-fill-mode: both;
          opacity: 0;
          animation: fadeInUp 0.5s forwards;
          animation-delay: calc(var(--index) * 0.05s);
        }
        
        .announcement-card[data-index="0"] { --index: 0; }
        .announcement-card[data-index="1"] { --index: 1; }
        .announcement-card[data-index="2"] { --index: 2; }
        .announcement-card[data-index="3"] { --index: 3; }
        .announcement-card[data-index="4"] { --index: 4; }
        .announcement-card[data-index="5"] { --index: 5; }
        .announcement-card[data-index="6"] { --index: 6; }
        .announcement-card[data-index="7"] { --index: 7; }
        .announcement-card[data-index="8"] { --index: 8; }
        .announcement-card[data-index="9"] { --index: 9; }
        
        .announcement-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
        }
        
        .announcement-card.pinned {
          border-left: 4px solid #3b82f6;
          position: relative;
          overflow: visible;
        }
        
        .pinned-badge {
          position: absolute;
          top: 0;
          right: 0;
          transform: translateX(30%) translateY(-50%) rotate(45deg);
          width: 120px;
          text-align: center;
          background-color: #3b82f6;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 0;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
          z-index: 1;
        }
        
        .pin-button, .edit-button, .delete-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .pin-button::after, .edit-button::after, .delete-button::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background-color: currentColor;
          border-radius: 50%;
          opacity: 0;
          transform: translate(-50%, -50%);
          transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
        }
        
        .pin-button:hover::after, .edit-button:hover::after, .delete-button:hover::after {
          width: 200%;
          height: 200%;
          opacity: 0.1;
        }
        
        .pin-button {
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .pin-button:hover {
          color: #3b82f6;
          transform: scale(1.1);
        }
        
        .pin-button.pinned {
          color: #3b82f6;
        }
        
        .pin-button.pinned:hover {
          color: #1d4ed8;
        }
        
        .edit-button {
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .edit-button:hover {
          color: #0ea5e9;
          transform: scale(1.1);
        }
        
        .delete-button {
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .delete-button:hover {
          color: #ef4444;
          transform: scale(1.1);
        }
        
        .loading-spinner {
          border: 3px solid rgba(59, 130, 246, 0.1);
          border-radius: 50%;
          border-top: 3px solid #3b82f6;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
          filter: drop-shadow(0 4px 6px rgba(59, 130, 246, 0.2));
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .modal-overlay {
          animation: fadeIn 0.3s ease-out;
          backdrop-filter: blur(4px);
        }
        
        .delete-confirm-modal {
          animation: zoomIn 0.3s ease-out;
          transform-origin: center;
        }
        
        .cancel-button {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .cancel-button:hover {
          background-color: #f8fafc;
          transform: translateY(-2px);
        }
        
        .confirm-delete-button {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .confirm-delete-button:hover {
          background-color: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
        
        .empty-state-icon {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }

        .skeleton-animation {
          animation: shimmer 1.5s infinite linear;
          background: linear-gradient(
            90deg,
            #e2e8f0 0%,
            #f1f5f9 50%,
            #e2e8f0 100%
          );
          background-size: 200% 100%;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .documentToggle: {
          background: "none",
          border: "none",
          color: "#3b82f6",
          fontSize: "14px",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "4px",
          transition: "all 0.2s ease",
        },
        .documentsContainer: {
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: "1px solid #e2e8f0",
        },
        .documentsList: {
          display: "flex",
          flexDirection: "column" as const,
          gap: "12px",
        },
        .documentItem: {
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        },
        .documentIcon: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          backgroundColor: "#eff6ff",
          borderRadius: "8px",
          color: "#3b82f6",
        },
        .documentInfo: {
          display: "flex",
          flexDirection: "column" as const,
          gap: "4px",
        },
        .documentName: {
          fontSize: "14px",
          fontWeight: 500,
          color: "#334155",
        },
        .downloadLink: {
          fontSize: "13px",
          color: "#3b82f6",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        },
        .addButton: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        },
        .categoryFilter: {
          marginTop: '16px',
          marginBottom: '24px',
        },
        .categorySelect: {
          padding: '8px 16px',
          fontSize: '14px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          backgroundColor: 'white',
          color: '#475569',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease',
          width: '100%',
          maxWidth: '300px',
        },
        .cardHeaderLeft: {
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        },
        .categoryBadge: {
          padding: '4px 12px',
          backgroundColor: '#f1f5f9',
          color: '#475569',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 500,
        },
        .announcementDescription: {
          fontSize: "15px",
          color: "#475569",
          lineHeight: 1.6,
          margin: "0 0 20px 0",
          whiteSpace: "pre-wrap",
        },
        .dateContainer: {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 12px",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        },
        .dateInfo: {
          display: "flex",
          flexDirection: "column" as const,
          gap: "2px",
        },
        .dateLabel: {
          fontSize: "12px",
          color: "#64748b",
          fontWeight: 500,
        },
        .dateValue: {
          fontSize: "14px",
          color: "#0f172a",
          fontWeight: 600,
        },
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    position: "relative" as const,
    minHeight: "100%",
    padding: "24px",
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap" as const,
    gap: "16px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 8px 0",
    letterSpacing: "-0.025em",
    position: "relative" as const,
  },
  subtitle: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
    maxWidth: "500px",
  },
  filterContainer: {
    marginBottom: "28px",
  },
  filterButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
  },
  filterButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontWeight: 500,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.03)",
  },
  activeFilter: {
    borderColor: "transparent",
    color: "#0f172a",
    fontWeight: 600,
  },
  announcementsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
    marginBottom: "40px",
  },
  announcementCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    border: "1px solid rgba(0, 0, 0, 0.03)",
    transition: "all 0.3s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  typeIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 14px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid transparent",
  },
  cardActions: {
    display: "flex",
    gap: "10px",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#f8fafc",
    cursor: "pointer",
  },
  announcementTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 14px 0",
    lineHeight: 1.3,
  },
  announcementContent: {
    fontSize: "16px",
    color: "#475569",
    lineHeight: 1.6,
    margin: "0 0 20px 0",
  },
  announcementFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "18px",
  },
  dateContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  pinnedBadge: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    transform: "translateX(30%) translateY(-50%) rotate(45deg)",
    width: "120px",
    textAlign: "center" as const,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "60px 20px",
    textAlign: "center" as const,
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
    color: "#64748b",
  },
  loadingSpinner: {
    border: "3px solid rgba(59, 130, 246, 0.1)",
    borderRadius: "50%",
    borderTop: "3px solid #3b82f6",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  deleteConfirmModal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '28px',
    width: '90%',
    maxWidth: '420px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  deleteConfirmTitle: {
    margin: '0 0 14px 0',
    fontSize: '22px',
    fontWeight: 700,
    color: '#1e293b',
  },
  deleteConfirmText: {
    margin: '0 0 24px 0',
    fontSize: '16px',
    color: '#475569',
    lineHeight: 1.6,
  },
  deleteConfirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
  },
  cancelDeleteButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
  },
  confirmDeleteButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
  },
  skeletonType: {
    width: "100px",
    height: "24px",
    borderRadius: "20px",
    backgroundColor: "#e2e8f0",
  },
  skeletonActions: {
    width: "80px",
    height: "24px",
    borderRadius: "20px",
    backgroundColor: "#e2e8f0",
  },
  skeletonTitle: {
    width: "60%",
    height: "24px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
    marginBottom: "16px",
  },
  skeletonContent: {
    width: "100%",
    height: "60px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
    marginBottom: "16px",
  },
  skeletonFooter: {
    width: "30%",
    height: "20px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
  },
  documentToggle: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "all 0.2s ease",
  },
  documentsContainer: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  documentsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  documentItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  documentIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    backgroundColor: "#eff6ff",
    borderRadius: "8px",
    color: "#3b82f6",
  },
  documentInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  documentName: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#334155",
  },
  downloadLink: {
    fontSize: "13px",
    color: "#3b82f6",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  categoryFilter: {
    marginTop: '16px',
    marginBottom: '24px',
  },
  categorySelect: {
    padding: '8px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#475569',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: '100%',
    maxWidth: '300px',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  categoryBadge: {
    padding: '4px 12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
  },
  announcementDescription: {
    fontSize: "15px",
    color: "#475569",
    lineHeight: 1.6,
    margin: "0 0 20px 0",
    whiteSpace: "pre-wrap",
  },
}

