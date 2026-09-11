#!/bin/bash

# =========================================================
# Nova Panel - Automated Installation & Management Script
# Repository: https://github.com/sparkhostinger-boop/Nova
# =========================================================

set -e

# Colors for UI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_banner() {
    clear
    echo -e "${CYAN}${BOLD}"
    echo "  ========================================================"
    echo "   _   _  ______      __ ___       _____  ___   _   _ _____ _     "
    echo "  | \ | |/ __ \ \    / // _ \     |  __ \/ _ \ | \ | |  ___| |    "
    echo "  |  \| | |  | \ \  / // /_\ \    | |__) / /_\ \|  \| | |__ | |    "
    echo "  | . \` | |  | |\ \/ / |  _  |    |  ___/|  _  || . \` |  __|| |    "
    echo "  | |\  | |__| | \  /  | | | |    | |    | | | || |\  | |___| |____"
    echo "  \_| \_/\____/   \/   \_| |_/    |_|    \_| |_/\_| \_/\____/\_____|"
    echo "                                                          "
    echo "            NOVA PANEL MANAGEMENT & INSTALLER             "
    echo "            Main Panel Default Port: 6767                 "
    echo "  ========================================================"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_warning "This script is recommended to be run as root or with sudo."
    fi
}

install_panel() {
    print_banner
    echo -e "${BOLD}--- [1] Full Panel Installation ---${NC}\n"

    check_root
    log_info "Checking system environment and updating package repositories..."

    # Auto-repair broken dpkg / apt state if apt exists
    if command -v apt-get &> /dev/null; then
        sudo dpkg --configure -a 2>/dev/null || true
        sudo apt-get install -f -y 2>/dev/null || true
        sudo apt-get update -y || true
        sudo apt-get install -y curl git build-essential ca-certificates tar xz-utils ufw || log_warning "Some system packages failed to install, continuing..."
    elif command -v yum &> /dev/null; then
        sudo yum update -y || true
        sudo yum install -y curl git make gcc-c++ ca-certificates tar xz || log_warning "Some system packages failed to install, continuing..."
    fi

    # Ensure Node.js is installed and version is >= 20.18
    NEED_NODE_UPGRADE=0
    if ! command -v node &> /dev/null; then
        NEED_NODE_UPGRADE=1
    else
        NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
        NODE_MINOR=$(node -v | cut -d'.' -f2)
        if [ "$NODE_MAJOR" -lt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 18 ]; }; then
            NEED_NODE_UPGRADE=1
        fi
    fi

    if [ "$NEED_NODE_UPGRADE" -eq 1 ]; then
        log_info "Installing / Upgrading to Node.js 22.x LTS..."
        
        # Try Nodesource first
        if command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - 2>/dev/null || true
            sudo apt-get install -y nodejs 2>/dev/null || true
        fi

        # Check if node upgraded properly
        CURRENT_NODE_MAJOR=0
        if command -v node &> /dev/null; then
            CURRENT_NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
        fi

        # Fallback to direct Node.js v22 binary installation if apt/nodesource failed
        if [ "$CURRENT_NODE_MAJOR" -lt 20 ]; then
            log_info "Installing Node.js 22.13.1 directly from official binary tarball..."
            ARCH=$(uname -m)
            case "$ARCH" in
                x86_64) NODE_ARCH="x64" ;;
                aarch64) NODE_ARCH="arm64" ;;
                armv7l) NODE_ARCH="armv7l" ;;
                *) NODE_ARCH="x64" ;;
            esac
            
            NODE_DIST="node-v22.13.1-linux-${NODE_ARCH}"
            curl -fsSL "https://nodejs.org/dist/v22.13.1/${NODE_DIST}.tar.xz" -o /tmp/node22.tar.xz || true
            if [ -f "/tmp/node22.tar.xz" ]; then
                sudo tar -xJf /tmp/node22.tar.xz -C /usr/local --strip-components=1 2>/dev/null || tar -xJf /tmp/node22.tar.xz -C /usr/local --strip-components=1 2>/dev/null || true
                rm -f /tmp/node22.tar.xz
            fi
        fi
    fi

    if command -v node &> /dev/null; then
        log_success "Node.js $(node -v) and npm $(npm -v) are ready."
    else
        log_error "Node.js installation could not be completed automatically. Please install Node.js 20+ manually."
        return 1
    fi
    
    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        log_info "Installing PM2 process manager..."
        sudo npm install -g pm2 || npm install -g pm2 || true
    fi

    # Ensure PM2 is symlinked to /usr/bin/pm2 and /usr/local/bin/pm2 for all users
    NPM_BIN_PATH=$(npm bin -g 2>/dev/null || echo "/usr/local/bin")
    if [ -f "$NPM_BIN_PATH/pm2" ]; then
        sudo ln -sf "$NPM_BIN_PATH/pm2" /usr/bin/pm2 2>/dev/null || true
        sudo ln -sf "$NPM_BIN_PATH/pm2" /usr/local/bin/pm2 2>/dev/null || true
    fi
    if [ -f "/usr/local/lib/node_modules/pm2/bin/pm2" ]; then
        sudo ln -sf /usr/local/lib/node_modules/pm2/bin/pm2 /usr/bin/pm2 2>/dev/null || true
    fi
    if [ -f "/usr/lib/node_modules/pm2/bin/pm2" ]; then
        sudo ln -sf /usr/lib/node_modules/pm2/bin/pm2 /usr/bin/pm2 2>/dev/null || true
    fi

    # Docker Setup
    log_info "Checking Docker installation for containerized server support..."
    if ! command -v docker &> /dev/null; then
        log_info "Installing Docker Engine..."
        curl -fsSL https://get.docker.com | sh || true
        if command -v systemctl &> /dev/null; then
            sudo systemctl enable --now docker 2>/dev/null || true
        fi
    else
        log_success "Docker is already installed ($(docker --version))."
    fi

    log_info "Downloading and setting up Nova Panel..."
    
    # Check if we are already inside the cloned repository directory
    if [ -f "package.json" ] && (grep -q "Nova" "package.json" 2>/dev/null || grep -q "react-example" "package.json" 2>/dev/null); then
        log_info "Running setup in current directory ($(pwd))..."
        WORK_DIR="."
    elif [ -d "Nova" ]; then
        log_info "The 'Nova' folder already exists. Running setup inside it..."
        WORK_DIR="Nova"
    elif [ -d "Jtg" ]; then
        log_info "Found existing 'Jtg' directory. Renaming to 'Nova'..."
        mv Jtg Nova
        WORK_DIR="Nova"
    else
        log_info "Cloning from GitHub repository (https://github.com/sparkhostinger-boop/Nova)..."
        git clone https://github.com/sparkhostinger-boop/Nova.git Nova || git clone https://github.com/sparkhostinger-boop/Nova Nova
        WORK_DIR="Nova"
    fi
    
    # Navigate into the directory
    cd "$WORK_DIR" || { log_error "Failed to enter the directory $WORK_DIR!"; return 1; }
    
    # Port selection prompt
    read -p " Enter panel web port [default: 6767]: " INPUT_PORT
    PANEL_PORT="${INPUT_PORT:-6767}"

    # Ensure .env exists
    log_info "Configuring environment settings (.env)..."
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
        fi
        echo "PORT=${PANEL_PORT}" >> .env
        echo "HOST=::" >> .env
        echo "JWT_SECRET=$(head -c 32 /dev/urandom | base64 2>/dev/null || date +%s%N | sha256sum | base64 | head -c 32)" >> .env
    else
        # Update or add PORT in existing .env
        if grep -q "^PORT=" .env; then
            sed -i "s/^PORT=.*/PORT=${PANEL_PORT}/" .env
        else
            echo "PORT=${PANEL_PORT}" >> .env
        fi
        if ! grep -q "^HOST=" .env; then
            echo "HOST=::" >> .env
        fi
    fi
    
    # Ensure ecosystem.config.cjs exists for PM2
    log_info "Configuring PM2 ecosystem file..."
