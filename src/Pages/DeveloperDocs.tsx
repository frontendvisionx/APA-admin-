import { useState, useEffect } from "react"
import {
  DocumentIcon,
  SearchIcon,
  FilterIcon,
  CloseIcon,
  CheckIcon,
  PDFIcon,
  ImageIcon,
  ExcelIcon,
  WordIcon,
  FileIcon,
  DownloadIcon,
  EyeIcon,
  AlertIcon,
} from "../components/Icons"
import useDeveloperDocsStore from "../stores/useDeveloperDocsStore"

const DocumentSkeleton = () => (
  <div style={styles.documentCard} className="document-card">
    <div style={styles.documentHeader}>
      <div style={styles.skeletonIcon} className="skeleton-animation" />
      <div style={styles.documentInfo}>
        <div style={styles.skeletonTitle} className="skeleton-animation" />
        <div style={styles.skeletonDescription} className="skeleton-animation" />
        <div style={styles.skeletonMeta} className="skeleton-animation" />
      </div>
    </div>
    <div style={styles.documentDeveloper}>
      <div style={styles.skeletonAvatar} className="skeleton-animation" />
      <div style={styles.developerInfo}>
        <div style={styles.skeletonName} className="skeleton-animation" />
        <div style={styles.skeletonEmail} className="skeleton-animation" />
      </div>
    </div>
    <div style={styles.documentFooter}>
      <div style={styles.skeletonStatus} className="skeleton-animation" />
      <div style={styles.documentActions}>
        <div style={styles.skeletonButton} className="skeleton-animation" />
        <div style={styles.skeletonButton} className="skeleton-animation" />
      </div>
    </div>
  </div>
);

