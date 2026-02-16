
import type React from "react"

import { useState } from "react"
import { XIcon } from "./Icons"

interface Project {
  id: string
  title: string
  description: string
  location: string
  status: string
  image: string
  createdAt: string
}

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProject: (project: Project) => void
}

export default function AddProjectModal({ isOpen, onClose, onAddProject }: AddProjectModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState("Planning")
  const [image, setImage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!description.trim()) newErrors.description = "Description is required"
    if (!location.trim()) newErrors.location = "Location is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    // Create new project
    const newProject: Project = {
      id: Date.now().toString(),
      title,
      description,
      location,
      status,
      image: image || "/placeholder.svg?height=200&width=400",
      createdAt: new Date().toISOString(),
    }

    // Simulate API call
    setTimeout(() => {
      onAddProject(newProject)
      resetForm()
      setIsSubmitting(false)
    }, 800)
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setLocation("")
    setStatus("Planning")
    setImage("")
    setErrors({})
  }

  if (!isOpen) return null

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()} className="modal-content">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Add New Project</h2>
          <button style={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="title">
              Project Title <span style={styles.required}>*</span>
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
              placeholder="Enter project title"
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
              placeholder="Enter project description"
              rows={4}
            />
            {errors.description && <p style={styles.errorText}>{errors.description}</p>}
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="location">
                Location <span style={styles.required}>*</span>
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  ...styles.input,
                  ...(errors.location ? styles.inputError : {}),
                }}
                placeholder="Enter location"
              />
              {errors.location && <p style={styles.errorText}>{errors.location}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="status">
                Status
              </label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="image">
              Project Image
            </label>
            <div style={styles.imageUpload}>
              {image ? (
                <div style={styles.previewContainer}>
                  <img src={image || "/placeholder.svg"} alt="Project preview" style={styles.imagePreview} />
                  <button type="button" onClick={() => setImage("")} style={styles.removeImageButton}>
                    Remove
                  </button>
                </div>
              ) : (
                <div style={styles.dropzone}>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={styles.fileInput}
                  />
                  <div style={styles.dropzoneContent}>
                    <p style={styles.dropzoneText}>Drag & drop an image or click to browse</p>
                    <p style={styles.dropzoneSubtext}>Supports: JPG, PNG, GIF (Max 5MB)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? "Adding Project..." : "Add Project"}
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
    maxWidth: "700px",
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
    ":hover": {
      backgroundColor: "#f1f5f9",
      color: "#0f172a",
    },
  },
  form: {
    padding: "24px",
  },
  formGroup: {
    marginBottom: "20px",
    width: "100%",
  },
  formRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
    "@media (max-width: 640px)": {
      flexDirection: "column" as const,
      gap: "10px",
    },
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
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
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
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
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
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  },
  imageUpload: {
    border: "2px dashed #cbd5e1",
    borderRadius: "8px",
    overflow: "hidden",
  },
  dropzone: {
    position: "relative" as const,
    padding: "30px 20px",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#f8fafc",
    },
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
  dropzoneContent: {
    pointerEvents: "none" as const,
  },
  dropzoneText: {
    margin: "0 0 8px 0",
    fontSize: "15px",
    fontWeight: 500,
    color: "#334155",
  },
  dropzoneSubtext: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
  },
  previewContainer: {
    position: "relative" as const,
  },
  imagePreview: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  removeImageButton: {
    position: "absolute" as const,
    top: "10px",
    right: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#ef4444",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "30px",
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
    ":hover": {
      backgroundColor: "#f1f5f9",
    },
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
    ":hover": {
      backgroundColor: "#1d4ed8",
    },
    ":disabled": {
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
}

