import type React from "react"
import { useState } from "react"
import { XIcon, UploadIcon } from "./Icons"
import useDocumentStore from "../stores/useDocumentStore"

interface FileWithDescription {
  file: File;
  description: string;
}

type DocumentCategory = 'legal' | 'technical' | 'financial' | 'basic' | 'other';

interface DocumentUploadFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentUploadForm({ isOpen, onClose }: DocumentUploadFormProps) {
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [category, setCategory] = useState<DocumentCategory>("basic")
  const [files, setFiles] = useState<FileWithDescription[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  
  const { uploadDocuments, isLoading } = useDocumentStore()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    // Check if adding new files would exceed the limit of 5
    if (files.length + selectedFiles.length > 5) {
      setErrors({ ...errors, files: "You can only upload up to 5 files at once" })
      return
    }

    // Check file sizes
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > 100 * 1024 * 1024) { // 100MB in bytes
      setErrors({ ...errors, files: "Total file size cannot exceed 100MB" })
      return
    }

    const newFiles = selectedFiles.map(file => ({
      file,
      description: ""
    }))

    setFiles([...files, ...newFiles])
    setErrors({ ...errors, files: "" })
  }

  const handleDescriptionChange = (index: number, description: string) => {
    const updatedFiles = [...files]
    updatedFiles[index].description = description
    setFiles(updatedFiles)
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!notes.trim()) newErrors.notes = "Notes are required"
    if (files.length === 0) newErrors.files = "At least one file is required"
    if (files.some(f => !f.description.trim())) {
      newErrors.description = "Description is required for all files"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const formData = new FormData()
    formData.append("title", title)
    formData.append("projectId", localStorage.getItem("projectId") || "")
    formData.append("notes", notes)
    formData.append("category", category)

    files.forEach((fileObj, index) => {
      formData.append("filePath", fileObj.file)
      formData.append(`filePathDescriptions[${index}]`, fileObj.description)
    })

    try {
      await uploadDocuments(formData)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Failed to upload documents:", error)
      setErrors({ ...errors, submit: error instanceof Error ? error.message : 'Failed to upload documents' })
    }
  }

  const resetForm = () => {
    setTitle("")
    setNotes("")
    setCategory("basic")
    setFiles([])
    setErrors({})
  }

  if (!isOpen) return null

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="modal-content">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Upload Documents</h2>
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
              placeholder="Enter document title"
            />
            {errors.title && <p style={styles.errorText}>{errors.title}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="category">
              Category <span style={styles.required}>*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              style={{
                ...styles.select,
                ...(errors.category ? styles.inputError : {}),
              }}
            >
              <option value="legal">Legal</option>
              <option value="technical">Technical</option>
              <option value="financial">Financial</option>
              <option value="basic">Basic</option>
              <option value="other">Other</option>
            </select>
            {errors.category && <p style={styles.errorText}>{errors.category}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="notes">
              Notes <span style={styles.required}>*</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                ...styles.textarea,
                ...(errors.notes ? styles.inputError : {}),
              }}
              placeholder="Enter any additional notes"
              rows={4}
            />
            {errors.notes && <p style={styles.errorText}>{errors.notes}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Upload Files <span style={styles.required}>*</span>
              <span style={styles.fileLimit}>(Max 5 files, 100MB total)</span>
            </label>
            <div style={styles.uploadContainer}>
              <input
                type="file"
                onChange={handleFileChange}
                style={styles.fileInput}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.csv"
              />
              <div style={styles.uploadIcon}>
                <UploadIcon />
              </div>
              <p style={styles.uploadText}>
                {files.length > 0 ? `${files.length} file(s) selected` : "Drag & drop files here or click to browse"}
              </p>
            </div>
            {errors.files && <p style={styles.errorText}>{errors.files}</p>}
          </div>

          {files.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>File Descriptions</label>
              {files.map((fileObj, index) => (
                <div key={index} style={styles.fileDescriptionContainer}>
                  <div style={styles.fileInfo}>
                    <span style={styles.fileName}>{fileObj.file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      style={styles.removeFileButton}
                      aria-label="Remove file"
                    >
                      <XIcon />
                    </button>
                  </div>
                  <textarea
                    value={fileObj.description}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    style={{
                      ...styles.textarea,
                      ...(errors.description ? styles.inputError : {}),
                    }}
                    placeholder={`Enter description for ${fileObj.file.name}`}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={styles.formActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton} disabled={isLoading}>
              {isLoading ? "Uploading..." : "Upload Documents"}
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#cbd5e1",
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    resize: "vertical" as const,
    minHeight: "100px",
    transition: "all 0.2s ease",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "15px",
    borderRadius: "8px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    backgroundColor: "white",
    transition: "all 0.2s ease",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "20px",
  },
  uploadContainer: {
    borderWidth: "2px",
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center" as const,
    cursor: "pointer",
    position: "relative" as const,
    overflow: "hidden",
  },
  fileInput: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
  uploadIcon: {
    fontSize: "32px",
    color: "#64748b",
    marginBottom: "10px",
  },
  uploadText: {
    fontSize: "14px",
    color: "#64748b",
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#cbd5e1",
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
    borderWidth: 0,
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
  fileLimit: {
    fontSize: "12px",
    color: "#64748b",
    marginLeft: "8px",
    fontWeight: "normal" as const,
  },
  fileDescriptionContainer: {
    marginBottom: "16px",
  },
  fileInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  fileName: {
    fontSize: "14px",
    color: "#1e293b",
    fontWeight: 500,
  },
  removeFileButton: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    color: "#ef4444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
}


