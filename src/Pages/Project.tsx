
import { useState, useEffect } from "react"
import ProjectCard from "../components/ProjectCard"
import AddProjectModal from "../components/AddProjectModal"
import { PlusIcon } from "../components/Icons"

interface Project {
  id: string
  title: string
  description: string
  location: string
  status: string
  image: string
  createdAt: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(true)

  useEffect(() => {
    // Check if user has projects (simulating first visit)
    const hasProjects = localStorage.getItem("hasProjects")
    if (hasProjects) {
      setIsFirstVisit(false)

      // Load projects from localStorage
      const savedProjects = localStorage.getItem("projects")
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects))
      }
    }
  }, [])

  const handleAddProject = (project: Project) => {
    const newProjects = [...projects, project]
    setProjects(newProjects)
    setIsFirstVisit(false)

    // Save to localStorage
    localStorage.setItem("hasProjects", "true")
    localStorage.setItem("projects", JSON.stringify(newProjects))

    setIsModalOpen(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Projects</h1>
        <p style={styles.subtitle}>Manage your construction projects</p>
      </div>

      {isFirstVisit ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateContent}>
            <h2 style={styles.emptyStateTitle}>No Projects Yet</h2>
            <p style={styles.emptyStateText}>Get started by adding your first construction project</p>
            <button
              style={styles.addFirstProjectButton}
              onClick={() => setIsModalOpen(true)}
              className="add-first-project-button"
            >
              <PlusIcon size={24} />
              <span>Add Your First Project</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={styles.projectsGrid}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          <button
            style={styles.floatingButton}
            onClick={() => setIsModalOpen(true)}
            aria-label="Add project"
            className="floating-add-button"
          >
            <PlusIcon />
            <span style={styles.floatingButtonText}>Add Project</span>
          </button>
        </>
      )}

      <AddProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddProject={handleAddProject} />

      <style>{`
        .add-first-project-button {
          transition: all 0.3s ease;
          transform: scale(1);
        }
        
        .add-first-project-button:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 30px rgba(37, 99, 235, 0.2);
        }
        
        .floating-add-button {
          transition: all 0.3s ease;
        }
        
        .floating-add-button:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.25);
        }
        
        .floating-add-button:hover span {
          opacity: 1;
          width: auto;
          margin-left: 8px;
          padding: 0 12px;
        }
        
        @media (max-width: 768px) {
          .floating-add-button:hover span {
            display: none;
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
    marginBottom: "30px",
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
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    padding: "60px 40px",
    minHeight: "400px",
  },
  emptyStateContent: {
    textAlign: "center" as const,
    maxWidth: "500px",
  },
  emptyStateTitle: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#1e293b",
    margin: "0 0 12px 0",
  },
  emptyStateText: {
    fontSize: "16px",
    color: "#64748b",
    marginBottom: "30px",
  },
  addFirstProjectButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 28px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    margin: "0 auto",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.2)",
  },
  projectsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "80px",
  },
  floatingButton: {
    position: "fixed" as const,
    bottom: "30px",
    right: "30px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
    cursor: "pointer",
    zIndex: 100,
    overflow: "hidden",
  },
  floatingButtonText: {
    opacity: 0,
    width: 0,
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
    transition: "all 0.3s ease",
    fontWeight: 600,
  },
  "@media (max-width: 768px)": {
    projectsGrid: {
      gridTemplateColumns: "1fr",
    },
  },
}

