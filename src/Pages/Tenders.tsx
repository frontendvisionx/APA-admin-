import { useState, useEffect, useRef } from "react"
import { PlusIcon, SearchIcon, CloseIcon, FilterIcon, EyeIcon, EyeOffIcon, UsersIcon, DocumentIcon, TrashIcon } from "../components/Icons"
import AddTenderModal from "../components/AddTender"
import useTenderStore from "../stores/useTenderStore"
import ConfirmationModal from "../components/ConfirmationModal"

interface Partner {
  _id: string
  name: string
  email: string
  phone: string
  role: string
}

interface Document {
  name: string;
  url: string;
  key: string;
  description: string;
  _id: string;
  signedUrl: string;
}

interface Tender {
  _id: string
  title: string
  description: string
  visibility: "public" | "private"
  projectId: string
  notes: string
  createdAt: string
  partners: Partner[]
  document?: Document[]
  category: string
}

const TenderSkeleton = () => (
  <div style={styles.tenderCard} className="skeleton-card">
    <div style={styles.tenderHeader}>
      <div style={styles.skeletonTitle} className="skeleton-animation" />
      <div style={styles.skeletonBadge} className="skeleton-animation" />
    </div>
    <div style={styles.skeletonDescription} className="skeleton-animation" />
    <div style={styles.skeletonActions} className="skeleton-animation" />
    <div style={styles.skeletonFooter} className="skeleton-animation" />
  </div>
);

