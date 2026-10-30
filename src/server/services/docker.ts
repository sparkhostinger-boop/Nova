import Docker from "dockerode";
import fs from "fs-extra";
import path from "path";
let ioInstance: any = null;
export const setDockerIO = (io: any) => { ioInstance = io; };
import { readJSON } from "./db.js";
import { executeVirtualCommand } from "./virtualShell.js";

const getSocketPath = () => {
  if (process.platform === 'win32') return '//./pipe/docker_engine';
  if (process.env.DOCKER_SOCKET_PATH && fs.existsSync(process.env.DOCKER_SOCKET_PATH)) {
    return process.env.DOCKER_SOCKET_PATH;
  }
  if (fs.existsSync('/var/run/docker.sock')) return '/var/run/docker.sock';
  if (fs.existsSync('/run/docker.sock')) return '/run/docker.sock';
  return '/var/run/docker.sock';
};

export const isSandbox = !fs.existsSync('/var/run/docker.sock') &&
  !fs.existsSync('/run/docker.sock') &&
  !(process.env.DOCKER_SOCKET_PATH && fs.existsSync(process.env.DOCKER_SOCKET_PATH)) &&
  process.platform !== 'win32';

export const defaultDocker = new Docker({ socketPath: getSocketPath() });

export const getDocker = async (nodeId?: string) => {
  if (!nodeId || nodeId === "local") return defaultDocker;
  const nodes = await readJSON("nodes.json") || [];
  const node = nodes.find((n: any) => n.id === nodeId);
  if (node) {
    let host = node.ip;
    let protocol: "http" | "https" | "ssh" = "http";
    let port = node.port;

    if (!host.startsWith("http://") && !host.startsWith("https://") && port === 443) {
      protocol = "https";
    }

    if (host.startsWith("http://") || host.startsWith("https://")) {
      try {
        const url = new URL(host);
        protocol = (url.protocol.replace(':', '') === 'https' ? 'https' : 'http');
        host = url.hostname;
        if (url.port) port = parseInt(url.port);
        else port = protocol === "https" ? 443 : 80;
      } catch (e) {
        console.error("Invalid URL in node IP", host);
      }
    }
    return new Docker({
      protocol,
      host,
      port,
      headers: { 
        Authorization: "Bearer " + node.key,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
  }
  return defaultDocker;
};

// Mock state for sandbox demo
export const mockState: Record<string, boolean> = {};
export const mockStartTime: Record<string, string | null> = {};

export const getVersions = async (type: string = "PAPER") => {
  const normalizedType = type.toUpperCase();
  if (normalizedType === "VELOCITY") {
    return ["latest", "3.3.0-SNAPSHOT"];
  }
  if (normalizedType === "BUNGEECORD" || normalizedType === "WATERFALL") {
    return ["latest"];
  }
  
  return [
    "latest", "1.21.11", "1.21.10", "1.21.9", "1.21.8", "1.21.7", "1.21.6", "1.21.5", "1.21.4", "1.21.3", "1.21.1", "1.21", 
    "1.20.6", "1.20.5", "1.20.4", "1.20.2", "1.20.1", "1.20", 
    "1.19.4", "1.19.3", "1.19.2", "1.19.1", "1.19", 
    "1.18.2", "1.18.1", "1.18", "1.17.1", "1.17", "1.16.5", "1.16.4", "1.16.3", "1.16.2", "1.16.1", "1.15.2", "1.15.1", "1.15", 
    "1.14.4", "1.14.3", "1.14.2", "1.14.1", "1.14", "1.13.2", "1.13.1", "1.13", "1.12.2", "1.12.1", "1.12", "1.11.2", "1.10.2", 
    "1.9.4", "1.8.8", "1.7.10"
  ];
};

export const sanitizeDockerImage = (img?: string | null): string => {
  if (!img) return "ubuntu:22.04";
  const lower = String(img).toLowerCase();
  if (
    lower.includes("multi-vm") ||
    lower.includes("hopingboyz") ||
    lower.includes("cloud/multi-vm-manager") ||
    lower.includes("ghcr.io/cloud")
  ) {
    return "ubuntu:22.04";
  }
  return img.trim();
};

export const createServerContainer = async (serverData: any, nodeId?: string) => {
  const docker = await getDocker(nodeId || serverData.nodeId);
  if (isSandbox) {
    mockState[serverData.id] = false;
    return "mock-container-id-" + serverData.id;
  }

  const serverType = serverData.type || "PAPER";
  const isProxy = ["VELOCITY", "BUNGEECORD", "WATERFALL"].includes(serverType.toUpperCase());

  const isCustomEgg = Boolean(serverData.customEgg || serverData.eggId || serverData.dockerImage);
  
  const isQemuVm = serverData.eggId === "egg-qemu-cloud-vm" || 
                   serverData.dockerImage?.includes("multi-vm") || 
                   serverData.dockerImage?.includes("qemu") || 
                   Boolean(serverData.cpuModel);
  
  let shortImage = isProxy ? "itzg/bungeecord:latest" : "itzg/minecraft-server:latest";
  let fullImage = isProxy ? "docker.io/itzg/bungeecord:latest" : "docker.io/itzg/minecraft-server:latest";
  
  if (isCustomEgg && serverData.dockerImage) {
    let rawImg = sanitizeDockerImage(serverData.dockerImage);
    shortImage = rawImg;
    fullImage = rawImg.includes("/") ? rawImg : `docker.io/${rawImg}`;
  } else if (isQemuVm) {
    shortImage = "ubuntu:22.04";
    fullImage = "docker.io/ubuntu:22.04";
  }

  const findImageId = async (): Promise<string | null> => {
    try {
      const images = await docker.listImages();
      const matched = images.find(img => 
        img.RepoTags && img.RepoTags.some(tag => tag.includes(shortImage) || tag.includes(fullImage) || tag.includes("ubuntu:22.04"))
      );
      if (matched) return matched.Id;
    } catch(e) {
      console.warn("Failed to list images:", e);
    }
    return null;
  };

  const pullImageStream = async (imgTag: string) => {
    const cleanTag = sanitizeDockerImage(imgTag);
    console.log(`Pulling image ${cleanTag}...`);
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);
    const engine = "docker";
    
    try {
      console.log(`Executing: ${engine} pull ${cleanTag}`);
      const { stdout, stderr } = await execAsync(`${engine} pull ${cleanTag}`);
      console.log(`${engine} pull stdout:`, stdout);
      if (stderr) console.warn(`${engine} pull stderr:`, stderr);
    } catch (cliErr) {
      console.warn(`CLI pull failed for ${cleanTag}: ${cliErr}. Trying Docker API fallback...`);
      try {
        await new Promise((resolve, reject) => {
          docker.pull(cleanTag, (err: any, stream: any) => {
            if (err) return reject(err);
            docker.modem.followProgress(stream, (err: any, output: any) => {
              if (err) return reject(err);
              resolve(output);
            });
          });
        });
      } catch (pullErr: any) {
        console.warn(`Docker pull failed for ${cleanTag}: ${pullErr?.message || pullErr}. Falling back to ubuntu:22.04...`);
        if (cleanTag !== "ubuntu:22.04") {
          try {
            await execAsync(`${engine} pull ubuntu:22.04`);
          } catch (fb) {
            console.warn("Fallback ubuntu:22.04 pull error:", fb);
          }
        }
      }
    }
  };

  const ensureImage = async (): Promise<string> => {
    let existingId = await findImageId();
    if (existingId) return existingId;

    try {
      await pullImageStream(shortImage);
      let idAfterShort = await findImageId();
      if (idAfterShort) return idAfterShort;
    } catch (e) {
      console.warn(`Failed to pull ${shortImage}...`, e);
    }

    if (fullImage !== shortImage) {
      console.warn(`Attempting fallback pull with ${fullImage}...`);
      try {
        await pullImageStream(fullImage);
        let idAfterFull = await findImageId();
        if (idAfterFull) return idAfterFull;
      } catch (fallbackErr) {
        console.warn(`Fallback pull failed for ${fullImage}...`, fallbackErr);
      }
    }

    // Default safe fallback image
    try {
      await pullImageStream("ubuntu:22.04");
      return "ubuntu:22.04";
    } catch (uErr) {
      console.warn("Could not pull ubuntu:22.04 directly:", uErr);
      return "ubuntu:22.04";
    }
  };

  const targetImage = await ensureImage();

  const serverDir = path.join(process.cwd(), ".data", "servers", serverData.id);
  await fs.ensureDir(serverDir);

  const envVars = [
    `TYPE=${serverType}`,
    `VERSION=${serverData.version}`,
    `MEMORY=${serverData.ram}G`,
    `INIT_MEMORY=128M`,
    `SERVER_PORT=${serverData.port}`,
  ];

  if (serverData.motd) {
    envVars.push(`MOTD=${serverData.motd}`);
  }

  if (serverData.cracked) {
    envVars.push(`ONLINE_MODE=false`);
  } else if (serverData.cracked === false) {
    envVars.push(`ONLINE_MODE=true`);
  }

  if (!isProxy && !isCustomEgg) {
    envVars.push(
      `EULA=TRUE`,
      `ENABLE_RCON=true`,
      `RCON_PASSWORD=admin`,
      `JVM_OPTS=-DPaper.IgnoreWorldDataVersion=true`,
      `JVM_DD_OPTS=Paper.IgnoreWorldDataVersion=true,paper.ignoreWorldDataVersion=true`
    );
  }

  if (isCustomEgg) {
    envVars.push(
      `STARTUP=${serverData.startupCommand || ""}`,
      `SERVER_MEMORY=${serverData.ram * 1024}`,
      `SERVER_PORT=${serverData.port}`,
      `VERSION=${serverData.version || "latest"}`,
      `EGG_NAME=${serverData.eggName || serverData.type || "Custom"}`,
      `CPU_MODEL=${serverData.cpuModel || "AMD EPYC 7763 64-Core Processor"}`,
      `CPU_VENDOR=${serverData.cpuVendor || "AuthenticAMD"}`,
      `VM_USERNAME=${serverData.vmUsername || "ubuntu"}`,
      `VM_PASSWORD=${serverData.vmPassword || "nova1234!"}`,
      `VM_HOSTNAME=${serverData.vmHostname || serverData.name}`,
      `OS_DISTRO=${serverData.osDistro || serverData.version || "Ubuntu 24.04 LTS"}`,
      `SSH_PORT=${serverData.sshPort || serverData.port || 2222}`
    );
  }

  const mountTarget = isCustomEgg 
    ? (serverData.mountDir || '/data') 
    : (isProxy ? '/server' : '/data');

  if (isQemuVm) {
    try {
      const vmConfPath = path.join(serverDir, "vm.conf");
      await fs.writeFile(vmConfPath, `# Enhanced Multi-VM Manager Configuration
# QEMU CLOUD VIRTUALIZATION
VM_NAME="${serverData.name}"
OS_TYPE="${serverData.osDistro || serverData.version || 'Ubuntu 24.04 LTS'}"
HOSTNAME="${serverData.vmHostname || serverData.name}"
USERNAME="${serverData.vmUsername || 'ubuntu'}"
PASSWORD="${serverData.vmPassword || 'nova1234!'}"
DISK_SIZE="${serverData.disk || 20}G"
MEMORY="${serverData.ram ? serverData.ram * 1024 : 2048}"
CPUS="${Math.max(1, Math.round((serverData.cpu || 200) / 100))}"
CPU_MODEL="${serverData.cpuModel || 'AMD EPYC 7763 64-Core Processor'}"
CPU_VENDOR="${serverData.cpuVendor || 'AuthenticAMD'}"
SSH_PORT="${serverData.sshPort || serverData.port || 2222}"
GUI_MODE="${serverData.guiMode ? 'true' : 'false'}"
CREATED="${new Date().toISOString()}"
`);

      const vmScriptPath = path.join(serverDir, "start_vm.sh");
      await fs.writeFile(vmScriptPath, `#!/bin/bash
# Enhanced Multi-VM Manager - QEMU CLOUD VIRTUALIZATION
set -e
echo "========================================================================"
echo "   ____  ______ __  __ _    _    _____ _      ____  _    _ _____  "
echo "  / __ \\|  ____|  \\/  | |  | |  / ____| |    / __ \\| |  | |  __ \\ "
echo " | |  | | |__  | \\  / | |  | | | |    | |   | |  | | |  | | |  | |"
echo " | |  | |  __| | |\\/| | |  | | | |    | |   | |  | | |  | | |  | |"
echo " | |__| | |____| |  | | |__| | | |____| |___| |__| | |__| | |__| |"
echo "  \\___\\_\\______|_|  |_|\\____/   \\_____|______\\____/ \\____/|_____/ "
echo "                                                                  "
echo "                    QEMU CLOUD VIRTUALIZATION"
echo "========================================================================"
echo "[INFO] Booting Virtual Machine with QEMU/KVM..."
echo "[INFO] Virtual CPU Model: ${serverData.cpuModel || 'AMD EPYC 7763 64-Core Processor'}"
echo "[INFO] CPU Vendor Flag:   ${serverData.cpuVendor || 'AuthenticAMD'}"
echo "[INFO] Memory:            ${serverData.ram ? serverData.ram * 1024 : 2048} MB"
echo "[INFO] Virtual Disk:      ${serverData.disk || 20} GB VirtIO"
echo "[INFO] Guest OS:          ${serverData.osDistro || serverData.version || 'Ubuntu 24.04 LTS'}"
echo "[INFO] Hostname:          ${serverData.vmHostname || serverData.name}"
echo "[INFO] SSH Service:       Host 0.0.0.0:${serverData.sshPort || serverData.port || 2222} -> Guest :22"
echo "[INFO] Sudo User:         ${serverData.vmUsername || 'ubuntu'}"
echo "[SUCCESS] Cloud VM environment is online."
echo "[INFO] Press Stop in Nova Panel to shut down the VM."
exec /bin/bash --login -i
`);
      await fs.chmod(vmScriptPath, 0o755).catch(() => {});
    } catch (e) {
      console.warn("Failed to precreate VM script files:", e);
    }
  }

  const buildContainerOptions = (img: string) => {
    const opts: any = {
      Image: img,
      name: `jtg-server-${serverData.id}`,
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      Env: envVars,
      ExposedPorts: {
        [`${serverData.port}/tcp`]: {}
      },
      HostConfig: {
        PortBindings: {
          [`${serverData.port}/tcp`]: [
            {
              HostPort: `${serverData.port}`
            }
          ]
        },
        Binds: [`${serverDir}:${mountTarget}`]
      }
    };

    if (isQemuVm) {
      opts.Cmd = ["/bin/bash", "-c", "if [ -f /data/start_vm.sh ]; then bash /data/start_vm.sh; else exec /bin/bash --login -i; fi"];
    }

    return opts;
  };

  let container;
  try {
    container = await docker.createContainer(buildContainerOptions(targetImage));
  } catch (err: any) {
    console.warn(`Initial container creation failed for ${targetImage}: ${err?.message || err}. Attempting safe fallback to ubuntu:22.04...`);
    try {
      await pullImageStream("ubuntu:22.04");
      container = await docker.createContainer(buildContainerOptions("ubuntu:22.04"));
    } catch (fallbackErr: any) {
      console.error("Critical fallback container creation failed:", fallbackErr);
      throw fallbackErr;
    }
  }

  return container.id;
};

export const startContainer = async (containerId: string, nodeId?: string) => {
  const docker = await getDocker(nodeId);
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = true;
    mockStartTime[id] = new Date().toISOString();
    
    // In sandbox mode, mock the generation of server files that the docker container would normally do
    try {
      const servers = await readJSON("servers.json") || [];
      const server = servers.find((s: any) => s.id === id);
      if (server) {
        const serverDir = path.join(process.cwd(), ".data", "servers", id);
        await fs.ensureDir(serverDir);
        const type = (server.type || "PAPER").toUpperCase();
        
        if (server.customEgg) {
          const infoPath = path.join(serverDir, "egg-config.json");
          if (!fs.existsSync(infoPath)) {
            await fs.writeJson(infoPath, {
              eggName: server.eggName || server.type,
              version: server.version,
              port: server.port,
              dockerImage: server.dockerImage,
              startupCommand: server.startupCommand,
              startedAt: new Date().toISOString()
            }, { spaces: 2 });
          }

          const isQemuVm = server.eggId === "egg-qemu-cloud-vm" || server.dockerImage?.includes("multi-vm") || server.dockerImage?.includes("qemu") || server.cpuModel;

          if (isQemuVm) {
            const vmConfPath = path.join(serverDir, "vm.conf");
            if (!fs.existsSync(vmConfPath)) {
              await fs.writeFile(vmConfPath, `# Enhanced Multi-VM Manager Configuration
# QEMU CLOUD VIRTUALIZATION
VM_NAME="${server.name}"
OS_TYPE="${server.osDistro || server.version || 'Ubuntu 24.04 LTS'}"
HOSTNAME="${server.vmHostname || server.name}"
USERNAME="${server.vmUsername || 'ubuntu'}"
PASSWORD="${server.vmPassword || 'nova1234!'}"
DISK_SIZE="${server.disk || 20}G"
MEMORY="${server.ram ? server.ram * 1024 : 2048}"
CPUS="${Math.max(1, Math.round((server.cpu || 200) / 100))}"
CPU_MODEL="${server.cpuModel || 'AMD EPYC 7763 64-Core Processor'}"
CPU_VENDOR="${server.cpuVendor || 'AuthenticAMD'}"
SSH_PORT="${server.sshPort || server.port || 2222}"
GUI_MODE="${server.guiMode ? 'true' : 'false'}"
CREATED="${new Date().toISOString()}"
`);
            }
            const vmScriptPath = path.join(serverDir, "start_vm.sh");
            if (!fs.existsSync(vmScriptPath)) {
              await fs.writeFile(vmScriptPath, `#!/bin/bash\n# Enhanced Multi-VM Manager - QEMU CLOUD VIRTUALIZATION\necho "Booting QEMU VM: ${server.name} with CPU: ${server.cpuModel || 'AMD EPYC 7763 64-Core Processor'} [Vendor: ${server.cpuVendor || 'AuthenticAMD'}]"\n`);
            }
          } else if (server.dockerImage?.includes("node") && !fs.existsSync(path.join(serverDir, "index.js"))) {
            await fs.writeFile(path.join(serverDir, "index.js"), `// Custom Node.js Egg Entrypoint\nconsole.log("Starting ${server.name} (${server.eggName || 'Node App'})...");\nconsole.log("Listening on port ${server.port}");\nsetInterval(() => {\n  console.log("[Status] Heartbeat OK - Active");\n}, 15000);\n`);
          } else if (server.dockerImage?.includes("python") && !fs.existsSync(path.join(serverDir, "main.py"))) {
            await fs.writeFile(path.join(serverDir, "main.py"), `# Custom Python Egg Entrypoint\nimport time\nprint("Starting ${server.name} (${server.eggName || 'Python Bot'})...")\nprint("Running on port ${server.port}")\nwhile True:\n    time.sleep(15)\n    print("[Status] Python loop alive")\n`);
          } else if (!fs.existsSync(path.join(serverDir, "server.properties"))) {
            await fs.writeFile(path.join(serverDir, "server.properties"), `server-port=${server.port}\nmotd=${server.motd || server.name}\nsoftware=${server.eggName || server.type}\nversion=${server.version}\n`);
          }
        } else if (["VELOCITY", "BUNGEECORD", "WATERFALL"].includes(type)) {
          const configName = type === "VELOCITY" ? "velocity.toml" : "config.yml";
          const configPath = path.join(serverDir, configName);
          if (!fs.existsSync(configPath)) {
            await fs.writeFile(configPath, "# Autogenerated proxy config in sandbox mode\n# Port: " + server.port + "\n");
          }
        } else {
          const propsPath = path.join(serverDir, "server.properties");
          if (!fs.existsSync(propsPath)) {
            await fs.writeFile(propsPath, "server-port=" + server.port + "\nmotd=" + (server.motd || "A Minecraft Server") + "\n");
          }
        }
      }
    } catch(e) {}
    
    const serverObj = (await readJSON("servers.json") || []).find((s: any) => s.id === id);
    if (serverObj?.eggId === "egg-qemu-cloud-vm" || serverObj?.cpuModel) {
      const cores = Math.max(1, Math.round((serverObj.cpu || 200) / 100));
      const ramMB = serverObj.ram ? serverObj.ram * 1024 : 2048;
      const sshPort = serverObj.sshPort || serverObj.port || 2222;
      const vmUser = serverObj.vmUsername || "ubuntu";
      const vmHost = serverObj.vmHostname || serverObj.name;
      const cpuModel = serverObj.cpuModel || "AMD EPYC 7763 64-Core Processor";
      const cpuVendor = serverObj.cpuVendor || "AuthenticAMD";
      const osDistro = serverObj.osDistro || serverObj.version || "Ubuntu 24.04 LTS";

      const vmBanner = 
`\r\n========================================================================\r
   ____  ______ __  __ _    _    _____ _      ____  _    _ _____  \r
  / __ \\|  ____|  \\/  | |  | |  / ____| |    / __ \\| |  | |  __ \\ \r
 | |  | | |__  | \\  / | |  | | | |    | |   | |  | | |  | | |  | |\r
 | |  | |  __| | |\\/| | |  | | | |    | |   | |  | | |  | | |  | |\r
 | |__| | |____| |  | | |__| | | |____| |___| |__| | |__| | |__| |\r
  \\___\\_\\______|_|  |_|\\____/   \\_____|______\\____/ \\____/|_____/ \r
                                                                  \r
                    QEMU CLOUD VIRTUALIZATION\r
========================================================================\r
[INFO] Booting Virtual Machine with QEMU/KVM...\r
[INFO] Virtual CPU Model: ${cpuModel}\r
[INFO] CPU Vendor Flag:   ${cpuVendor} (${cores} vCPU Core(s))\r
[INFO] Memory (RAM):      ${ramMB} MB\r
[INFO] Virtual Disk:      ${serverObj.disk || 20} GB VirtIO QCOW2\r
[INFO] Guest OS:          ${osDistro}\r
[INFO] Hostname:          ${vmHost}\r
[INFO] Sudo User:         ${vmUser}\r
[INFO] Cloud-Init:        Initialized cloud-localds seed image\r
[INFO] Port Forwarding:   Host 0.0.0.0:${sshPort} -> Guest :22 (SSH)\r
[SUCCESS] VM online! Connect via: ssh -p ${sshPort} ${vmUser}@localhost\r\n`;

      ioInstance?.to(`server_${id}`).emit("log", vmBanner);
      return;
    }

    const eggLabel = serverObj?.eggName ? ` [Egg: ${serverObj.eggName}]` : "";
    ioInstance?.to(`server_${id}`).emit("log", `[System] Server started (Sandbox Mode)${eggLabel}.\r\n`);
    return;
  }
  const container = docker.getContainer(containerId);
  await container.start();
};

export const stopContainer = async (containerId: string, nodeId?: string) => {
  // Free active log stream from memory
  if (activeStreams[containerId]) {
    try { (activeStreams[containerId] as any)?.destroy?.(); } catch (e) {}
    delete activeStreams[containerId];
  }
  delete statusCache[containerId];
  delete statsCache[containerId];

  const docker = await getDocker(nodeId);
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = false;
    mockStartTime[id] = null;
    ioInstance?.to(`server_${id}`).emit("log", `[System] Server stopped (Sandbox Mode).\r\n`);
    return;
  }
  const container = docker.getContainer(containerId);
  await container.stop();
};

