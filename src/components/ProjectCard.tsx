

interface Project {
    id: string
    title: string
    description: string
    location: string
    status: string
    image: string
    createdAt: string
  }
  
  interface ProjectCardProps {
    project: Project
  }
  
  export default function ProjectCard({ project }: ProjectCardProps) {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "in progress":
          return { bg: "#eef2ff", text: "#3b82f6" }
        case "completed":
          return { bg: "#ecfdf5", text: "#10b981" }
        case "planning":
          return { bg: "#fff7ed", text: "#f97316" }
        default:
          return { bg: "#f3f4f6", text: "#6b7280" }
      }
    }
  
    const statusStyle = getStatusColor(project.status)
  
    return (
      <div style={styles.card} className="project-card">
        <div style={styles.imageContainer}>
          <img src={project.image || "/placeholder.svg?height=200&width=400"} alt={project.title} style={styles.image} />
          <div
            style={{
              ...styles.statusBadge,
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
            }}
          >
            {project.status}
          </div>
        </div>
        <div style={styles.content}>
          <h3 style={styles.title}>{project.title}</h3>
          <p style={styles.description}>{project.description}</p>
          <div style={styles.details}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Location:</span>
              <span style={styles.detailValue}>{project.location}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Added:</span>
              <span style={styles.detailValue}>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.actionButton}>View Details</button>
          <button style={styles.actionButton}>Announcements</button>
          <button style={styles.actionButton}>Documents</button>
        </div>
  
        <style>{`
          .project-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .project-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    )
  }
  
  const styles = {
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    },
    imageContainer: {
      position: "relative" as const,
      height: "180px",
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover" as const,
    },
    statusBadge: {
      position: "absolute" as const,
      top: "12px",
      right: "12px",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 600,
    },
    content: {
      padding: "20px",
    },
    title: {
      margin: "0 0 10px 0",
      fontSize: "18px",
      fontWeight: 600,
      color: "#1e293b",
    },
    description: {
      margin: "0 0 15px 0",
      fontSize: "14px",
      color: "#64748b",
      lineHeight: 1.5,
    },
    details: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "8px",
    },
    detailItem: {
      display: "flex",
      fontSize: "13px",
    },
    detailLabel: {
      color: "#94a3b8",
      width: "70px",
    },
    detailValue: {
      color: "#334155",
      fontWeight: 500,
    },
    actions: {
      display: "flex",
      borderTop: "1px solid #f1f5f9",
      padding: "12px 20px",
      gap: "10px",
      flexWrap: "wrap" as const,
    },
    actionButton: {
      padding: "8px 12px",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      fontSize: "13px",
      color: "#475569",
      cursor: "pointer",
      transition: "all 0.2s ease",
      ":hover": {
        backgroundColor: "#f1f5f9",
        borderColor: "#cbd5e1",
      },
    },
  }
  
  