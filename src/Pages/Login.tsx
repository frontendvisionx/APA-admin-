import type React from "react"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AlertIcon } from "../components/Icons"
import Login from "../assets/images/login.jpg"
import useAuthStore from "../stores/useAuthStore"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  
  const { login, isLoading, error: loginError, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/announcements")
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!email.trim() || !password) {
      return
    }

    try {
      await login(email, password)
      
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email)
      } else {
        localStorage.removeItem("rememberedEmail")
      }
    } catch (error) {
      // Error is handled by the store
      console.error("Login failed:", error)
    }
  }

  return (
    <div style={styles.container}>
      {/* Company Photo Side */}
      <div style={styles.photoSide} className="photo-side">
        <img src={Login} alt="Skyline Tower" style={styles.backgroundImage} />
        <div style={styles.photoOverlay}>
          <div style={styles.photoContent}>
            {/* <BuildingIcon /> */}
            <h1 style={styles.companyName}>APA</h1>
            <p style={styles.companyTagline}>Building Management System</p>
          </div>
        </div>
      </div>

      {/* Login Form Side */}
      <div style={styles.formSide}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome Back</h2>
            <p style={styles.formSubtitle}>Sign in to your account to continue</p>
          </div>

          {loginError && (
            <div style={styles.errorMessage} className="error-message">
              <AlertIcon />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div style={styles.formGroup}>
              <div style={styles.labelWithLink}>
                <label htmlFor="password" style={styles.label}>
                  Password
                </label>
                <Link to="/forgot-password" style={styles.forgotPassword}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <div style={styles.checkboxContainer}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                  disabled={isLoading}
                />
                <span style={styles.checkboxText}>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(isLoading ? styles.buttonLoading : {}),
              }}
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? (
                <>
                  <span style={styles.loadingSpinner} className="spinner"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div style={styles.formFooter}>
            <p style={styles.formFooterText}>
              Don't have an account? <span style={styles.contactAdmin}>Contact administrator</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .photo-side {
          background-size: cover;
          background-position: center;
          position: relative;
        }
        
        @media (max-width: 768px) {
          .photo-side {
            display: none;
          }
          
          .form-side {
            flex: 1;
            padding: 20px;
          }
        }
        
        .error-message {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    fontFamily: "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  photoSide: {
    flex: "1 1 50%",
    position: "relative" as const,
    overflow: "hidden",
    borderTopRightRadius: "30px",
    borderBottomRightRadius: "30px",
  },
  backgroundImage: {
    position: "absolute" as const,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    filter: "blur(3px) brightness(0.7)",
    transform: "scale(1.1)", // Prevents blur edges showing
  },
  photoOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: "rgba(37, 99, 235, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    zIndex: 1,
  },
  photoContent: {
    textAlign: "center" as const,
    color: "white",
    maxWidth: "500px",
  },
  companyName: {
    fontSize: "36px",
    fontWeight: 700,
    margin: "20px 0 10px",
  },
  companyTagline: {
    fontSize: "18px",
    opacity: 0.9,
    margin: 0,
  },
  formSide: {
    flex: "1 1 50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    "@media (max-width: 768px)": {
      flex: "1 1 100%",
    },
  },
  formContainer: {
    width: "100%",
    maxWidth: "450px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    padding: "40px",
  },
  formHeader: {
    marginBottom: "30px",
    textAlign: "center" as const,
  },
  formTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  formSubtitle: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
  },
  errorMessage: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#334155",
  },
  labelWithLink: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPassword: {
    fontSize: "14px",
    color: "#2563eb",
    textDecoration: "none",
  },
  input: {
    padding: "12px 16px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    transition: "all 0.2s ease",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    accentColor: "#2563eb",
  },
  checkboxText: {
    fontSize: "14px",
    color: "#475569",
    marginLeft: "8px",
  },
  submitButton: {
    padding: "14px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  buttonLoading: {
    opacity: 0.8,
    cursor: "not-allowed",
  },
  loadingSpinner: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    borderTop: "3px solid white",
  },
  formFooter: {
    marginTop: "30px",
    textAlign: "center" as const,
  },
  formFooterText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  contactAdmin: {
    color: "#2563eb",
    fontWeight: 500,
    cursor: "pointer",
  },
}