cat << EOF > ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "nova-panel",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1024M",
      env: {
        NODE_ENV: "production",
        PORT: ${PANEL_PORT}
      }
    }
  ]
};
EOF

    log_info "Installing project dependencies..."
    npm install
    
    log_info "Compiling and building production assets..."
    npm run build
    
    log_info "Setting up initial Administrator credentials..."
    npm run createuser || echo "Skipping user creation if terminal is non-interactive."
    
    # Fix ownership to prevent EACCES errors if script was run with sudo previously
    if [ "$EUID" -eq 0 ] && [ -n "$SUDO_USER" ]; then
        log_info "Fixing directory permissions for $SUDO_USER..."
        chown -R "$SUDO_USER:$SUDO_USER" .
    fi

    # Allow port in UFW firewall if active
    if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
        log_info "Opening firewall port ${PANEL_PORT}..."
        sudo ufw allow "${PANEL_PORT}/tcp" || true
    fi

    log_info "Starting Nova Panel with PM2..."
    
    # Force pm2 to reload with the new env 
    npx pm2 start ecosystem.config.cjs --update-env || npx pm2 restart nova-panel --update-env
    npx pm2 save || true

    # Configure PM2 startup hook so panel runs automatically on reboot
    if command -v pm2 &> /dev/null; then
        sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || pm2 startup 2>/dev/null || true
    fi
    
    SERVER_IP=$(curl -s https://api.ipify.org 2>/dev/null || curl -s https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    
    echo ""
    log_success "=========================================================="
    log_success " Nova Panel has been successfully installed and started!"
    log_success " Access URL : http://${SERVER_IP}:${PANEL_PORT}"
    log_success " Process    : pm2 logs nova-panel"
    log_success "=========================================================="
    echo ""
    
    # Return to the previous directory if we entered a subfolder
    if [ "$WORK_DIR" = "Nova" ]; then
        cd ..
    fi
}