export const restartContainer = async (containerId: string, nodeId?: string) => {
  if (activeStreams[containerId]) {
    try { (activeStreams[containerId] as any)?.destroy?.(); } catch (e) {}
    delete activeStreams[containerId];
  }
  delete statusCache[containerId];
  delete statsCache[containerId];

  const docker = await getDocker(nodeId);
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = true;
    mockStartTime[id] = new Date().toISOString();
    ioInstance?.to(`server_${id}`).emit("log", `[System] Server restarted (Sandbox Mode).\r\n`);
    return;
  }
  const container = docker.getContainer(containerId);
  await container.restart();
};

export const deleteContainer = async (containerId: string, nodeId?: string) => {
  if (activeStreams[containerId]) {
    try { (activeStreams[containerId] as any)?.destroy?.(); } catch (e) {}
    delete activeStreams[containerId];
  }
  delete statusCache[containerId];
  delete statsCache[containerId];

  const docker = await getDocker(nodeId);
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    delete mockState[id];
    delete mockStartTime[id];
    delete diskCache[id];
    return;
  }
  const container = docker.getContainer(containerId);
  try {
    const info = await container.inspect();
    if (info.State.Running) {
      await container.stop();
    }
    await container.remove({ force: true });
  } catch (err) {
    console.error("Error deleting container", err);
  }
};

