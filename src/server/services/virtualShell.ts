import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";

export interface ShellSession {
  cwd: string;
  user: string;
  hostname: string;
  history: string[];
  serverDir: string;
}

const sessions: Record<string, ShellSession> = {};

export const getOrCreateSession = async (server: any): Promise<ShellSession> => {
  const id = server.id;
  const serverDir = path.join(process.cwd(), ".data", "servers", id);
  await fs.ensureDir(serverDir);

  const defaultUser = server.vmUsername || "root";
  const hostname = server.vmHostname || "spark";
  const userHome = defaultUser === "root" ? path.join(serverDir, "root") : path.join(serverDir, "home", defaultUser);
  await fs.ensureDir(userHome);
  await fs.ensureDir(path.join(serverDir, "etc"));
  await fs.ensureDir(path.join(serverDir, "tmp"));

  // Ensure clean guest OS release file
  const osReleasePath = path.join(serverDir, "etc", "os-release");
  if (!fs.existsSync(osReleasePath)) {
    const osName = server.osDistro || server.version || "Ubuntu 24.04 LTS (Noble)";
    await fs.writeFile(osReleasePath, `NAME="Ubuntu"
VERSION="24.04 LTS (Noble Numbat)"
ID=ubuntu
ID_LIKE=debian
PRETTY_NAME="${osName}"
VERSION_ID="24.04"
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
UBUNTU_CODENAME=noble
`);
  }

  // Ensure guest hostname
  const hostPath = path.join(serverDir, "etc", "hostname");
  if (!fs.existsSync(hostPath)) {
    await fs.writeFile(hostPath, `${hostname}\n`);
  }

  // Remove any legacy fake wrapper scripts from earlier iterations
  const binDir = path.join(serverDir, "bin");
  if (fs.existsSync(binDir)) {
    try {
      await fs.remove(binDir);
    } catch (e) {}
  }

  if (!sessions[id]) {
    sessions[id] = {
      cwd: userHome,
      user: defaultUser,
      hostname,
      history: [],
      serverDir
    };
  }
  return sessions[id];
};

export const executeVirtualCommand = async (server: any, rawCommand: string, io: any): Promise<void> => {
  const session = await getOrCreateSession(server);
  const trimmed = rawCommand.trim();
  if (!trimmed) return;

  session.history.push(trimmed);

  const emitLog = (text: string) => {
    io?.to(`server_${server.id}`).emit("log", text);
  };

  const getDisplayDir = () => {
    const home = session.user === "root" ? path.join(session.serverDir, "root") : path.join(session.serverDir, "home", session.user);
    if (session.cwd === home) return "~";
    if (session.cwd.startsWith(session.serverDir)) {
      const rel = session.cwd.slice(session.serverDir.length);
      return rel ? rel : "/";
    }
    return session.cwd;
  };

  const emitPrompt = () => {
    const symbol = session.user === "root" ? "#" : "$";
    const dirDisplay = getDisplayDir();
    emitLog(`\x1b[1;32m${session.user}@${session.hostname}\x1b[0m:\x1b[1;34m${dirDisplay}\x1b[0m${symbol} `);
  };

  // 1. CLEAR COMMAND
  if (trimmed.toLowerCase() === "clear" || trimmed.toLowerCase() === "cls") {
    io?.to(`server_${server.id}`).emit("clear_logs");
    emitPrompt();
    return;
  }

  // 2. SUDO / SU SWITCHING
  if (trimmed === "sudo su" || trimmed === "sudo -i" || trimmed === "su" || trimmed === "su root" || trimmed === "su -") {
    if (session.user === "root") {
      emitLog("Already running as root.\r\n");
    } else {
      session.user = "root";
      session.cwd = path.join(session.serverDir, "root");
      await fs.ensureDir(session.cwd);
      emitLog("Switched to user root.\r\n");
    }
    emitPrompt();
    return;
  }

  // 3. EXIT COMMAND
  if (trimmed === "exit" || trimmed === "logout") {
    const defaultUser = server.vmUsername || "root";
    if (session.user === "root" && defaultUser !== "root") {
      session.user = defaultUser;
      session.cwd = path.join(session.serverDir, "home", defaultUser);
      await fs.ensureDir(session.cwd);
      emitLog("exit\r\n");
      emitPrompt();
      return;
    } else {
      emitLog("logout\r\n");
      emitPrompt();
      return;
    }
  }

  // 4. CD COMMAND
  if (trimmed === "cd" || trimmed === "cd ~") {
    const home = session.user === "root" ? path.join(session.serverDir, "root") : path.join(session.serverDir, "home", session.user);
    session.cwd = home;
    await fs.ensureDir(session.cwd);
    emitPrompt();
    return;
  }

  if (trimmed.startsWith("cd ")) {
    const target = trimmed.slice(3).trim();
    let targetDir: string;

    if (target === "~") {
      targetDir = session.user === "root" ? path.join(session.serverDir, "root") : path.join(session.serverDir, "home", session.user);
    } else if (target === "/") {
      targetDir = session.serverDir;
    } else if (target.startsWith("/")) {
      targetDir = path.join(session.serverDir, target);
    } else {
      targetDir = path.resolve(session.cwd, target);
    }

    try {
      const stat = await fs.stat(targetDir);
      if (stat.isDirectory()) {
        session.cwd = targetDir;
      } else {
        emitLog(`bash: cd: ${target}: Not a directory\r\n`);
      }
    } catch {
      emitLog(`bash: cd: ${target}: No such file or directory\r\n`);
    }
    emitPrompt();
    return;
  }

  // 5. NATIVE LINUX EXECUTION (NO FAKE WRAPPERS)
  const userHome = session.user === "root" ? path.join(session.serverDir, "root") : path.join(session.serverDir, "home", session.user);

  try {
    const proc = spawn("/bin/bash", ["-c", trimmed], {
      cwd: session.cwd,
      env: {
        ...process.env,
        USER: session.user,
        LOGNAME: session.user,
        HOME: userHome,
        HOSTNAME: session.hostname,
        PATH: `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
        TERM: "xterm-256color",
        LANG: "C.UTF-8",
        LC_ALL: "C.UTF-8",
        SHELL: "/bin/bash"
      }
    });

    proc.stdout.on("data", (chunk: Buffer) => {
      emitLog(chunk.toString());
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      emitLog(chunk.toString());
    });

    proc.on("error", (err) => {
      emitLog(`bash: ${err.message}\r\n`);
      emitPrompt();
    });

    proc.on("close", () => {
      emitPrompt();
    });
  } catch (err: any) {
    emitLog(`bash: execution error: ${err.message}\r\n`);
    emitPrompt();
  }
};
