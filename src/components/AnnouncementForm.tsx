import type React from "react"
import { useState, useEffect } from "react"
import { XIcon, InfoIcon, AlertIcon, CheckIcon } from "./Icons"
import useAnnouncementStore from "../stores/useAnnouncementStore"

type AnnouncementType = 'information' | 'alert' | 'success' | 'warning' | 'error';
type AnnouncementCategory = 'AGM/SGM' | 'Prebid Meeting' | 'Corrigendum/Additions' | 'Comparision Of Bids' | 'Presentations of Developers' | 'Other';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  announcementType: AnnouncementType;
  category: AnnouncementCategory;
  createdAt: string;
  isPinned?: boolean;
  documents?: string[];
}

interface CreateAnnouncementData {
  title: string;
  content: string;
  projectId: string;
  announcementType: AnnouncementType;
  category: AnnouncementCategory;
  isPinned?: boolean;
  createdAt: string;
  documents?: File[];
  documentDescriptions?: string[];
}

interface FileWithDescription {
  file: File;
  description: string;
}

interface AnnouncementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (announcement: Announcement | CreateAnnouncementData) => void;
  announcement?: Announcement | null;
}

export default function AnnouncementForm({ isOpen, onClose, announcement, onSubmit }: AnnouncementFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState<AnnouncementType>("information")
  const [category, setCategory] = useState<AnnouncementCategory>("Other")
  const [isPinned, setIsPinned] = useState(false)
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('.')[0])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [files, setFiles] = useState<FileWithDescription[]>([])
  
  const { createAnnouncement, isLoading } = useAnnouncementStore()

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title)
      setContent(announcement.content)
      setType(announcement.announcementType)
      setCategory(announcement.category)
      setIsPinned(announcement.isPinned || false)
      setCreatedAt(announcement.createdAt.split('.')[0])
    } else {
      resetForm()
    }
  }, [announcement])

  const resetForm = () => {
    setTitle("")
    setContent("")
    setType("information")
    setCategory("Other")
    setIsPinned(false)
    setCreatedAt(new Date().toISOString().split('.')[0])
    setErrors({})
    setFiles([])
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!content.trim()) newErrors.content = "Content is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    setFiles(prev => [
      ...prev,
      ...newFiles.map(file => ({ file, description: '' }))
    ]);
  };

  const handleDescriptionChange = (index: number, description: string) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, description } : file
    ));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const projectId = localStorage.getItem('projectId')
      if (!projectId) {
        throw new Error('Project ID not found')
      }

      const formData: CreateAnnouncementData = {
        title,
        content,
        projectId,
        announcementType: type,
        category,
        isPinned,
        createdAt,
        documents: files.map(f => f.file),
        documentDescriptions: files.map(f => f.description)
      }

      if (announcement) {
        await onSubmit?.({
          ...formData,
          _id: announcement._id,
        })
      } else {
        await createAnnouncement(formData)
      }

      resetForm()
      onClose()
    } catch (error) {
      console.error('Failed to submit announcement:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="modal-content">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{announcement ? "Edit Announcement" : "Create Announcement"}</h2>
          <button style={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="title">
              Title <span style={styles.required}>*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                ...styles.input,
                ...(errors.title ? styles.inputError : {}),
              }}
              placeholder="Enter announcement title"
            />
            {errors.title && <p style={styles.errorText}>{errors.title}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="content">
              Content <span style={styles.required}>*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                ...styles.textarea,
                ...(errors.content ? styles.inputError : {}),
              }}
              placeholder="Enter announcement content"
              rows={6}
            />
            {errors.content && <p style={styles.errorText}>{errors.content}</p>}
          </div>

          <div style={styles.formGroup}>
            <div style={styles.togglesGroup}>
              <div style={styles.toggleContainer}>
                <label style={styles.toggleLabel} className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={() => setIsPinned(!isPinned)}
                    style={styles.toggleInput}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span style={styles.toggleText}>Pin to top</span>
              </div>
              
              <div style={styles.dateContainer}>
                <label style={styles.label} htmlFor="createdAt">
                  Created At
                </label>
                <input
                  id="createdAt"
                  type="datetime-local"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
              style={styles.select}
            >
              <option value="AGM/SGM">AGM/SGM</option>
              <option value="Prebid Meeting">Prebid Meeting</option>
              <option value="Corrigendum/Additions">Corrigendum/Additions</option>
              <option value="Comparision Of Bids">Comparision Of Bids</option>
              <option value="Presentations of Developers">Presentations of Developers</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Announcement Type</label>
            <div style={styles.typeOptions}>
              <label
                style={{
                  ...styles.typeOption,
                  ...(type === "information" ? styles.activeTypeOption : {}),
                  ...(type === "information" ? { backgroundColor: "#eef2ff", borderColor: "#3b82f6" } : {}),
                }}
                className="type-option"
              >
                <input
                  type="radio"
                  name="type"
                  value="information"
                  checked={type === "information"}
                  onChange={() => setType("information")}
                  style={styles.radioInput}
                />
                <InfoIcon />
                <span>Information</span>
              </label>

              <label
                style={{
                  ...styles.typeOption,
                  ...(type === "alert" ? styles.activeTypeOption : {}),
                  ...(type === "alert" ? { backgroundColor: "#fff1f2", borderColor: "#e11d48" } : {}),
                }}
                className="type-option"
              >
                <input
                  type="radio"
                  name="type"
                  value="alert"
                  checked={type === "alert"}
                  onChange={() => setType("alert")}
                  style={styles.radioInput}
                />
                <AlertIcon />
                <span>Alert</span>
              </label>

              <label
                style={{
                  ...styles.typeOption,
                  ...(type === "success" ? styles.activeTypeOption : {}),
                  ...(type === "success" ? { backgroundColor: "#ecfdf5", borderColor: "#10b981" } : {}),
                }}
                className="type-option"
              >
                <input
                  type="radio"
                  name="type"
                  value="success"
                  checked={type === "success"}
                  onChange={() => setType("success")}
                  style={styles.radioInput}
                />
                <CheckIcon />
                <span>Success</span>
              </label>

              <label
                style={{
                  ...styles.typeOption,
                  ...(type === "warning" ? styles.activeTypeOption : {}),
                  ...(type === "warning" ? { backgroundColor: "#fff7ed", borderColor: "#f97316" } : {}),
                }}
                className="type-option"
              >
                <input
                  type="radio"
                  name="type"
                  value="warning"
                  checked={type === "warning"}
                  onChange={() => setType("warning")}
                  style={styles.radioInput}
                />
                <AlertIcon />
                <span>Warning</span>
              </label>

              <label
                style={{
                  ...styles.typeOption,
                  ...(type === "error" ? styles.activeTypeOption : {}),
                  ...(type === "error" ? { backgroundColor: "#fef2f2", borderColor: "#dc2626" } : {}),
                }}
                className="type-option"
              >
                <input
                  type="radio"
                  name="type"
                  value="error"
                  checked={type === "error"}
                  onChange={() => setType("error")}
                  style={styles.radioInput}
                />
                <AlertIcon />
                <span>Error</span>
              </label>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Attach Documents</label>
            <div style={styles.fileUploadContainer}>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={styles.fileInput}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <div style={styles.fileUploadText}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Drag and drop files here or click to browse</p>
                <span style={styles.fileTypes}>Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</span>
              </div>
            </div>
            {files.length > 0 && (
              <div style={styles.fileList}>
                {files.map((file, index) => (
                  <div key={index} style={styles.fileItem}>
                    <div style={styles.fileIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <div style={styles.fileInfo}>
                      <span style={styles.fileName}>{file.file.name}</span>
                      <input
                        type="text"
                        placeholder="Add description"
                        value={file.description}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                        style={styles.descriptionInput}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      style={styles.removeFileButton}
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton} disabled={isLoading}>
              {isLoading ? "Creating..." : (announcement ? "Update Announcement" : "Create Announcement")}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-content {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .type-option {
          transition: all 0.2s ease;
        }
        
        .type-option:hover {
          border-color: #94a3b8;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 46px;
          height: 24px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #e2e8f0;
          transition: .4s;
          border-radius: 24px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background-color: #2563eb;
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(22px);
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
  form: {
    padding: "24px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#334155",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    transition: "all 0.2s ease",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    resize: "vertical" as const,
    minHeight: "100px",
    transition: "all 0.2s ease",
  },
  typeOptions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
  },
  typeOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    fontSize: "14px",
    color: "#475569",
    transition: "all 0.2s ease",
  },
  activeTypeOption: {
    fontWeight: 600,
  },
  radioInput: {
    position: "absolute" as const,
    opacity: 0,
    width: 0,
    height: 0,
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    accentColor: "#3b82f6",
  },
  checkboxLabel: {
    fontSize: "14px",
    color: "#475569",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },
  cancelButton: {
    padding: "10px 16px",
    backgroundColor: "white",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 500,
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "13px",
    marginTop: "6px",
    marginBottom: 0,
  },
  fileInput: {
    width: "100%",
    padding: "10px",
    border: "1px dashed #cbd5e1",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  fileList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  fileInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    flex: 1,
  },
  fileName: {
    fontSize: "14px",
    color: "#334155",
    fontWeight: 500,
  },
  descriptionInput: {
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "13px",
    width: "100%",
  },
  removeFileButton: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fileUploadContainer: {
    position: 'relative' as const,
    width: '100%',
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center' as const,
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  fileUploadText: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
  },
  fileTypes: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  fileIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    color: '#64748b',
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.2s ease",
  },
  togglesGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
    marginBottom: "16px",
  },
  toggleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  toggleLabel: {
    cursor: "pointer",
  },
  toggleInput: {
    position: "absolute" as const,
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleText: {
    fontSize: "14px",
    color: "#475569",
  },
  dateContainer: {
    marginTop: "16px",
  },
}