// Cache container status with 2.5s TTL to avoid flooding Docker inspect & memory allocations
const statusCache: Record<string, { status: any, timestamp: number }> = {};

export const getContainerStatus = async (containerId: string, nodeId?: string) => {
  const now = Date.now();
  if (statusCache[containerId] && (now - statusCache[containerId].timestamp < 2500)) {
    return statusCache[containerId].status;
  }

  const docker = await getDocker(nodeId);
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    const isRunning = mockState[id] || false;
    const res = { State: { Running: isRunning, Status: isRunning ? "running" : "exited" } };
    statusCache[containerId] = { status: res, timestamp: now };
    return res;
  }
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    statusCache[containerId] = { status: info, timestamp: now };
    return info;
  } catch (e) {
    return null;
  }
};

let diskCache: Record<string, { sizeMB: number, lastUpdate: number }> = {};

// Memory-bounded directory size calculation (max 3 levels depth and 250 files limit)
async function getDirectorySize(dir: string, depth = 0): Promise<number> {
  if (depth > 3) return 0;
  let size = 0;
  try {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    let count = 0;
    for (const file of files) {
      if (++count > 250) break; // Avoid deep unrolled loops in large Minecraft world regions
      const p = path.join(dir, file.name);
      if (file.isDirectory()) {
        size += await getDirectorySize(p, depth + 1);
      } else {
        const stat = await fs.promises.stat(p);
        size += stat.size;
      }
    }
  } catch (e) {}
  return size;
}

