// @ts-nocheck
import React, { useState, useEffect } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate, Link } from "react-router-dom";
import { SkipForward } from "lucide-react";
import gsap from "gsap";
import axios from "axios";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import CaptchaModal from "../components/CaptchaModal";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const { login } = useAuth();
  const { 
    panelName, enableLoginAnimation, enableRegistration,
    enableGoogleLogin, firebaseApiKey, firebaseAuthDomain, firebaseProjectId,
    firebaseStorageBucket, firebaseMessagingSenderId, firebaseAppId, addons
  } = useSettings();
  const navigate = useNavigate();

  const isAntibotEnabled = addons?.antibot?.enabled && addons.antibot.targetPages?.includes("login");
  const [captchaCompleted, setCaptchaCompleted] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

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
    const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
    const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1

    // Make the login card subtly tilt with the cursor
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAntibotEnabled && !captchaCompleted) {
      setError("Please complete the security CAPTCHA verification.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/auth/login", { username, password });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!firebaseApiKey || !firebaseProjectId) {
      setError("Firebase Google Login is not configured by administrator yet.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const fbConfig = {
        apiKey: firebaseApiKey,
        authDomain: firebaseAuthDomain,
        projectId: firebaseProjectId,
        storageBucket: firebaseStorageBucket,
        messagingSenderId: firebaseMessagingSenderId,
        appId: firebaseAppId
      };

      const app = getApps().length === 0 ? initializeApp(fbConfig) : getApp();
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (!googleUser.email) {
        throw new Error("No email associated with this Google account");
      }

      const res = await axios.post("/api/auth/google", {
        email: googleUser.email,
        googleId: googleUser.uid,
        name: googleUser.displayName || "",
        photoURL: googleUser.photoURL || ""
      });

      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google Login popup was closed before completing.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized in Firebase Console -> Auth settings -> Authorized Domains.");
      } else if (err.code === "auth/too-many-requests" || err.response?.status === 429 || err.message?.includes("429")) {
        setError("Too many login requests. Please wait a minute and try again.");
      } else {
        setError(err.response?.data?.error || err.message || "Google Authentication failed. Please check your Firebase configuration.");
      }
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
        <h2 className="login-title">{panelName} Login</h2>
        <p className="login-subtitle">Welcome to the panel</p>
        
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="input-group">
            <i className="ri-user-line input-icon"></i>
            <input 
              type="text" 
              name="username" 
              required 
              placeholder="Username" 
              className="login-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <i className="ri-lock-line input-icon"></i>
            <input 
              type="password" 
              name="password" 
              required 
              placeholder="Password" 
              className="login-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isAntibotEnabled && !captchaCompleted && (
            <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
              <div className="text-sm text-zinc-300 font-medium tracking-wide">Security Check required</div>
              <button 
                type="button" 
                onClick={() => setShowCaptcha(true)}
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-2 transition-all font-semibold"
              >
                Click to verify
              </button>
            </div>
          )}

          {isAntibotEnabled && captchaCompleted && (
             <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
               <i className="ri-checkbox-circle-fill text-lg"></i> Verification Complete
             </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading || (isAntibotEnabled && !captchaCompleted)}>
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {enableGoogleLogin && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", margin: "0.8rem 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.2)" }} />
              <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", letterSpacing: "1px" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.2)" }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.22)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        )}

        {enableRegistration !== false && (
          <div style={{ marginTop: "1.2rem", textAlign: "center", fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.8)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#fff", fontWeight: 600, textDecoration: "underline" }}>
              Register
            </Link>
          </div>
        )}
      </div>

      {showCaptcha && (
        <CaptchaModal 
          mode={addons?.antibot?.captchaMode || "Random"} 
          onSuccess={() => { setCaptchaCompleted(true); setShowCaptcha(false); }} 
          onClose={() => setShowCaptcha(false)} 
        />
      )}
      
      {isLoading && <LoadingOverlay message="Authenticating..." />}
    </div>
  );
}
