// @ts-nocheck
import React, { useState, useEffect } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useSettings } from "../context/SettingsContext";
import { useNavigate, Link } from "react-router-dom";
import { SkipForward } from "lucide-react";
import gsap from "gsap";
import axios from "axios";
import "./Login.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const { 
    panelName, enableLoginAnimation, enableRegistration
  } = useSettings();

  const navigate = useNavigate();

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.set('.login-card', { autoAlpha: 0, scale: 0.8, rotationX: 20, y: 40 });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Attempt auto play
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn("Video autoplay prevented or failed:", err);
      });
    }
  }, []);

  useEffect(() => {
    if (introDone) {
      gsap.to('.login-card', {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        z: 0,
        duration: 1,
        ease: 'power3.out'
      });
      // Start looping background video smoothly
      if (videoRef.current) {
        videoRef.current.loop = true;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [introDone]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!introDone) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    gsap.to(".login-card", {
      x: x * 15,
      y: y * 15,
      rotationY: x * 8,
      rotationX: -y * 8,
      duration: 0.8,
      ease: "power2.out",
      overwrite: "auto"
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (enableRegistration === false) {
      setError("Registration protocol offline (Disabled by admin).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Security keys do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Security key must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post("/api/auth/register", { username, email, password, confirmPassword });
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="desert-wrapper" onMouseMove={handleMouseMove}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        src="/loginregister.mp4"
        onEnded={() => setIntroDone(true)}
        onError={() => setIntroDone(true)}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className={`absolute inset-0 transition-opacity duration-1000 z-0 pointer-events-none ${introDone ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-black/20'}`} />

      {!introDone && (
        <button
          type="button"
          onClick={() => setIntroDone(true)}
          className="skip-video-corner-btn group"
          title="Skip intro video"
        >
          <SkipForward className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform" />
          <span>Skip Video</span>
        </button>
      )}

      <div className="login-card">
        <h2 className="login-title">Register</h2>
        <p className="login-subtitle">Create a new account</p>
        
        <form onSubmit={handleRegister} className="login-form">
          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-error" style={{background: 'rgba(50, 255, 50, 0.2)', borderColor: 'rgba(50, 255, 50, 0.4)', color: '#dbffdb'}}>{success}</div>}
          
          <div className="input-group">
            <i className="ri-user-line input-icon"></i>
            <input 
              type="text" 
              name="username" 
              required 
              placeholder="USERNAME" 
              className="login-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="input-group">
            <i className="ri-mail-line input-icon"></i>
            <input 
              type="email" 
              name="email" 
              required 
              placeholder="EMAIL" 
              className="login-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <i className="ri-lock-line input-icon"></i>
            <input 
              type="password" 
              name="password" 
              required 
              placeholder="PASSWORD" 
              className="login-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="input-group">
            <i className="ri-lock-line input-icon"></i>
            <input 
              type="password" 
              name="confirmPassword" 
              required 
              placeholder="AGAIN PASSWORD" 
              className="login-input" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Processing..." : "REGISTER"}
          </button>
        </form>

        <div style={{ marginTop: "1.2rem", textAlign: "center", fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.8)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#fff", fontWeight: 600, textDecoration: "underline" }}>
            Login
          </Link>
        </div>
      </div>
      
      {isLoading && <LoadingOverlay message="Processing..." />}
    </div>
  );
}
