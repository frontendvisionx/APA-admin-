import type React from "react"
import { useState} from "react"
import { XIcon } from "./Icons"
import useTenderStore from "../stores/useTenderStore"

type TenderCategory = 'basic' | 'technical' | 'financial' | 'other';

interface FileWithDescription {
  file: File;
  description: string;
}

interface AddTenderModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddTenderModal({ isOpen, onClose }: AddTenderModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [notes, setNotes] = useState("")
  const [category, setCategory] = useState<TenderCategory>("basic")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [files, setFiles] = useState<FileWithDescription[]>([])

  const { createTender, isLoading } = useTenderStore()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!description.trim()) newErrors.description = "Description is required"

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

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('visibility', visibility);
      formData.append('projectId', projectId);
      formData.append('notes', notes);
      formData.append('category', category);

      // Add files and their descriptions
      files.forEach((file, index) => {
        formData.append('document', file.file);
        formData.append(`documentDescriptions[${index}]`, file.description);
      });

      await createTender({
        title,
        description,
        visibility,
        projectId,
        notes,
        category,
        documents: files.map(f => f.file),
        documentDescriptions: files.map(f => f.description)
      })

      resetForm()
      onClose()
    } catch (error) {
      console.error('Failed to create tender:', error)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setVisibility("public")
    setNotes("")
    setCategory("basic")
    setErrors({})
    setFiles([])
  }

  if (!isOpen) return null

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="modal-content">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Add New Tender</h2>
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
              placeholder="Enter tender title"
            />
            {errors.title && <p style={styles.errorText}>{errors.title}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="description">
              Description <span style={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                ...styles.textarea,
                ...(errors.description ? styles.inputError : {}),
              }}
              placeholder="Enter tender description"
              rows={4}
            />
            {errors.description && <p style={styles.errorText}>{errors.description}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TenderCategory)}
              style={styles.select}
            >
              <option value="basic">Basic</option>
              <option value="technical">Technical</option>
              <option value="financial">Financial</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="visibility">
              Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "public" | "private")}
              style={styles.select}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
              placeholder="Enter additional notes"
              rows={3}
            />
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
              {isLoading ? "Creating..." : "Create Tender"}
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
  textarea: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    transition: "all 0.2s ease",
    resize: "vertical" as const,
    minHeight: "80px",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "white",
    transition: "all 0.2s ease",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "20px",
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
    "&:disabled": {
      opacity: 0.7,
      cursor: "not-allowed",
    },
  },
  errorText: {
    color: "#ef4444",
    fontSize: "13px",
    marginTop: "6px",
    marginBottom: 0,
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
  fileInput: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '12px',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  fileIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    color: '#3b82f6',
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    flex: 1,
  },
  fileName: {
    fontSize: '14px',
    color: '#334155',
    fontWeight: 500,
  },
  descriptionInput: {
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '13px',
    width: '100%',
  },
  removeFileButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}
