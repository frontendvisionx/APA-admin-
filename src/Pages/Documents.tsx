import { useState, useEffect, useRef } from "react"
import {
  DocumentIcon,
  PlusIcon,
  SearchIcon,
  DownloadIcon,
  CloseIcon,
  FileIcon,
  PDFIcon,
  ImageIcon,
  ExcelIcon,
  WordIcon,
  TrashIcon,
} from "../components/Icons"
import DocumentUploadForm from "../components/DocumentUploadForm"
import useDocumentStore from "../stores/useDocumentStore"
import ConfirmationModal from "../components/ConfirmationModal"

type DocumentCategory = 'legal' | 'technical' | 'financial' | 'basic' | 'other';

export default function DocumentsPage() {
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; title: string } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { documents, isLoading, fetchDocuments, deleteDocument } = useDocumentStore()

  useEffect(() => {
    const fetchData = async () => {
      // Always get projectId from localStorage to ensure we use the selected project
      const projectId = localStorage.getItem('projectId');
      if (!projectId) {
        // Wait for a short time and try again (in case project is still being loaded)
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryProjectId = localStorage.getItem('projectId');
        if (retryProjectId) {
          await fetchDocuments(retryProjectId);
        }
      } else {
        await fetchDocuments(projectId);
      }
    };

    fetchData();
  }, [fetchDocuments])

  const handleSearchFocus = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Flatten documents to show each file separately
  // Handle documents with empty filePath arrays by creating a placeholder entry
  const flattenedDocuments = documents.flatMap((document) => {
    // If filePath is empty or doesn't exist, create a placeholder entry
    if (!document.filePath || document.filePath.length === 0) {
      return [{
        _id: document._id || `doc-${document._id}`,
        url: '',
        key: '',
        description: document.notes || '',
        title: document.title,
        notes: document.notes,
        createdAt: document.createdAt,
        documentId: document._id,
        category: document.category || 'basic',
        hasNoFiles: true, // Flag to indicate no files
      }];
    }
    
    // Map files normally
    return document.filePath.map((file) => ({
      ...file,
      title: document.title,
      notes: document.notes,
      createdAt: document.createdAt,
      documentId: document._id,
      category: document.category || 'basic',
      hasNoFiles: false,
    }));
  })

  // Filter flattened documents based on search term and category
  const filteredDocuments = flattenedDocuments.filter((file) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (file.title || '').toLowerCase().includes(searchLower) ||
      (file.notes || '').toLowerCase().includes(searchLower) ||
      (file.description || '').toLowerCase().includes(searchLower);

    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort documents by date
  const sortedDocuments = [...filteredDocuments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const getFileIcon = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase()
    switch (extension) {
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

  const DocumentSkeleton = () => (
    <div style={styles.documentCard} className="skeleton-card">
      <div style={styles.documentIconContainer}>
        <div style={styles.skeletonIcon} className="skeleton-animation" />
      </div>
      <div style={styles.documentInfo}>
        <div style={styles.skeletonTitle} className="skeleton-animation" />
        <div style={styles.skeletonDescription} className="skeleton-animation" />
        <div style={styles.skeletonDate} className="skeleton-animation" />
      </div>
    </div>
  )

  const handleDeleteClick = (documentId: string, title: string) => {
    setDocumentToDelete({ id: documentId, title })
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    try {
      await deleteDocument(documentToDelete.id)
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Documents</h1>
          <p style={styles.subtitle}>Manage building documents and certificates</p>
        </div>
        <button style={styles.uploadButton} onClick={() => setIsUploadFormOpen(true)} className="upload-button">
          <PlusIcon />
          <span>Upload Documents</span>
        </button>
      </div>

      <div style={styles.searchAndFilterContainer}>
        <div style={styles.searchContainer} onClick={handleSearchFocus}>
          <SearchIcon />
          <input
            ref={searchInputRef}
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
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | 'all')}
            style={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            <option value="legal">Legal</option>
            <option value="technical">Technical</option>
            <option value="financial">Financial</option>
            <option value="basic">Basic</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={styles.documentGrid}>
          {[1, 2, 3, 4].map((i) => (
            <DocumentSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div style={styles.documentsContainer}>
          {sortedDocuments.length === 0 ? (
            <div style={styles.emptyState}>
              <DocumentIcon />
              <h3>No documents found</h3>
              <p>
                {searchTerm ? "Try adjusting your search criteria" : "Upload your first document to get started"}
              </p>
              {searchTerm && (
                <button
                  style={styles.resetFiltersButton}
                  onClick={() => setSearchTerm("")}
                >
                  Reset Search
                </button>
              )}
            </div>
          ) : (
            <div style={styles.documentGrid}>
              {sortedDocuments.map((file) => (
                <div
                  key={`${file.documentId}-${file._id}`}
                  style={styles.documentCard}
                  className="document-card"
                >
                  <div style={styles.documentIconContainer}>
                    <div style={styles.filePreview}>
                      {getFileIcon(file.url)}
                    </div>
                  </div>
                  <div style={styles.documentInfo}>
                    <h3 style={styles.documentName}>{file.title}</h3>
                    {file.hasNoFiles ? (
                      <p style={{ ...styles.documentDescription, fontStyle: 'italic', color: '#94a3b8' }}>
                        No files attached
                      </p>
                    ) : (
                      <p style={styles.documentDescription}>{file.description}</p>
                    )}
                    {file.notes && <p style={styles.documentNotes}>{file.notes}</p>}
                    <div style={styles.documentMeta}>
                      <span style={styles.documentCategory}>{file.category}</span>
                      <p style={styles.documentDate}>
                        Uploaded on{" "}
                        {new Date(file.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div style={styles.documentActions}>
                    <div style={styles.fileAction}>
                      {file.hasNoFiles ? (
                        <span style={{ ...styles.documentActionButton, opacity: 0.5, cursor: 'not-allowed' }} title="No files attached">
                          No Files
                        </span>
                      ) : file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.documentActionButton}
                          title="Download"
                          className="download-button"
                        >
                          <DownloadIcon />
                        </a>
                      ) : null}
                      <button
                        style={styles.documentActionButton}
                        title="Delete"
                        className="delete-button"
                        onClick={() => handleDeleteClick(file.documentId, file.title)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <DocumentUploadForm
        isOpen={isUploadFormOpen}
        onClose={() => setIsUploadFormOpen(false)}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDocumentToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.title}"? This action cannot be undone.`}
        isLoading={isLoading}
      />

      <style>{`
        .upload-button {
          transition: all 0.3s ease;
          transform: scale(1);
        }
        
        .upload-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        
        .document-card {
          transition: all 0.3s ease;
          transform: translateY(0);
        }
        
        .document-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .delete-button, .download-button {
          opacity: 0.7;
          transition: all 0.2s ease;
        }
        
        .delete-button:hover {
          opacity: 1;
          color: #ef4444;
        }
        
        .download-button:hover {
          opacity: 1;
          color: #3b82f6;
        }
        
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
        
        .preview-content {
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
        
        .document-card {
          animation: fadeIn 0.5s ease-out;
          animation-fill-mode: both;
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
        .document-card:nth-child(6) { animation-delay: 0.35s; }
        
        .preview-delete-button:hover {
          background-color: #fee2e2;
          color: #dc2626;
          border-color: #fecaca;
        }
        
        .preview-download-button:hover {
          background-color: #2563eb;
          color: white;
        }
        
        .filePreview {
          position: relative;
          display: inline-flex;
          margin: 0 4px;
        }
        
        .fileCount {
          position: absolute;
          bottom: -8px;
          right: -8px;
          background-color: #3b82f6;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .fileAction {
          display: flex;
          alignItems: "center";
          justifyContent: "space-between";
          padding: "8px 0";
          borderBottom: "1px solid #f1f5f9";
        }
        
        .fileDescription {
          fontSize: "14px";
          color: "#475569";
          flex: 1;
          marginRight: "12px";
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
        
        .skeleton-card {
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          display: flex;
          flexDirection: "column" as const;
        }
        
        .skeleton-icon {
          width: "48px";
          height: "48px";
          border-radius: "8px";
          background-color: "#e2e8f0";
        }
        
        .skeleton-title {
          width: "70%";
          height: "20px";
          border-radius: "4px";
          background-color: "#e2e8f0";
          marginBottom: "12px";
        }
        
        .skeleton-description {
          width: "100%";
          height: "40px";
          border-radius: "4px";
          background-color: "#e2e8f0";
          marginBottom: "12px";
        }
        
        .skeleton-date {
          width: "40%";
          height: "16px";
          border-radius: "4px";
          background-color: "#e2e8f0";
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
  uploadButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(37, 99, 235, 0.2)",
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
  documentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  documentCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
  },
  documentIconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: "32px",
  },
  documentInfo: {
    padding: "16px",
    flex: 1,
  },
  documentName: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
    margin: "0 0 8px 0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  documentDescription: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 12px 0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    lineHeight: 1.4,
  },
  documentNotes: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 12px 0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    lineHeight: 1.4,
  },
  documentMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px",
  },
  documentCategory: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#f1f5f9",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#64748b",
    textTransform: "capitalize" as const,
  },
  documentSize: {
    fontSize: "12px",
    color: "#64748b",
  },
  documentDate: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
  },
  documentActions: {
    display: "flex",
    borderTop: "1px solid #f1f5f9",
    padding: "8px 16px",
  },
  documentActionButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    marginRight: "8px",
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
  previewOverlay: {
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
  previewContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    display: "flex",
    flexDirection: "column" as const,
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  previewTitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  closePreviewButton: {
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
  previewBody: {
    display: "flex",
    flexDirection: "column" as const,
    padding: "24px",
    gap: "24px",
  },
  previewImageContainer: {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "24px",
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
  previewFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
  },
  previewActionButton: {
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
  previewDownloadButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#3b82f6",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  filePreview: {
    position: "relative" as const,
    display: "inline-flex",
    margin: "0 4px",
  },
  fileCount: {
    position: "absolute" as const,
    bottom: "-8px",
    right: "-8px",
    backgroundColor: "#3b82f6",
    color: "white",
    fontSize: "10px",
    padding: "2px 6px",
    borderRadius: "10px",
  },
  fileAction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  fileDescription: {
    fontSize: "14px",
    color: "#475569",
    flex: 1,
    marginRight: "12px",
  },
  skeletonIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    backgroundColor: "#e2e8f0",
  },
  skeletonTitle: {
    width: "70%",
    height: "20px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
    marginBottom: "12px",
  },
  skeletonDescription: {
    width: "100%",
    height: "40px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
    marginBottom: "12px",
  },
  skeletonDate: {
    width: "40%",
    height: "16px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
  },
}

