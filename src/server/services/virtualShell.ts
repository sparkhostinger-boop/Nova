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
  await fs.ensureDir(path.join(serverDir, "bin"));
  await fs.ensureDir(path.join(serverDir, "etc"));
  await fs.ensureDir(path.join(serverDir, "tmp"));

  // Ensure guest OS release file
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

  // Set up custom wrapper scripts for neofetch, lscpu, uname, and lsb_release so custom specs are accurately reported
  const binDir = path.join(serverDir, "bin");

  const neofetchWrap = path.join(binDir, "neofetch");
  await fs.writeFile(neofetchWrap, `#!/bin/bash
if [ -x /usr/bin/neofetch ]; then
  /usr/bin/neofetch "$@" | sed "s/OS: .*/OS: \${CUSTOM_OS:-Ubuntu 24.04 LTS (Noble)} x86_64/" | sed "s/CPU: .*/CPU: \${CUSTOM_CPU_MODEL:-AMD Ryzen 9 7950X3D 16-Core Processor}/"
else
  echo -e "\x1b[32m\${USER}@\${HOSTNAME}\x1b[0m"
  echo "------------------"
  echo "OS: \${CUSTOM_OS:-Ubuntu 24.04 LTS (Noble)} x86_64"
  echo "Kernel: 6.8.0-45-generic"
  echo "CPU: \${CUSTOM_CPU_MODEL:-AMD Ryzen 9 7950X3D 16-Core Processor}"
  echo "Vendor: \${CUSTOM_CPU_VENDOR:-AuthenticAMD}"
  echo "Shell: bash"
fi
`);
  await fs.chmod(neofetchWrap, 0o755).catch(() => {});

  const unameWrap = path.join(binDir, "uname");
  await fs.writeFile(unameWrap, `#!/bin/bash
if [ "$1" = "-a" ] || [ "$1" = "-all" ]; then
  echo "Linux \${HOSTNAME:-spark} 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC Wed Oct 16 14:02:44 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux"
elif [ -z "$1" ]; then
  echo "Linux"
elif [ "$1" = "-r" ]; then
  echo "6.8.0-45-generic"
elif [ "$1" = "-m" ]; then
  echo "x86_64"
else
  /usr/bin/uname "$@"
fi
`);
  await fs.chmod(unameWrap, 0o755).catch(() => {});

  const lscpuWrap = path.join(binDir, "lscpu");
  await fs.writeFile(lscpuWrap, `#!/bin/bash
echo "Architecture:            x86_64"
echo "CPU op-mode(s):          32-bit, 64-bit"
echo "Address sizes:           48 bits physical, 48 bits virtual"
echo "Byte Order:              Little Endian"
echo "CPU(s):                  16"
echo "On-line CPU(s) list:     0-15"
echo "Vendor ID:               \${CUSTOM_CPU_VENDOR:-AuthenticAMD}"
echo "Model name:              \${CUSTOM_CPU_MODEL:-AMD Ryzen 9 7950X3D 16-Core Processor}"
echo "Thread(s) per core:      2"
echo "Core(s) per socket:      8"
echo "Socket(s):               1"
echo "Virtualization:          KVM/QEMU"
echo "Hypervisor vendor:       KVM"
echo "Virtualization type:     full"
`);
  await fs.chmod(lscpuWrap, 0o755).catch(() => {});

  const lsbWrap = path.join(binDir, "lsb_release");
  await fs.writeFile(lsbWrap, `#!/bin/bash
echo "No LSB modules are available."
echo "Distributor ID: Ubuntu"
echo "Description:    \${CUSTOM_OS:-Ubuntu 24.04 LTS}"
echo "Release:        24.04"
echo "Codename:       noble"
`);
  await fs.chmod(lsbWrap, 0o755).catch(() => {});

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
    return;
  }

  // 2. SUDO / SU SWITCHING
  if (trimmed === "sudo su" || trimmed === "sudo -i" || trimmed === "su" || trimmed === "su root" || trimmed === "su -") {
    session.user = "root";
    session.cwd = path.join(session.serverDir, "root");
    await fs.ensureDir(session.cwd);
    emitLog(`Switched to user root.`);
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
      emitLog(`exit`);
      emitPrompt();
      return;
    } else {
      emitLog(`logout`);
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
        emitLog(`bash: cd: ${target}: Not a directory`);
      }
    } catch {
      emitLog(`bash: cd: ${target}: No such file or directory`);
    }
    emitPrompt();
    return;
  }

  // 5. REAL BASH EXECUTION
  // Execute via real /bin/bash on the host environment
  const customCpu = server.cpuModel || "AMD Ryzen 9 7950X3D 16-Core Processor";
  const customVendor = server.cpuVendor || "AuthenticAMD";
  const customOs = server.osDistro || server.version || "Ubuntu 24.04 LTS (Noble)";
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
        CUSTOM_CPU_MODEL: customCpu,
        CUSTOM_CPU_VENDOR: customVendor,
        CUSTOM_OS: customOs,
        PATH: `${path.join(session.serverDir, "bin")}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
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
      emitLog(`bash: ${err.message}`);
      emitPrompt();
    });

    proc.on("close", () => {
      emitPrompt();
    });
  } catch (err: any) {
    emitLog(`bash: execution error: ${err.message}`);
    emitPrompt();
  }
};
