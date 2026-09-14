import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App instance safely without duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const driveAuth = getAuth(app);

// Provider with least-privilege Google Drive scope for file management
const driveProvider = new GoogleAuthProvider();
driveProvider.addScope("https://www.googleapis.com/auth/drive.file");
driveProvider.setCustomParameters({
  prompt: "consent",
  access_type: "offline"
});

// IN-MEMORY TOKEN CACHE - DO NOT store in localStorage or sessionStorage (per security requirement)
let cachedAccessToken: string | null = null;
let cachedDriveUser: DriveUser | null = null;
let isSigningIn = false;
const authListeners: Array<(user: DriveUser | null, hasToken: boolean) => void> = [];

const notifyAuthListeners = () => {
  const hasToken = !!cachedAccessToken;
  authListeners.forEach((listener) => {
    try {
      listener(cachedDriveUser, hasToken);
    } catch (e) {
      console.error("Auth listener error:", e);
    }
  });
};

export interface DriveUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  sizeBytes?: number;
  createdTime: string;
  webViewLink?: string;
  webContentLink?: string;
  mimeType?: string;
}

/**
 * Dynamically load Google Identity Services client script if not already present
 */
export const loadGoogleGsiScript = (): Promise<void> => {
  if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      return reject(new Error("DOM not available"));
    }
    const existing = document.getElementById("google-gsi-script") as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.accounts?.oauth2) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google GSI script")));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
};

/**
 * Initialize Drive Auth listener. Keeps access token in memory.
 */
export const initDriveAuth = (
  onAuthChange: (user: DriveUser | null, hasToken: boolean) => void
) => {
  authListeners.push(onAuthChange);
  // Send immediate initial status
  onAuthChange(cachedDriveUser, !!cachedAccessToken);

  const unsubFirebase = onAuthStateChanged(driveAuth, (user: User | null) => {
    if (user && cachedAccessToken) {
      cachedDriveUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      notifyAuthListeners();
    } else if (!cachedAccessToken && !isSigningIn) {
      cachedDriveUser = user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      } : null;
      notifyAuthListeners();
    }
  });

  return () => {
    const idx = authListeners.indexOf(onAuthChange);
    if (idx !== -1) authListeners.splice(idx, 1);
    unsubFirebase();
  };
};

/**
 * Direct Google OAuth Authentication with popup to connect Google Drive.
 * Supports both custom Google Client ID (via Google Identity Services) or Firebase Auth fallback.
 */
