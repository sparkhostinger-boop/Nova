import "dotenv/config";
import bcrypt from "bcryptjs";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(PROJECT_ROOT, ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

fs.ensureDirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]");
}

const handleUserCreation = async (rawUser: string, rawPass: string) => {
  const username = String(rawUser || "").replace(/[\r\n]/g, "").trim();
  const password = String(rawPass || "").replace(/[\r\n]/g, "").trim();

  if (!username || !password) {
    console.error("Username and password are required.");
    process.exit(1);
  }

  let users: any[] = [];
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    users = JSON.parse(raw || "[]");
    if (!Array.isArray(users)) users = [];
  } catch (e) {
    users = [];
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const existingIndex = users.findIndex(
    (u: any) => String(u.username || "").toLowerCase() === username.toLowerCase()
  );

  if (existingIndex !== -1) {
    users[existingIndex].username = username;
    users[existingIndex].password = hashedPassword;
    users[existingIndex].rawPassword = password;
    users[existingIndex].role = "admin";
    users[existingIndex].passwordVersion = (users[existingIndex].passwordVersion || 0) + 1;
    if (!users[existingIndex].email) {
      users[existingIndex].email = `${username}@novapanel.local`;
    }
    await fs.writeJson(USERS_FILE, users, { spaces: 2 });
    console.log(`Admin user '${username}' updated successfully.`);
    process.exit(0);
  } else {
    users.push({
      id: "admin-" + Date.now().toString(),
      username,
      email: `${username}@novapanel.local`,
      password: hashedPassword,
      rawPassword: password,
      role: "admin",
      passwordVersion: 0,
      createdAt: new Date().toISOString()
    });

    await fs.writeJson(USERS_FILE, users, { spaces: 2 });
    console.log(`Admin user '${username}' created successfully.`);
    process.exit(0);
  }
};

// Check if username and password were provided via command line arguments
const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
if (args.length >= 2) {
  handleUserCreation(args[0], args[1]);
} else {
  console.log("=== Nova Panel Admin User Creation ===");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Username: ", (username) => {
    rl.question("Password: ", (password) => {
      rl.close();
      handleUserCreation(username, password);
    });
  });
}