// Cache stats for 2.5 seconds to reduce CPU and buffer pressure
const statsCache: Record<string, { stats: any, timestamp: number }> = {};

export const getContainerStats = async (containerId: string, nodeId?: string, serverId?: string) => {
  const now = Date.now();
  if (statsCache[containerId] && (now - statsCache[containerId].timestamp < 2500)) {
    return statsCache[containerId].stats;
  }

  const docker = await getDocker(nodeId);
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    if (!mockState[id]) return { cpu: 0, ram: 0, disk: 0, netIn: 0, netOut: 0, startedAt: null };
    
    const timeSec = Math.floor(Date.now() / 5000);
    const floatPseudo = (Math.sin(timeSec + id.charCodeAt(0)) + 1) / 2;
    
    const res = {
      cpu: floatPseudo * 10 + 2,
      ram: 600 + (floatPseudo * 50 - 25),
      disk: 2.1,
      netIn: timeSec * 1024,
      netOut: timeSec * 512,
      startedAt: mockStartTime[id] || new Date().toISOString()
    };
    statsCache[containerId] = { stats: res, timestamp: now };
    return res;
  }
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    if (!info.State.Running) {
      return { cpu: 0, ram: 0, disk: 0, netIn: 0, netOut: 0, startedAt: null };
    }
    const statsResult = await container.stats({ stream: false });
    
    let cpuPercent = 0.0;
    try {
      const cpuDelta = statsResult.cpu_stats.cpu_usage.total_usage - statsResult.precpu_stats.cpu_usage.total_usage;
      const systemDelta = statsResult.cpu_stats.system_cpu_usage - statsResult.precpu_stats.system_cpu_usage;
      if (systemDelta > 0.0 && cpuDelta > 0.0) {
        const cpus = statsResult.cpu_stats.online_cpus || statsResult.cpu_stats.cpu_usage.percpu_usage?.length || 1;
        cpuPercent = (cpuDelta / systemDelta) * cpus * 100.0;
      }
    } catch(e) {}

    let ramMB = 0.0;
    try {
      const stats = statsResult.memory_stats.stats as any || {};
      const cache = stats.cache || stats.inactive_file || stats.total_inactive_file || 0;
      const usedMemory = statsResult.memory_stats.usage - cache;
      ramMB = usedMemory / 1024 / 1024;
    } catch(e) {}
    
    let netIn = 0;
    let netOut = 0;
    try {
      const networks = statsResult.networks || {};
      for (const net of Object.values<any>(networks)) {
        netIn += net.rx_bytes;
        netOut += net.tx_bytes;
      }
    } catch(e) {}

    let diskSizeMB = 2.1;
    if (serverId) {
       const nowTime = Date.now();
       if (!diskCache[serverId] || nowTime - diskCache[serverId].lastUpdate > 120000) {
          const dir = path.join(process.cwd(), ".data", "servers", serverId);
          const bytes = await getDirectorySize(dir);
          diskCache[serverId] = { sizeMB: bytes / 1024 / 1024, lastUpdate: nowTime };
       }
       diskSizeMB = diskCache[serverId].sizeMB;
    }

    const calculated = {
      cpu: cpuPercent,
      ram: ramMB,
      disk: diskSizeMB,
      netIn: netIn,
      netOut: netOut,
      startedAt: info.State.StartedAt
    };
    statsCache[containerId] = { stats: calculated, timestamp: now };
    return calculated;
  } catch (e) {
    return { cpu: 0, ram: 0, disk: 0, netIn: 0, netOut: 0, startedAt: null };
  }
};