export default function DeveloperDocumentsPage() {
  const { documents, isLoading, error, fetchDocuments } = useDeveloperDocsStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedFileType, setSelectedFileType] = useState("all")
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const [approvalComment, setApprovalComment] = useState("")
  const [sortOrder] = useState<"newest" | "oldest">("newest")

  useEffect(() => {
    const projectId = localStorage.getItem('projectId')
    if (projectId) {
      fetchDocuments(projectId)
    }
  }, [fetchDocuments])

  const handleApproveDocument = async (documentId: string) => {
    try {
      const projectId = localStorage.getItem('projectId')
      if (!projectId) {
        throw new Error('Project ID not found')
      }

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL
      if (!baseUrl) {
        throw new Error('API URL not configured')
      }

      const response = await fetch(
        `${baseUrl}/api/document/${projectId}/approve/${documentId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'published' }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to approve document')
      }

      // Show success message
      alert('Document has been published successfully')
      
      // Close the modal
      handleClosePreview()
      
      // Refresh the documents list
      fetchDocuments(projectId)
    } catch (error) {
      console.error('Approve error:', error)
      alert(error instanceof Error ? error.message : 'Failed to approve document')
    }
  }

  const handleRejectDocument = async (documentId: string) => {
    if (!approvalComment) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      const projectId = localStorage.getItem('projectId')
      if (!projectId) {
        throw new Error('Project ID not found')
      }

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL
      if (!baseUrl) {
        throw new Error('API URL not configured')
      }

      const response = await fetch(
        `${baseUrl}/api/document/${projectId}/approve/${documentId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: 'rejected',
            notes: approvalComment 
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reject document')
      }

      // Show success message
      alert('Document has been rejected')
      
      // Close the modal
      handleClosePreview()
      
      // Refresh the documents list
      fetchDocuments(projectId)
    } catch (error) {
      console.error('Reject error:', error)
      alert(error instanceof Error ? error.message : 'Failed to reject document')
    }
  }

  const handlePreviewDocument = (document: any) => {
    setPreviewDocument(document)
    setApprovalComment(document.comments || "")
  }

  const handleClosePreview = () => {
    setPreviewDocument(null)
    setApprovalComment("")
  }

  const handleDownload = (document: any) => {
    const fileUrl = document.filePath[0]?.url;
    if (fileUrl) {
      // Open the document in a new tab
      window.open(fileUrl, '_blank');
    } else {
      alert('No file URL available for download');
    }
  };

  // Filter documents based on search term, status, and file type
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus
    const matchesFileType = selectedFileType === "all" || getFileTypeFromUrl(doc.filePath[0]?.url) === selectedFileType

    return matchesSearch && matchesStatus && matchesFileType
  })

  // Sort documents: pending first, then by date
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    // First sort by status (pending first)
    if (a.status === "pending" && b.status !== "pending") return -1
    if (a.status !== "pending" && b.status === "pending") return 1

    // Then sort by date
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()

    return sortOrder === "newest" ? dateB - dateA : dateA - dateB
  })

  const getFileTypeFromUrl = (url: string) => {
    if (!url) return ''
    const extension = url.split('.').pop()?.toLowerCase() || ''
    return extension
  }

  const getFileIcon = (url: string) => {
    const fileType = getFileTypeFromUrl(url)
    switch (fileType) {
      case "pdf":
        return <PDFIcon />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon />
      case "xlsx":
      case "xls":
      case "csv":
        return <ExcelIcon />
      case "docx":
      case "doc":
        return <WordIcon />
      default:
        return <FileIcon />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "#fff7ed", text: "#f97316", label: "Pending Review" }
      case "published":
        return { bg: "#ecfdf5", text: "#10b981", label: "Published" }
      case "rejected":
        return { bg: "#fef2f2", text: "#ef4444", label: "Rejected" }
      default:
        return { bg: "#f3f4f6", text: "#6b7280", label: "Unknown" }
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Developer Documents</h1>
          <p style={styles.subtitle}>Review and approve documents submitted by developers</p>
        </div>
      </div>

      <div style={styles.searchAndFilterContainer}>
        <div style={styles.searchContainer}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search documents..."
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
            <span>Status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* <div style={styles.filterContainer}>
          <div style={styles.filterLabel}>
            <FilterIcon />
            <span>File Type:</span>
          </div>
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Types</option>
            {fileTypes.map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterContainer}>
          <div style={styles.filterLabel}>
            <FilterIcon />
            <span>Sort:</span>
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            style={styles.filterSelect}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div> */}
      </div>

      {isLoading ? (
        <div style={styles.documentsContainer}>
          {[1, 2, 3].map((i) => (
            <DocumentSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <AlertIcon />
          <p>{error}</p>
        </div>
      ) : (
        <div style={styles.documentsContainer}>
          {sortedDocuments.length === 0 ? (
            <div style={styles.emptyState}>
              <DocumentIcon />
              <h3>No documents found</h3>
              <p>
                {searchTerm || selectedStatus !== "all" || selectedFileType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No documents have been submitted by developers yet"}
              </p>
              {(searchTerm || selectedStatus !== "all" || selectedFileType !== "all") && (
                <button
                  style={styles.resetFiltersButton}
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedStatus("all")
                    setSelectedFileType("all")
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div style={styles.documentsList}>
              {sortedDocuments.map((document) => {
                const statusBadge = getStatusBadge(document.status)
                const fileUrl = document.filePath[0]?.url

                return (
                  <div key={document._id} style={styles.documentCard} className="document-card">
                    <div style={styles.documentHeader}>
                      <div style={styles.documentIconContainer}>
                        {getFileIcon(fileUrl)}
                      </div>
                      <div style={styles.documentInfo}>
                        <h3 style={styles.documentName}>{document.title}</h3>
                        <p style={styles.documentDescription}>{document.description}</p>
                        <div style={styles.documentMeta}>
                          <span style={styles.documentDate}>
                            Uploaded on{" "}
                            {new Date(document.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.documentDeveloper}>
                      <div style={styles.developerAvatar}>
                        {document.uploadedBy.name.charAt(0)}
                      </div>
                      <div style={styles.developerInfo}>
                        <div style={styles.developerName}>{document.uploadedBy.name}</div>
                        <div style={styles.developerCompany}>{document.uploadedBy.email}</div>
                      </div>
                    </div>

                    <div style={styles.documentFooter}>
                      <div
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.text,
                        }}
                      >
                        {statusBadge.label}
                      </div>

                      <div style={styles.documentActions}>
                        <button
                          style={styles.viewButton}
                          onClick={() => handlePreviewDocument(document)}
                          title="View Document"
                        >
                          <EyeIcon />
                          <span>View</span>
                        </button>

                        {document.status === "pending" && (
                          <button
                            style={styles.approveButton}
                            onClick={() => handlePreviewDocument(document)}
                            title="Review Document"
                          >
                            <CheckIcon />
                            <span>Review</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {document.notes && document.status !== "pending" && (
                      <div style={styles.commentsSection}>
                        <p style={styles.commentsLabel}>Notes:</p>
                        <p style={styles.commentsText}>{document.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <div style={styles.modalOverlay} onClick={handleClosePreview}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="modal-content">
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                {getFileIcon(previewDocument.filePath[0]?.url)}
                <h3>{previewDocument.title}</h3>
              </div>
              <button style={styles.closeButton} onClick={handleClosePreview} aria-label="Close preview">
                <CloseIcon />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.previewImageContainer}>
                <img
                  src={previewDocument.filePath[0]?.url || "/placeholder.svg"}
                  alt={previewDocument.title}
                  style={styles.previewImage}
                />
              </div>

              <div style={styles.previewDetails}>
                <div style={styles.previewDetailItem}>
                  <span style={styles.previewDetailLabel}>Description:</span>
                  <span style={styles.previewDetailValue}>{previewDocument.description}</span>
                </div>
                <div style={styles.previewDetailItem}>
                  <span style={styles.previewDetailLabel}>Developer:</span>
                  <span style={styles.previewDetailValue}>
                    {previewDocument.uploadedBy.name} ({previewDocument.uploadedBy.email})
                  </span>
                </div>
                <div style={styles.previewDetailItem}>
                  <span style={styles.previewDetailLabel}>Category:</span>
                  <span style={styles.previewDetailValue}>{previewDocument.category}</span>
                </div>
                <div style={styles.previewDetailItem}>
                  <span style={styles.previewDetailLabel}>Upload Date:</span>
                  <span style={styles.previewDetailValue}>
                    {new Date(previewDocument.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div style={styles.previewDetailItem}>
                  <span style={styles.previewDetailLabel}>Status:</span>
                  <span
                    style={{
                      ...styles.previewStatusValue,
                      color: getStatusBadge(previewDocument.status).text,
                    }}
                  >
                    {getStatusBadge(previewDocument.status).label}
                  </span>
                </div>
                {previewDocument.notes && (
                  <div style={styles.previewDetailItem}>
                    <span style={styles.previewDetailLabel}>Notes:</span>
                    <span style={styles.previewDetailValue}>{previewDocument.notes}</span>
                  </div>
                )}
              </div>

              {previewDocument.status === "pending" && (
                <div style={styles.approvalSection}>
                  <h4 style={styles.approvalTitle}>Review Document</h4>
                  <textarea
                    style={styles.approvalComments}
                    placeholder="Add comments or feedback about this document..."
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    rows={4}
                  />
                  <div style={styles.approvalActions}>
                    <button
                      style={styles.rejectButton}
                      onClick={() => handleRejectDocument(previewDocument._id)}
                      className="reject-button"
                    >
                      <AlertIcon />
                      <span>Reject Document</span>
                    </button>
                    <button
                      style={styles.approveActionButton}
                      onClick={() => handleApproveDocument(previewDocument._id)}
                      className="approve-button"
                    >
                      <CheckIcon />
                      <span>Approve Document</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={styles.downloadButton} 
                className="download-button"
                onClick={() => handleDownload(previewDocument)}
              >
                <DownloadIcon />
                <span>Download Document</span>
              </button>
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
        
        .document-card {
          animation: fadeIn 0.5s ease-out;
          animation-fill-mode: both;
          transition: all 0.2s ease;
        }
        
        .document-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .document-card:nth-child(1) { animation-delay: 0.1s; }
        .document-card:nth-child(2) { animation-delay: 0.15s; }
        .document-card:nth-child(3) { animation-delay: 0.2s; }
        .document-card:nth-child(4) { animation-delay: 0.25s; }
        .document-card:nth-child(5) { animation-delay: 0.3s; }
        
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
        
        .approve-button {
          transition: all 0.2s ease;
        }
        
        .approve-button:hover {
          background-color: #059669;
          transform: translateY(-2px);
        }
        
        .reject-button {
          transition: all 0.2s ease;
        }
        
        .reject-button:hover {
          background-color: #dc2626;
          transform: translateY(-2px);
        }
        
        .download-button {
          transition: all 0.2s ease;
        }
        
        .download-button:hover {
          background-color: #2563eb;
          color: white;
          transform: translateY(-2px);
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
    marginBottom: "24px",
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
  documentsContainer: {
    marginBottom: "40px",
  },
  documentsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  documentCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    padding: "20px",
  },
  documentHeader: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
  },
  documentIconContainer: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "24px",
    flexShrink: 0,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  documentDescription: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 8px 0",
  },
  documentMeta: {
    display: "flex",
    gap: "16px",
    fontSize: "13px",
    color: "#94a3b8",
  },
  documentSize: {},
  documentDate: {},
  documentDeveloper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    marginBottom: "16px",
  },
  developerAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    color: "#64748b",
    fontSize: "14px",
  },
  developerInfo: {
    display: "flex",
    flexDirection: "column" as const,
  },
  developerName: {
    fontSize: "15px",
    fontWeight: 500,
    color: "#334155",
  },
  developerCompany: {
    fontSize: "13px",
    color: "#64748b",
  },
  documentFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 500,
  },
  documentActions: {
    display: "flex",
    gap: "8px",
  },
  viewButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  approveButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    backgroundColor: "#ecfdf5",
    border: "1px solid #d1fae5",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#10b981",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  commentsSection: {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    fontSize: "13px",
  },
  commentsLabel: {
    fontWeight: 500,
    color: "#475569",
    marginBottom: "4px",
  },
  commentsText: {
    color: "#64748b",
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
    maxWidth: "800px",
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
    display: "flex",
    alignItems: "center",
    gap: "12px",
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
  },
  modalBody: {
    padding: "24px",
  },
  previewImageContainer: {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "24px",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "400px",
    objectFit: "contain" as const,
  },
  previewDetails: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    marginBottom: "24px",
  },
  previewDetailItem: {
    display: "flex",
    fontSize: "14px",
  },
  previewDetailLabel: {
    width: "120px",
    color: "#64748b",
    fontWeight: 500,
  },
  previewDetailValue: {
    color: "#0f172a",
    flex: 1,
  },
  previewStatusValue: {
    fontWeight: 500,
  },
  approvalSection: {
    marginTop: "24px",
    padding: "20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
  },
  approvalTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: "16px",
  },
  approvalComments: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    resize: "vertical" as const,
    marginBottom: "16px",
  },
  approvalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  rejectButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    border: "1px solid #fee2e2",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  approveActionButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#ecfdf5",
    color: "#10b981",
    border: "1px solid #d1fae5",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
  },
  downloadButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#3b82f6",
    cursor: "pointer",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "24px",
    fontSize: "15px",
  },
  skeletonIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    backgroundColor: "#e2e8f0",
  },
  skeletonTitle: {
    width: "60%",
    height: "24px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
    marginBottom: "8px",
  },
  skeletonDescription: {
    width: "80%",
    height: "16px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
    marginBottom: "8px",
  },
  skeletonMeta: {
    width: "40%",
    height: "14px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
  },
  skeletonAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#e2e8f0",
  },
  skeletonName: {
    width: "120px",
    height: "16px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
    marginBottom: "4px",
  },
  skeletonEmail: {
    width: "160px",
    height: "14px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
  },
  skeletonStatus: {
    width: "100px",
    height: "24px",
    borderRadius: "20px",
    backgroundColor: "#e2e8f0",
  },
  skeletonButton: {
    width: "80px",
    height: "32px",
    borderRadius: "6px",
    backgroundColor: "#e2e8f0",
  },
}