update_panel() {
    print_banner
    echo -e "${BOLD}--- [2] Update Nova Panel ---${NC}\n"
    
    if [ -f "package.json" ] && (grep -q "Nova" "package.json" 2>/dev/null || grep -q "react-example" "package.json" 2>/dev/null); then
        WORK_DIR="."
    elif [ -d "Nova" ]; then
        WORK_DIR="Nova"
    elif [ -d "Jtg" ]; then
        mv Jtg Nova
        WORK_DIR="Nova"
    else
        log_error "'Nova' directory not found! Please run the installer (Option 1)."
        return 1
    fi
    
    cd "$WORK_DIR" || { log_error "Failed to enter directory $WORK_DIR!"; return 1; }
        
    log_info "Pulling latest updates from GitHub..."
    git stash || true
    git pull origin main || git pull origin master || git pull
    
    log_info "Updating dependencies..."
    npm install
    
    log_info "Rebuilding production assets..."
    npm run build 
    
    log_info "Restarting Nova Panel process..."
    npx pm2 restart nova-panel || npx pm2 restart all
    
    log_success "Nova Panel successfully updated and restarted!"
    
    if [ "$WORK_DIR" = "Nova" ]; then
        cd ..
    fi
}

create_admin_user() {
    print_banner
    echo -e "${BOLD}--- [3] Create Admin User ---${NC}\n"
    
    if [ -f "package.json" ] && (grep -q "Nova" "package.json" 2>/dev/null || grep -q "react-example" "package.json" 2>/dev/null); then
        WORK_DIR="."
    elif [ -d "Nova" ]; then
        WORK_DIR="Nova"
    else
        log_error "'Nova' directory not found!"
        return 1
    fi
    
    cd "$WORK_DIR" || { log_error "Failed to enter directory $WORK_DIR!"; return 1; }
    
    log_info "Launching admin user creation prompt..."
    npm run createuser
    
    if [ "$WORK_DIR" = "Nova" ]; then
        cd ..
    fi
    log_success "User prompt completed!"
}

restart_panel() {
    print_banner
    echo -e "${BOLD}--- [4] Restart Nova Panel ---${NC}\n"
    
    log_info "Restarting Nova Panel process..."
    if command -v pm2 &> /dev/null || npx pm2 -v &> /dev/null; then
        npx pm2 restart nova-panel || npx pm2 restart all
        log_success "Nova Panel restarted successfully!"
    else
        log_error "PM2 is not installed or available."
    fi
}

# Main menu loop
while true; do
    print_banner
    echo -e "  ${BOLD}1)${NC} Install Nova Panel (Auto Setup - Port 6767)"
    echo -e "  ${BOLD}2)${NC} Update Nova Panel"
    echo -e "  ${BOLD}3)${NC} Create Admin User"
    echo -e "  ${BOLD}4)${NC} Restart Nova Panel"
    echo -e "  ${BOLD}5)${NC} Exit"
    echo -e "\n========================================================"
    read -p " Choose an option (1-5): " CHOICE

    case "$CHOICE" in
        1)
            install_panel
            read -p "Press Enter to return to main menu..."
            ;;
        2)
            update_panel
            read -p "Press Enter to return to main menu..."
            ;;
        3)
            create_admin_user
            read -p "Press Enter to return to main menu..."
            ;;
        4)
            restart_panel
            read -p "Press Enter to return to main menu..."
            ;;
        5)
            echo -e "\n${YELLOW}Exiting script... Goodbye!${NC}\n"
            exit 0
            ;;
        *)
            log_error "Invalid option! Please enter 1, 2, 3, 4, or 5."
            sleep 1.5
            ;;
    esac
done