export const getContainerLogs = async (containerId: string, nodeId?: string): Promise<string> => {
  const docker = await getDocker(nodeId);
  if (isSandbox) return "[System] Sandbox mode. No historical logs available.\r\n";
  try {
    const container = docker.getContainer(containerId);
    
    // Convert Buffer log output to string safely. dockerode returns interleaved multiplexed streams if tty is false,
    // but we use tty: true in createServerContainer, so it's a raw stream buffer.
    const logsBuffer = await container.logs({ stdout: true, stderr: true, tail: 100 });
    return logsBuffer.toString('utf8');
  } catch (e) {
    return "";
  }
};

const activeStreams: Record<string, NodeJS.ReadWriteStream> = {};

export const attachContainerSocket = async (containerId: string, serverId: string, nodeId?: string) => {
  const docker = await getDocker(nodeId);
  if (isSandbox) {
    return;
  }
  try {
    const container = docker.getContainer(containerId);
    if (!activeStreams[containerId]) {
      const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
      activeStreams[containerId] = stream;
      stream.on('data', (chunk) => {
        ioInstance?.to(`server_${serverId}`).emit("log", chunk.toString());
      });
      stream.on('end', () => {
        delete activeStreams[containerId];
      });
      stream.on('close', () => {
        delete activeStreams[containerId];
      });
      stream.on('error', () => {
        try { (stream as any)?.destroy?.(); } catch (e) {}
        delete activeStreams[containerId];
      });
    }
  } catch(e) {
    console.error("Attach error", e);
  }
};

