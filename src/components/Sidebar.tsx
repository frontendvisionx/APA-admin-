import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { BellIcon, LogOutIcon, MenuIcon, TenderIcon, XIcon, PartnerIcon } from "./Icons"
import { DocumentIcon, UsersIcon } from "./Icons"
import useProjectStore from "../stores/useProjectStore"
import useAuthStore from "../stores/useAuthStore"
import logo from "../assets/images/logo.png"


interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Sidebar({ setActiveTab }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const { project, projects, fetchProjects, selectProject } = useProjectStore()
  const { logout } = useAuthStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showProjectDropdown && !target.closest('[data-project-selector]')) {
        setShowProjectDropdown(false)
      }
    }

    if (showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProjectDropdown])

  const handleLogout = () => {
    logout()
  }

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setActiveTab(path.slice(1))
    if (window.innerWidth < 768) {
      setMobileOpen(false)
    }
  }

  const handleProjectChange = async (projectId: string) => {
    try {
      await selectProject(projectId)
      setShowProjectDropdown(false)
    } catch (error) {
      console.error('Failed to switch project:', error)
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="mobile-menu-button"
        style={styles.mobileMenuButton} 
        onClick={toggleMobileSidebar} 
        aria-label="Toggle menu"
      >
        <MenuIcon />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div 
          className="overlay"
          style={styles.overlay} 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          ...styles.sidebar,
          width: collapsed ? "80px" : "260px",
          transform: mobileOpen ? "translateX(0)" : "",
        }}
      >
        <div style={styles.sidebarHeader}>
          <div 
            style={styles.logoContainer}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div style={styles.logoWrapper}>
              <img src={logo} alt="Company Logo" style={styles.logoImage} />
              {!collapsed ? (
                <div style={styles.projectInfo}>
                  <div style={styles.projectSelectorContainer} data-project-selector>
                    <div 
                      style={{
                        ...styles.projectSelector,
                        cursor: projects.length > 1 ? 'pointer' : 'default',
                      }}
                      onClick={() => projects.length > 1 && setShowProjectDropdown(!showProjectDropdown)}
                      className="project-selector"
                    >
                      <h1 style={styles.logo}>{project?.name || 'Loading...'}</h1>
                      {projects.length > 1 && (
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          style={styles.dropdownIcon}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      )}
                    </div>
                    {showProjectDropdown && projects.length > 1 && (
                      <div style={styles.projectDropdown}>
                        {projects.map((proj) => (
                          <div
                            key={proj._id}
                            style={{
                              ...styles.projectOption,
                              ...(project?._id === proj._id ? styles.projectOptionActive : {})
                            }}
                            onClick={() => handleProjectChange(proj._id)}
                          >
                            <div style={styles.projectOptionName}>{proj.name}</div>
                            {proj.reraNo && (
                              <div style={styles.projectOptionRera}>RERA: {proj.reraNo}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {showTooltip && project && !showProjectDropdown && (
                    <div style={styles.tooltip}>
                      <div style={styles.tooltipContent}>
                        <div style={styles.tooltipRow}>
                          <span style={styles.tooltipLabel}>RERA No:</span>
                          <span style={styles.tooltipValue}>{project.reraNo}</span>
                        </div>
                        <div style={styles.tooltipRow}>
                          <span style={styles.tooltipLabel}>Status:</span>
                          <span style={{
                            ...styles.tooltipValue,
                            ...styles.statusBadge,
                            backgroundColor: project.status === 'ongoing' ? '#ecfdf5' : '#f3f4f6',
                            color: project.status === 'ongoing' ? '#10b981' : '#6b7280'
                          }}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <h1 style={styles.logoSmall}>{project?.name?.slice(0, 2) || 'ST'}</h1>
              )}
            </div>
          </div>
          <button
            style={styles.collapseButton}
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="collapse-button"
          >
            {collapsed ? "→" : "←"}
          </button>
          <button style={styles.closeMobileButton} onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <XIcon />
          </button>
        </div>

        <nav style={styles.nav}>
          <ul style={styles.navList}>
            <li
              style={{
                ...styles.navItem,
                ...(location.pathname === "/announcements" ? styles.activeNavItem : {}),
              }}
              onClick={() => handleNavigation("/announcements")}
            >
              <BellIcon />
              {!collapsed && <span style={styles.navText}>Announcements</span>}
            </li>
            <li
              style={{
                ...styles.navItem,
                ...(location.pathname === "/documents" ? styles.activeNavItem : {}),
              }}
              onClick={() => handleNavigation("/documents")}
            >
              <DocumentIcon />
              {!collapsed && <span style={styles.navText}>Documents</span>}
            </li>
            <li
              style={{
                ...styles.navItem,
                ...(location.pathname === "/users" ? styles.activeNavItem : {}),
              }}
              onClick={() => handleNavigation("/users")}
            >
              <UsersIcon />
              {!collapsed && <span style={styles.navText}>Approval requests</span>}
            </li>
            <li
              style={{
                ...styles.navItem,
                ...(location.pathname === "/tenders" ? styles.activeNavItem : {}),
              }}
              onClick={() => handleNavigation("/tenders")}
            >
              <TenderIcon />
              {!collapsed && <span style={styles.navText}>Tenders</span>}
            </li>
            <li
              style={{
                ...styles.navItem,
                ...(location.pathname === "/developer" ? styles.activeNavItem : {}),
              }}
              onClick={() => handleNavigation("/developer")}
            >
              <PartnerIcon />
              {!collapsed && <span style={styles.navText}>Developer</span>}
            </li>
            <li
              style={{
                ...styles.navItem,
                ...(location.pathname === "/developersdocs" ? styles.activeNavItem : {}),
              }}
              onClick={() => handleNavigation("/developersdocs")}
            >
              <DocumentIcon />
              {!collapsed && <span style={styles.navText}>Developer docs</span>}
            </li>
          </ul>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            {!collapsed && (
              <>
                <div style={styles.avatar}>AD</div>
                <div style={styles.userDetails}>
                  <p style={styles.userName}>Admin User</p>
                  <p style={styles.userRole}>Administrator</p>
                </div>
              </>
            )}
            {collapsed && <div style={styles.avatarSmall}>AD</div>}
          </div>
          <button style={styles.logoutButton} onClick={handleLogout}>
            <LogOutIcon />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <style>{`
        .collapse-button {
          opacity: 0.5;
          transition: opacity 0.2s ease;
        }
        .collapse-button:hover {
          opacity: 1;
        }
        
        .project-selector:hover {
          background-color: #f8fafc;
        }
        
        .project-option:hover {
          background-color: #f1f5f9 !important;
        }
        
        @media (max-width: 768px) {
          .collapse-button {
            display: none;
          }
          
          .sidebar {
            position: fixed;
            transform: translateX(-100%);
            width: 260px !important;
          }
          
          .close-mobile-button {
            display: block;
          }
          
          .mobile-menu-button {
            display: block;
          }
          
          .overlay {
            display: block;
          }
        }
      `}</style>
    </>
  )
}

const styles = {
  sidebar: {
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "#ffffff",
    boxShadow: "0 0 20px rgba(0, 0, 0, 0.05)",
    height: "100vh",
    position: "sticky" as const,
    top: 0,
    left: 0,
    zIndex: 1000,
    transition: "width 0.3s ease",
    overflow: "hidden",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px",
    borderBottom: "1px solid #f0f0f0",
    position: "relative" as const,
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    flexDirection: "column" as const,
    gap: "10px",
  },
  logoWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "10px",
    position: "relative" as const,
  },
  logoImage: {
    width: "120px",
    height: "60px",
        backgroundColor: "black",
    objectFit: "contain" as const,
  },
  projectInfo: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  logo: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#2563eb",
    textAlign: "center" as const,
  },
  logoSmall: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#2563eb",
  },
  collapseButton: {
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#888",
    position: "absolute" as const,
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
  },
  closeMobileButton: {
    display: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#888",
    position: "absolute" as const,
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    "@media (max-width: 768px)": {
      display: "block",
    },
  },
  nav: {
    flex: 1,
    padding: "20px 0",
  },
  navList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    cursor: "pointer",
    color: "#555",
    transition: "all 0.2s ease",
    borderRadius: "8px",
    margin: "4px 10px",
    ":hover": {
      backgroundColor: "#f5f7fa",
      color: "#2563eb",
    },
  },
  activeNavItem: {
    backgroundColor: "#eef2ff",
    color: "#2563eb",
    fontWeight: 600,
  },
  navText: {
    marginLeft: "12px",
    fontSize: "15px",
  },
  sidebarFooter: {
    padding: "20px",
    borderTop: "1px solid #f0f0f0",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    marginRight: "12px",
  },
  avatarSmall: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    margin: "0 auto",
  },
  userDetails: {
    overflow: "hidden",
  },
  userName: {
    margin: "0 0 2px 0",
    fontSize: "14px",
    fontWeight: 600,
    color: "#333",
  },
  userRole: {
    margin: 0,
    fontSize: "12px",
    color: "#888",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "10px",
    backgroundColor: "#f5f7fa",
    border: "none",
    borderRadius: "8px",
    color: "#555",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
    },
  },
  mobileMenuButton: {
    display: "none",
    position: "fixed" as const,
    top: "20px",
    left: "20px",
    zIndex: 1001,
    background: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    "@media (max-width: 768px)": {
      display: "block",
    },
  },
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
    display: "none",
    "@media (max-width: 768px)": {
      display: "block",
    },
  },
  "@media (max-width: 768px)": {
    sidebar: {
      position: "fixed" as const,
      transform: "translateX(-100%)",
      width: "260px !important",
    },
    closeMobileButton: {
      display: "block",
    },
  },
  tooltip: {
    position: 'absolute' as const,
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    padding: '12px',
    zIndex: 1000,
    width: '220px',
    marginTop: '10px',
  },
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  tooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltipLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: 500,
  },
  tooltipValue: {
    fontSize: '12px',
    color: '#1e293b',
    fontWeight: 600,
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    textTransform: 'capitalize' as const,
  },
  projectSelectorContainer: {
    position: 'relative' as const,
    width: '100%',
  },
  projectSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
  },
  dropdownIcon: {
    color: '#2563eb',
    transition: 'transform 0.2s ease',
  },
  projectDropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    padding: '8px',
    zIndex: 1001,
    width: '240px',
    marginTop: '8px',
    maxHeight: '300px',
    overflowY: 'auto' as const,
  },
  projectOption: {
    padding: '10px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginBottom: '4px',
  },
  projectOptionActive: {
    backgroundColor: '#eef2ff',
  },
  projectOptionName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '4px',
  },
  projectOptionRera: {
    fontSize: '12px',
    color: '#64748b',
  },
}