export default function TendersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVisibility, setSelectedVisibility] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [isPartnersModalOpen, setIsPartnersModalOpen] = useState(false)
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false)
  const [partnerSearchTerm, setPartnerSearchTerm] = useState("")
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([])
  const [selectedTenderForPartners, setSelectedTenderForPartners] = useState<Tender | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentDescription, setDocumentDescription] = useState("")
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedTenderForUpload, setSelectedTenderForUpload] = useState<Tender | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [tenderToDelete, setTenderToDelete] = useState<{ id: string; title: string } | null>(null)

  const { tenders, partners, isLoading, fetchTenders, fetchPartners, selectPartners, attachDocument, deleteTender } = useTenderStore()

  useEffect(() => {
    const fetchData = async () => {
      // Always get projectId from localStorage to ensure we use the selected project
      const projectId = localStorage.getItem('projectId');
      if (!projectId) {
        // Wait for a short time and try again (in case project is still being loaded)
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryProjectId = localStorage.getItem('projectId');
        if (retryProjectId) {
          await fetchTenders(retryProjectId);
        }
      } else {
        await fetchTenders(projectId);
      }
    };

    fetchData();
  }, [fetchTenders])

  useEffect(() => {
    if (isAddPartnerModalOpen) {
      fetchPartners()
    }
  }, [isAddPartnerModalOpen, fetchPartners])

  // Filter tenders based on search term, visibility, and category
  const filteredTenders = tenders.filter((tender) => {
    const matchesSearch =
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesVisibility = selectedVisibility === "all" || tender.visibility === selectedVisibility
    const matchesCategory = selectedCategory === "all" || tender.category === selectedCategory

    return matchesSearch && matchesVisibility && matchesCategory
  })

  // Sort tenders by date (newest first)
  const sortedTenders = [...filteredTenders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const handleViewPartners = (tender: Tender) => {
    setSelectedTender(tender)
    setIsPartnersModalOpen(true)
  }

  const handleAddPartners = (tender: Tender) => {
    setSelectedTenderForPartners(tender)
    setSelectedPartnerIds(tender.partners.map(p => p._id))
    setIsAddPartnerModalOpen(true)
  }

  const handleSavePartners = async () => {
    if (!selectedTenderForPartners) return

    try {
      await selectPartners(selectedTenderForPartners._id, selectedPartnerIds)
      setIsAddPartnerModalOpen(false)
      setSelectedTenderForPartners(null)
      setSelectedPartnerIds([])
      setPartnerSearchTerm("")
    } catch (error) {
      console.error('Failed to save partners:', error)
    }
  }

  const handlePartnerCheckboxChange = (partnerId: string) => {
    setSelectedPartnerIds(prev => {
      if (prev.includes(partnerId)) {
        return prev.filter(id => id !== partnerId)
      } else {
        return [...prev, partnerId]
      }
    })
  }

  // Fetch partners when add partner modal opens
  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(partnerSearchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(partnerSearchTerm.toLowerCase())
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDocumentUpload = async () => {
    if (!selectedFile || !selectedTenderForUpload || !documentDescription) return

    try {
      await attachDocument(selectedTenderForUpload._id, selectedFile, documentDescription)
      setIsUploadModalOpen(false)
      setSelectedFile(null)
      setDocumentDescription("")
      setSelectedTenderForUpload(null)
    } catch (error) {
      console.error('Failed to upload document:', error)
    }
  }

  const toggleDocuments = (tenderId: string) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tenderId)) {
        newSet.delete(tenderId)
      } else {
        newSet.add(tenderId)
      }
      return newSet
    })
  }

  const handleDeleteClick = (tenderId: string, title: string) => {
    setTenderToDelete({ id: tenderId, title })
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!tenderToDelete) return

    try {
      await deleteTender(tenderToDelete.id)
      setDeleteModalOpen(false)
      setTenderToDelete(null)
    } catch (error) {
      console.error('Failed to delete tender:', error)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Tenders</h1>
          <p style={styles.subtitle}>Manage your construction tenders and their visibility</p>
        </div>
        <button style={styles.addButton} onClick={() => setIsAddModalOpen(true)} className="add-tender-button">
          <PlusIcon />
          <span>Add Tender</span>
        </button>
      </div>

      <div style={styles.searchAndFilterContainer}>
        <div style={styles.searchContainer}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search tenders..."
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
            <span>Visibility:</span>
          </div>
          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div style={styles.filterContainer}>
          <div style={styles.filterLabel}>
            <FilterIcon />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All</option>
            <option value="basic">Basic</option>
            <option value="technical">Technical</option>
            <option value="financial">Financial</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={styles.tendersGrid}>
          {[1, 2, 3].map((i) => (
            <TenderSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div style={styles.tendersGrid}>
          {sortedTenders.length === 0 ? (
            <div style={styles.emptyState}>
              <EyeIcon />
              <h3>No tenders found</h3>
              <p>
                {searchTerm || selectedVisibility !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Add your first tender to get started"}
              </p>
              {(searchTerm || selectedVisibility !== "all") && (
                <button
                  style={styles.resetFiltersButton}
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedVisibility("all")
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            sortedTenders.map((tender) => (
              <div key={tender._id} style={styles.tenderCard} className="tender-card">
                <div style={styles.tenderContent}>
                  <div style={styles.tenderHeader}>
                    <h3 style={styles.tenderTitle}>{tender.title}</h3>
                    <div style={styles.tenderMeta}>
                      <div
                        style={{
                          ...styles.categoryBadge,
                          backgroundColor: getCategoryColor(tender.category || 'basic'),
                        }}
                      >
                        {(tender.category || 'basic').charAt(0).toUpperCase() + (tender.category || 'basic').slice(1)}
                </div>
                      <div
                        style={{
                          ...styles.visibilityBadge,
                          backgroundColor: tender.visibility === "public" ? "#ecfdf5" : "#eef2ff",
                          color: tender.visibility === "public" ? "#10b981" : "#3b82f6",
                        }}
                      >
                        {tender.visibility === "public" ? (
                          <>
                            <EyeIcon />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <EyeOffIcon />
                            <span>Private</span>
                          </>
                        )}
                </div>
                </div>
                </div>
                  <div style={styles.tenderMainContent}>
                    <p style={styles.tenderDescription}>{tender.description}</p>
                    {tender.notes && <p style={styles.tenderNotes}>Notes: {tender.notes}</p>}
                    
                    {tender.visibility === "private" && (
                      <div style={styles.partnerActions}>
                        <button
                          style={styles.partnerButton}
                          onClick={() => handleViewPartners(tender)}
                          className="view-partners-button"
                        >
                          <UsersIcon />
                          <span>View Partners ({tender.partners.length})</span>
                        </button>
                        <button
                          style={styles.partnerButton}
                          onClick={() => handleAddPartners(tender)}
                          className="add-partners-button"
                        >
                          <UsersIcon />
                          <span>Add Partners</span>
                        </button>
                          </div>
                    )}

                    <button
                      style={styles.documentButton}
                      onClick={() => {
                        setSelectedTenderForUpload(tender)
                        setIsUploadModalOpen(true)
                      }}
                      className="attach-document-button"
                    >
                      <DocumentIcon />
                      <span>Attach Document</span>
                    </button>
                      </div>

                  <div style={styles.documentsSection}>
                    <button 
                      style={styles.documentsToggleButton}
                      onClick={() => toggleDocuments(tender._id)}
                    >
                      {expandedDocuments.has(tender._id) ? 'Hide Documents' : 'Show Documents'}
                      <span style={styles.documentsCount}>
                        {tender.document && tender.document.length > 0 
                          ? `(${tender.document.length})` 
                          : '(0)'}
                        </span>
                    </button>
                    {expandedDocuments.has(tender._id) && (
                      <div style={styles.documentsList}>
                        {tender.document && tender.document.length > 0 ? (
                          tender.document.map((doc) => (
                            <div key={doc._id} style={styles.documentCard}>
                              <div style={styles.documentPreview}>
                                {(doc.url || doc.signedUrl) ? (
                                  <img 
                                    src={doc.url || doc.signedUrl} 
                                    alt={doc.name}
                                    style={styles.documentThumbnail}
                                    onError={() => {}}
                                  />
                                ) : (
                                  <div style={styles.documentIconFallback}>
                                    <DocumentIcon />
                      </div>
                                )}
                      </div>
                              <div style={styles.documentInfo}>
                                <span style={styles.documentName}>{doc.name}</span>
                                {doc.description && (
                                  <span style={styles.documentDescription}>{doc.description}</span>
                                )}
                      </div>
                              <a 
                                href={doc.url || doc.signedUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={styles.viewButton}
                              >
                                View
                              </a>
                        </div>
                          ))
                        ) : (
                          <div style={styles.noDocumentsText}>
                            No documents attached to this tender
                      </div>
                        )}
                    </div>
                    )}
                  </div>

                  <div style={styles.tenderFooter}>
                    <div style={styles.tenderFooterContent}>
                      <span style={styles.tenderDate}>
                        Created on{" "}
                        {new Date(tender.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDeleteClick(tender._id, tender.title)}
                        title="Delete Tender"
                        className="delete-button"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AddTenderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Partners Modal */}
      {isPartnersModalOpen && selectedTender && (
        <div style={styles.modalOverlay} onClick={() => setIsPartnersModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Tender Partners</h2>
              <button style={styles.closeButton} onClick={() => setIsPartnersModalOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div style={styles.modalBody}>
              <h3 style={styles.tenderTitle}>{selectedTender.title}</h3>
              {selectedTender.partners.length === 0 ? (
                <p style={styles.noPartnersText}>No partners assigned to this tender yet.</p>
              ) : (
                <div style={styles.partnersList}>
                  {selectedTender.partners.map((partner) => (
                    <div key={partner._id} style={styles.partnerItem}>
                      <div style={styles.partnerInfo}>
                        <div style={styles.partnerName}>{partner.name}</div>
                        <div style={styles.partnerEmail}>{partner.email}</div>
                        <div style={styles.partnerPhone}>{partner.phone}</div>
                  </div>
                </div>
                  ))}
              </div>
          )}
        </div>
      </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {isAddPartnerModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsAddPartnerModalOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Partners</h2>
              <button 
                style={styles.closeButton} 
                onClick={() => setIsAddPartnerModalOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.searchContainer}>
                <SearchIcon />
                  <input
                  type="text"
                  placeholder="Search partners..."
                  value={partnerSearchTerm}
                  onChange={(e) => setPartnerSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                {partnerSearchTerm && (
                  <button 
                    style={styles.clearSearchButton} 
                    onClick={() => setPartnerSearchTerm("")}
                  >
                    <CloseIcon />
                  </button>
                )}
                    </div>

              <div style={styles.partnersList}>
                {filteredPartners.length === 0 ? (
                  <div style={styles.noPartnersText}>
                    No partners found
                    </div>
                ) : (
                  filteredPartners.map(partner => (
                    <div key={partner._id} style={styles.partnerCheckboxItem}>
                      <label style={styles.partnerCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedPartnerIds.includes(partner._id)}
                          onChange={() => handlePartnerCheckboxChange(partner._id)}
                          style={styles.checkbox}
                        />
                        <div style={styles.partnerInfo}>
                          <div style={styles.partnerName}>{partner.name}</div>
                          <div style={styles.partnerEmail}>{partner.email}</div>
                        </div>
                      </label>
                  </div>
                  ))
              )}
            </div>

              <div style={styles.modalActions}>
                <button 
                  style={styles.cancelButton}
                  onClick={() => setIsAddPartnerModalOpen(false)}
                >
                Cancel
              </button>
              <button
                style={styles.saveButton}
                  onClick={handleSavePartners}
                >
                  Save Partners
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsUploadModalOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Attach Document</h2>
              <button style={styles.closeButton} onClick={() => setIsUploadModalOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.uploadForm}>
                <div 
                  style={{
                    ...styles.dropZone,
                    ...(isDragging ? styles.dropZoneActive : {}),
                    ...(selectedFile ? styles.dropZoneWithFile : {})
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    style={styles.hiddenFileInput}
                  />
                  {selectedFile ? (
                    <div style={styles.selectedFileInfo}>
                      <DocumentIcon />
                      <span style={styles.selectedFileName}>{selectedFile.name}</span>
                      <button 
                        style={styles.removeFileButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ) : (
                    <div style={styles.dropZoneContent}>
                      <DocumentIcon />
                      <p style={styles.dropZoneText}>
                        Drag and drop your file here, or click to select
                      </p>
                      <p style={styles.dropZoneSubtext}>
                        Supported formats: PDF, DOC, DOCX, JPG, PNG
                      </p>
                    </div>
                  )}
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Description</label>
                  <textarea
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    style={styles.textArea}
                    placeholder="Enter document description"
                  />
                </div>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </button>
              <button 
                style={styles.uploadButton}
                onClick={handleDocumentUpload}
                disabled={!selectedFile || !documentDescription}
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setTenderToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Tender"
        message={`Are you sure you want to delete "${tenderToDelete?.title}"? This action cannot be undone.`}
        isLoading={isLoading}
      />

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
        
        .tender-card {
          animation: fadeIn 0.5s ease-out;
          animation-fill-mode: both;
          transition: all 0.3s ease;
        }
        
        .tender-card:hover {
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
        
        .tender-card:nth-child(1) { animation-delay: 0.1s; }
        .tender-card:nth-child(2) { animation-delay: 0.15s; }
        .tender-card:nth-child(3) { animation-delay: 0.2s; }
        .tender-card:nth-child(4) { animation-delay: 0.25s; }
        .tender-card:nth-child(5) { animation-delay: 0.3s; }
        
        .add-tender-button {
          transition: all 0.3s ease;
          transform: scale(1);
        }
        
        .add-tender-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        
        .view-partners-button, .add-partners-button {
          transition: all 0.2s ease;
        }
        
        .view-partners-button:hover, .add-partners-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
        }

        .partner-checkbox {
          width: 20px;
          height: 20px;
          margin-right: 12px;
        }

        .partner-item {
          animation: fadeIn 0.3s ease-out;
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

        .skeleton-title {
          width: 60%;
          height: 24px;
          border-radius: 4px;
          background-color: #e2e8f0;
        }

        .skeleton-badge {
          width: 80px;
          height: 28px;
          border-radius: 20px;
          background-color: #e2e8f0;
        }

        .skeleton-description {
          width: 100%;
          height: 60px;
          border-radius: 4px;
          background-color: #e2e8f0;
          margin-bottom: 16px;
        }

        .skeleton-actions {
          width: 70%;
          height: 36px;
          border-radius: 6px;
          background-color: #e2e8f0;
          margin-bottom: 16px;
        }

        .skeleton-footer {
          width: 40%;
          height: 16px;
          border-radius: 4px;
          background-color: #e2e8f0;
        }

        .documentButton {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          fontSize: "14px",
          color: "#475569",
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontWeight: 500,
          "&:hover": {
            backgroundColor: "#f1f5f9",
            borderColor: "#cbd5e1",
          },
        },
        
        .uploadForm {
          display: "flex",
          flexDirection: "column" as const,
          gap: "16px",
        },
        
        .formGroup {
          display: "flex",
          flexDirection: "column" as const,
          gap: "8px",
        },
        
        .formLabel {
          fontSize: "14px",
          fontWeight: 500,
          color: "#1e293b",
        },
        
        .fileInput {
          padding: "8px",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          fontSize: "14px",
        },
        
        .textArea {
          padding: "8px 12px",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          fontSize: "14px",
          minHeight: "100px",
          resize: "vertical" as const,
        },
        
        .uploadButton {
          padding: "8px 16px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s ease",
          ":disabled": {
            opacity: 0.5,
            cursor: "not-allowed",
          },
        },
        
        .cardActions {
          display: "flex",
          gap: "12px",
          marginTop: "16px",
          flexWrap: "wrap" as const,
        },
      `}</style>
    </div>
  )
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'basic':
      return '#f1f5f9';
    case 'technical':
      return '#eff6ff';
    case 'financial':
      return '#f0fdf4';
    case 'other':
      return '#fdf4ff';
    default:
      return '#f1f5f9';
  }
}

const styles = {
  container: {
    position: "relative" as const,
    minHeight: "100%",
    padding: "24px",
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
  addButton: {
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
  },
  tendersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
  },
  tenderCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    border: "1px solid #e2e8f0",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    },
  },
  tenderContent: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    gap: "20px",
  },
  tenderMainContent: {
    flex: "1 0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  tenderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    gap: "12px",
  },
  tenderTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
    flex: 1,
  },
  visibilityBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
  },
  tenderDescription: {
    fontSize: "15px",
    color: "#475569",
    lineHeight: 1.6,
    margin: "0 0 16px 0",
  },
  tenderNotes: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 16px 0",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },
  tenderFooter: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "16px",
    marginTop: "auto",
  },
  tenderFooterContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tenderDate: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  emptyState: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center" as const,
    color: "#64748b",
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
  partnerActions: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  partnerButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
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
  modalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalBody: {
    padding: "24px",
  },
  partnersList: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    maxHeight: "400px",
    overflow: "auto",
    padding: "4px",
  },
  partnerItem: {
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  partnerInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  partnerName: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
  },
  partnerEmail: {
    fontSize: "14px",
    color: "#64748b",
  },
  partnerPhone: {
    fontSize: "14px",
    color: "#64748b",
  },
  noPartnersText: {
    textAlign: "center" as const,
    padding: "24px",
    color: "#64748b",
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
  },
  partnerCheckboxItem: {
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  partnerCheckboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
  },
  cancelButton: {
    padding: "8px 16px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  saveButton: {
    padding: "8px 16px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  skeletonTitle: {
    width: "60%",
    height: "24px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
  },
  skeletonBadge: {
    width: "80px",
    height: "28px",
    borderRadius: "20px",
    backgroundColor: "#e2e8f0",
  },
  skeletonDescription: {
    width: "100%",
    height: "60px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
    marginBottom: "16px",
  },
  skeletonActions: {
    width: "70%",
    height: "36px",
    borderRadius: "6px",
    backgroundColor: "#e2e8f0",
    marginBottom: "16px",
  },
  skeletonFooter: {
    width: "40%",
    height: "16px",
    borderRadius: "4px",
    backgroundColor: "#e2e8f0",
  },
  documentButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontWeight: 500,
    "&:hover": {
      backgroundColor: "#f1f5f9",
      borderColor: "#cbd5e1",
    },
  },
  uploadForm: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  formLabel: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1e293b",
  },
  fileInput: {
    padding: "8px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
  },
  textArea: {
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
    minHeight: "100px",
    resize: "vertical" as const,
  },
  uploadButton: {
    padding: "8px 16px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  cardActions: {
    display: "flex",
    gap: "12px",
    marginTop: "16px",
    flexWrap: "wrap" as const,
  },
  documentsSection: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  documentsToggleButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
    width: "100%",
    justifyContent: "space-between",
    fontWeight: 500,
    "&:hover": {
      backgroundColor: "#f1f5f9",
    },
  },
  documentsCount: {
    backgroundColor: "#e2e8f0",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#64748b",
  },
  documentsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  documentCard: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s ease",
  },
  documentPreview: {
    width: "48px",
    height: "48px",
    borderRadius: "4px",
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    marginRight: "12px",
  },
  documentThumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  documentInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  documentName: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1e293b",
  },
  documentDescription: {
    fontSize: "12px",
    color: "#64748b",
  },
  viewButton: {
    padding: "6px 12px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
  dropZone: {
    padding: "32px",
    border: "2px dashed #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  dropZoneActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  dropZoneWithFile: {
    borderStyle: "solid",
    backgroundColor: "#f0f9ff",
  },
  dropZoneContent: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "12px",
    textAlign: "center" as const,
  },
  dropZoneText: {
    fontSize: "16px",
    color: "#475569",
    margin: "8px 0 0",
  },
  dropZoneSubtext: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: "0",
  },
  hiddenFileInput: {
    display: "none",
  },
  selectedFileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    backgroundColor: "white",
    borderRadius: "6px",
  },
  selectedFileName: {
    flex: 1,
    fontSize: "14px",
    color: "#1e293b",
  },
  removeFileButton: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    color: "#94a3b8",
  },
  noDocumentsText: {
    textAlign: "center" as const,
    padding: "16px",
    color: "#64748b",
    fontSize: "14px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px dashed #e2e8f0",
  },
  documentIconFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },
  tenderMeta: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  categoryBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#475569",
    textTransform: "capitalize" as const,
  },
  deleteButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "8px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
    "&:hover": {
      color: "#ef4444",
      backgroundColor: "#fee2e2",
    },
  },
}