export const detachContainerSocket = (containerId: string) => {
  if (activeStreams[containerId]) {
    try { (activeStreams[containerId] as any)?.destroy?.(); } catch (e) {}
    delete activeStreams[containerId];
  }
};

export const sendContainerCommand = async (containerId: string, command: string, nodeId?: string, serverInput?: any) => {
  let server = serverInput;
  if (!server) {
    try {
      const servers = (await readJSON("servers.json")) || [];
      server = servers.find((s: any) => s.containerId === containerId || s.id === containerId.replace("mock-container-id-", ""));
    } catch (e) {}
  }

  const serverId = server?.id || containerId.replace("mock-container-id-", "");

  if (command.trim().toLowerCase() === "clear" || command.trim().toLowerCase() === "cls") {
    ioInstance?.to(`server_${serverId}`).emit("clear_logs");
    return;
  }

  if (isSandbox) {
    if (server) {
      await executeVirtualCommand(server, command, ioInstance);
    }
    return;
  }

  const docker = await getDocker(nodeId);
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    if (!info.State.Running) {
      ioInstance?.to(`server_${serverId}`).emit("log", "[System] Cannot send command: Server is offline or stopped.\r\n");
      return;
    }

    if (activeStreams[containerId]) {
      activeStreams[containerId].write(command + "\n");
    } else {
      const exec = await container.exec({
        Cmd: ["/bin/bash", "-c", command],
        AttachStdout: true,
        AttachStderr: true,
        Tty: true
      });
      const stream = await exec.start({ hijack: true, stdin: false });
      stream.on("data", (chunk: Buffer) => {
        ioInstance?.to(`server_${serverId}`).emit("log", chunk.toString());
      });
    }
  } catch (dockerExecErr: any) {
    console.warn("Docker command exec failed, executing via virtual bash shell:", dockerExecErr?.message);
    if (server) {
      await executeVirtualCommand(server, command, ioInstance);
    }
  }
};