export const connectGoogleDrive = async (customClientId?: string): Promise<{ user: DriveUser; token: string }> => {
  const activeClientId = customClientId?.trim() || "";

  // 1. If a custom Google Client ID is provided, use Google Identity Services directly
  if (activeClientId) {
    try {
      isSigningIn = true;
      await loadGoogleGsiScript();
      
      return await new Promise<{ user: DriveUser; token: string }>((resolve, reject) => {
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: activeClientId,
            scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
            callback: async (tokenResponse: any) => {
              isSigningIn = false;
              if (tokenResponse.error) {
                if (tokenResponse.error === "popup_closed_by_user" || tokenResponse.error === "access_denied") {
                  reject({ code: "auth/popup-closed-by-user", message: "Google sign-in popup was closed." });
                  return;
                }
                reject(new Error(tokenResponse.error_description || tokenResponse.error));
                return;
              }

              const token = tokenResponse.access_token;
              if (!token) {
                reject(new Error("Did not receive a valid Google Drive access token."));
                return;
              }

              cachedAccessToken = token;

              let driveUser: DriveUser = {
                uid: "gsi-" + Date.now(),
                email: null,
                displayName: null,
                photoURL: null
              };

              try {
                const uRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (uRes.ok) {
                  const uData = await uRes.json();
                  driveUser = {
                    uid: uData.sub || driveUser.uid,
                    email: uData.email || null,
                    displayName: uData.name || null,
                    photoURL: uData.picture || null
                  };
                }
              } catch (e) {
                // Ignore profile fetch failure, token is still valid for Drive
              }

              cachedDriveUser = driveUser;
              notifyAuthListeners();
              resolve({ user: driveUser, token });
            },
            error_callback: (err: any) => {
              isSigningIn = false;
              if (err?.type === "popup_closed") {
                reject({ code: "auth/popup-closed-by-user", message: "Google sign-in popup was closed." });
              } else {
                reject(new Error(err?.message || "Google OAuth error occurred"));
              }
            }
          });

          client.requestAccessToken({ prompt: "consent" });
        } catch (initErr) {
          isSigningIn = false;
          reject(initErr);
        }
      });
    } catch (error: any) {
      const isUserClosure = 
        error?.code === "auth/popup-closed-by-user" || 
        error?.code === "auth/cancelled-popup-request";

      if (!isUserClosure) {
        console.error("Google Drive OAuth error:", error);
      }
      throw error;
    } finally {
      isSigningIn = false;
    }
  }

  // 2. Default Fallback: Firebase Auth GoogleAuthProvider
  try {
    isSigningIn = true;
    const result = await signInWithPopup(driveAuth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error("Did not receive a valid Google Drive access token. Please try again.");
    }

    cachedAccessToken = credential.accessToken;

    const driveUser: DriveUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    };

    cachedDriveUser = driveUser;
    notifyAuthListeners();

    return { user: driveUser, token: cachedAccessToken };
  } catch (error: any) {
    const isUserClosure = 
      error?.code === "auth/popup-closed-by-user" || 
      error?.code === "auth/cancelled-popup-request";

    if (!isUserClosure) {
      console.error("Google Drive OAuth error:", error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Disconnect Google Drive and clear in-memory token
 */
export const disconnectGoogleDrive = async () => {
  try {
    if (cachedAccessToken && typeof window !== "undefined" && (window as any).google?.accounts?.oauth2?.revoke) {
      try {
        (window as any).google.accounts.oauth2.revoke(cachedAccessToken, () => {});
      } catch (e) {}
    }
    await signOut(driveAuth).catch(() => {});
  } catch (e) {
    console.error("Sign out error:", e);
  } finally {
    cachedAccessToken = null;
    cachedDriveUser = null;
    notifyAuthListeners();
  }
};

/**
 * Get current in-memory access token
 */
export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * List backups stored on Google Drive (files created by app or containing backup in name)
 */
export const listGoogleDriveBackups = async (): Promise<DriveBackupFile[]> => {
  if (!cachedAccessToken) {
    throw new Error("Not authenticated with Google Drive. Please connect first.");
  }

  const query = encodeURIComponent("name contains 'backup' and trashed = false");
  const fields = encodeURIComponent("files(id, name, size, createdTime, modifiedTime, webViewLink, webContentLink, mimeType)");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=createdTime desc&pageSize=50`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error("Google Drive session expired. Please reconnect your Google account.");
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to list files from Google Drive.");
  }

  const data = await res.json();
  const files = data.files || [];

  return files.map((f: any) => {
    const bytes = f.size ? parseInt(f.size, 10) : 0;
    const formatted = bytes > 0 ? (bytes / (1024 * 1024)).toFixed(2) + " MB" : "Unknown size";
    return {
      id: f.id,
      name: f.name,
      size: formatted,
      sizeBytes: bytes,
      createdTime: f.createdTime,
      webViewLink: f.webViewLink,
      webContentLink: f.webContentLink,
      mimeType: f.mimeType
    };
  });
};

/**
 * Upload a backup blob to Google Drive with progress tracking using Resumable Upload
 */
export const uploadBackupToGoogleDrive = async (
  blob: Blob,
  filename: string,
  onProgress?: (percentage: number) => void
): Promise<DriveBackupFile> => {
  if (!cachedAccessToken) {
    throw new Error("Not authenticated with Google Drive. Please connect first.");
  }

  const metadata = {
    name: filename,
    mimeType: "application/zip",
    description: "Nova Panel Server Backup Archive"
  };

  // Step 1: Initiate Resumable Upload Session
  const initRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "application/zip",
      "X-Upload-Content-Length": blob.size.toString()
    },
    body: JSON.stringify(metadata)
  });

  if (!initRes.ok) {
    if (initRes.status === 401) {
      cachedAccessToken = null;
      throw new Error("Google Drive session expired. Please reconnect your Google account.");
    }
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to initialize Google Drive upload.");
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("Google Drive did not return an upload session URL.");
  }

  // Step 2: Upload blob using XMLHttpRequest to provide accurate real-time progress
  return new Promise<DriveBackupFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", "application/zip");

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const file = JSON.parse(xhr.responseText);
          const bytes = file.size ? parseInt(file.size, 10) : blob.size;
          resolve({
            id: file.id,
            name: file.name,
            size: (bytes / (1024 * 1024)).toFixed(2) + " MB",
            sizeBytes: bytes,
            createdTime: new Date().toISOString(),
            webViewLink: file.webViewLink,
            webContentLink: file.webContentLink
          });
        } catch (e) {
          resolve({
            id: "uploaded-" + Date.now(),
            name: filename,
            size: (blob.size / (1024 * 1024)).toFixed(2) + " MB",
            sizeBytes: blob.size,
            createdTime: new Date().toISOString()
          });
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading backup to Google Drive."));
    };

    xhr.send(blob);
  });
};

/**
 * Delete a file from Google Drive (MUST only be called after explicit user confirmation)
 */
export const deleteGoogleDriveBackup = async (fileId: string): Promise<boolean> => {
  if (!cachedAccessToken) {
    throw new Error("Not authenticated with Google Drive. Please connect first.");
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`
    }
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to delete file from Google Drive.");
  }

  return true;
};

/**
 * Download a backup file directly from Google Drive
 */
export const downloadGoogleDriveBackup = async (fileId: string, filename: string) => {
  if (!cachedAccessToken) {
    throw new Error("Not authenticated with Google Drive. Please connect first.");
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to download file from Google Drive.");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename.endsWith(".zip") ? filename : `${filename}.zip`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
