import { useState } from "react"
import { EyeIcon, EyeOffIcon, CheckIcon, AlertIcon } from "../components/Icons"
import useAuthStore from "../stores/useAuthStore"

export default function CreatePartnerPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const { register } = useAuthStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Phone validation (optional)
    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = "Phone number is invalid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const message = await register(formData.name, formData.email, formData.password, formData.phone);
      setSuccessMessage(message); // Show success message
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
      });

      // Redirect after delay
      setTimeout(() => {
        window.location.href = "/tenders";
      }, 2000);
    } catch (error) {
      setErrors({ submit: "Failed to create partner account. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Create Developer Account</h1>
        <p style={styles.subtitle}>Create credentials for a new developer to access the platform</p>
      </div>

      <div style={styles.formContainer}>
        {successMessage && (
          <div style={styles.successMessage} className="success-message">
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {errors.submit && (
          <div style={styles.errorMessage} className="error-message">
            <AlertIcon />
            <span>{errors.submit}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="name">
                Full Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.name ? styles.inputError : {}),
                }}
                placeholder="Enter developer's full name"
                disabled={isSubmitting}
              />
              {errors.name && <p style={styles.errorText}>{errors.name}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="email">
                Email Address <span style={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.email ? styles.inputError : {}),
                }}
                placeholder="Enter developer's email address"
                disabled={isSubmitting}
              />
              {errors.email && <p style={styles.errorText}>{errors.email}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="password">
                Password <span style={styles.required}>*</span>
              </label>
              <div style={styles.passwordInputContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(errors.password ? styles.inputError : {}),
                    paddingRight: "40px",
                  }}
                  placeholder="Create a strong password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <p style={styles.errorText}>{errors.password}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="confirmPassword">
                Confirm Password <span style={styles.required}>*</span>
              </label>
              <div style={styles.passwordInputContainer}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(errors.confirmPassword ? styles.inputError : {}),
                    paddingRight: "40px",
                  }}
                  placeholder="Confirm password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.confirmPassword && <p style={styles.errorText}>{errors.confirmPassword}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="phone">
                Phone Number <span style={styles.optional}>(Optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.phone ? styles.inputError : {}),
                }}
                placeholder="Enter developer's phone number"
                disabled={isSubmitting}
              />
              {errors.phone && <p style={styles.errorText}>{errors.phone}</p>}
            </div>
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(isSubmitting ? styles.buttonLoading : {}),
              }}
              disabled={isSubmitting}
              className="create-button"
            >
              {isSubmitting ? (
                <>
                  <span style={styles.loadingSpinner} className="spinner"></span>
                  Creating Developer Account...
                </>
              ) : (
                "Create Developer Account"
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .success-message {
          animation: slideDown 0.5s ease-out;
        }
        
        .error-message {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .create-button {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .create-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        
        .create-button:active {
          transform: translateY(0);
        }
        
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
  formContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    marginBottom: "40px",
  },
  form: {
    width: "100%",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
    },
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
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  required: {
    color: "#ef4444",
  },
  optional: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "normal",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
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
  errorText: {
    color: "#ef4444",
    fontSize: "13px",
    margin: "4px 0 0 0",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
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
  passwordInputContainer: {
    position: "relative" as const,
    width: "100%",
  },
  passwordToggle: {
    position: "absolute" as const,
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
  },
  passwordStrengthContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "8px",
  },
  strengthBars: {
    display: "flex",
    gap: "4px",
    flex: 1,
  },
  strengthBar: {
    height: "4px",
    flex: 1,
    borderRadius: "2px",
    backgroundColor: "#e2e8f0",
    transition: "background-color 0.3s ease",
  },
  strengthLabel: {
    fontSize: "12px",
    fontWeight: 500,
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    marginTop: "32px",
  },
  cancelButton: {
    padding: "12px 20px",
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
    ":disabled": {
      opacity: 0.7,
      cursor: "not-allowed",
    },
  },
  submitButton: {
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    ":hover": {
      backgroundColor: "#1d4ed8",
    },
    ":disabled": {
      opacity: 0.7,
      cursor: "not-allowed",
    },
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
  successMessage: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#ecfdf5",
    color: "#10b981",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "24px",
    fontSize: "15px",
  },
  errorMessage: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "24px",
    fontSize: "15px",
  },
}
