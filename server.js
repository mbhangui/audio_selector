// $Id: server.js,v 1.4 2026-07-24 17:31:26+05:30 Cprogrammer Exp mbhangui $
// Part 1
const express = require('express');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 9095;
const SERVICE_DIR = '/service';

const SCRIPT_DIR = '/usr/lib/audio_selector';
const OUTPUT_DIR = path.join(process.env.HOME, '.audio_selector');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'alsa_device');
const UPDATE_LOG_FILE = path.join(OUTPUT_DIR, 'update_progress.log');

const initLocalPath = path.join(OUTPUT_DIR, 'initialize');
const initGlobalPath = path.join(SCRIPT_DIR, 'initialize');
const INITIALIZE_SCRIPT = fs.existsSync(initLocalPath) ? initLocalPath : initGlobalPath;

const updateLocalPath = path.join(OUTPUT_DIR, 'update');
const updateGlobalPath = path.join(SCRIPT_DIR, 'update');
const UPDATE_HELPER = fs.existsSync(updateLocalPath) ? updateLocalPath : updateGlobalPath;

const restartLocalPath = path.join(OUTPUT_DIR, 'restart');
const restartGlobalPath = path.join(SCRIPT_DIR, 'restart');
const RESTART_SCRIPT = fs.existsSync(restartLocalPath) ? restartLocalPath : restartGlobalPath;

app.use(express.urlencoded({ extended: true }));

// Part 2
console.log(`[STARTUP] Target initialization script path: ${INITIALIZE_SCRIPT}`);
try {
    if (fs.existsSync(INITIALIZE_SCRIPT)) {
        console.log(`[STARTUP] Executing platform initializer block: ${INITIALIZE_SCRIPT}`);
        execSync(INITIALIZE_SCRIPT, { stdio: 'inherit' });
        console.log(`[STARTUP] Initialization sequence completed cleanly.`);
    } else {
        console.log(`[STARTUP] Notice: No initialization script found. Skipping...`);
    }
} catch (startupErr) {
    console.error(`\n[CRITICAL STARTUP ERROR] Initialization failed:`, startupErr.message);
    process.exit(1);
}

function formatDurationFromSeconds(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds <= 0) return '0s';
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
}

// Part 3
function getDistroLogo() {
    const rpiLogoSvg = `<svg class="rpi-logo" viewBox="0 0 500 540" xmlns="http://w3.org"><path d="M 230,175 C 190,175 110,210 110,300 C 110,410 200,505 250,505 C 300,505 390,410 390,300 C 390,210 310,175 270,175 C 250,175 250,195 250,195 C 250,195 250,175 230,175 Z" fill="#111" /><path d="M 232,185 C 196,185 122,218 122,300 C 122,398 204,490 250,490 C 296,490 378,398 378,300 C 378,218 304,185 268,185 C 250,185 250,205 250,205 C 250,205 250,185 232,185 Z" fill="#d01347" /><circle cx="250" cy="380" r="45" fill="#111" /><circle cx="250" cy="380" r="38" fill="#d01347" /><circle cx="170" cy="330" r="40" fill="#111" /><circle cx="170" cy="330" r="33" fill="#d01347" /><circle cx="330" cy="330" r="40" fill="#111" /><circle cx="330" cy="330" r="33" fill="#d01347" /><circle cx="250" cy="275" r="42" fill="#111" /><circle cx="250" cy="275" r="35" fill="#d01347" /><circle cx="190" cy="440" r="35" fill="#111" /><circle cx="190" cy="440" r="29" fill="#d01347" /><circle cx="310" cy="440" r="35" fill="#111" /><circle cx="310" cy="440" r="29" fill="#d01347" /><circle cx="250" cy="470" r="25" fill="#111" /><circle cx="250" cy="470" r="19" fill="#d01347" /><path d="M 245,170 C 210,170 120,120 120,60 C 150,40 230,50 248,125 Z" fill="#111" /><path d="M 241,162 C 210,162 128,115 128,68 C 152,50 224,59 241,126 Z" fill="#469c2b" /><path d="M 255,170 C 290,170 380,120 380,60 C 350,40 270,50 252,125 Z" fill="#111" /><path d="M 259,162 C 290,162 372,115 372,68 C 348,50 276,59 259,126 Z" fill="#469c2b" /><path d="M 235,140 L 250,110 L 265,140 Z" fill="#111" /></svg>`;
    const fedoraLogoSvg = `<svg class="rpi-logo" viewBox="0 0 512 512" xmlns="http://w3.org"><path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm-15.6 391.8c-23.7 0-42.9-19.2-42.9-42.9v-54.7h54.7c23.7 0 42.9 19.2 42.9 42.9v11.8c0 23.7-19.2 42.9-42.9 42.9zm101.4-101.4c0 23.7-19.2 42.9-42.9 42.9h-15.6v-54.7h54.7c2.1 0 3.8 1.7 3.8 3.8v8zm0-46.7h-54.7v-54.7h15.6c23.7 0 42.9 19.2 42.9 42.9v11.8c0 0 0 0 0 0zm-101.4-101.4c23.7 0 42.9 19.2 42.9 42.9v54.7h-54.7c-23.7 0-42.9-19.2-42.9-42.9v-11.8c0-23.7 19.2-42.9 42.9-42.9z" fill="#3c6eb4" /></svg>`;
    const genericLinuxLogoSvg = `<svg class="rpi-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent-color); padding-top: 5px;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;

    try {
        if (fs.existsSync('/etc/rpi-issue')) return rpiLogoSvg;
        const osReleasePath = '/etc/os-release';
        if (fs.existsSync(osReleasePath)) {
            const content = fs.readFileSync(osReleasePath, 'utf8');
            const idMatch = content.match(/^ID=["']?([a-zA-Z0-9_-]+)["']?/m);
            if (idMatch) {
                const distroId = idMatch[1].toLowerCase();
                if (distroId === 'raspbian') return rpiLogoSvg;
                if (distroId === 'fedora') return fedoraLogoSvg;
            }
        }
    } catch (e) {
        console.warn(e.message);
    }
    return genericLinuxLogoSvg;
}

function getCurrentConfig() {
    const config = { device: '', dsd: false };
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
            // FIXED: Now extracts the exact full text line from CARD_STRING= instead of DEVICE=
            const devMatch = content.match(/CARD_STRING=([^\n]+)/);
            const dsdMatch = content.match(/DSD=(true|false)/);
            if (devMatch) config.device = devMatch[1].trim();
            if (dsdMatch) config.dsd = dsdMatch[1] === 'true';
        } catch (e) {
            console.error(e.message);
        }
    }
    return config;
}

// Part 4
function getAlsaCards() {
    try {
        const output = execSync('aplay -l').toString();
        const lines = output.split('\n');
        const cards = [];
        lines.forEach(line => {
            // Evaluates and captures the full string layout starting with card
            const match = line.match(/^card \d+:\s+([a-zA-Z0-9_-]+)\s+\[/);
            if (match) {
                const fullLineStr = line.trim();
                cards.push({ id: fullLineStr, name: fullLineStr });
            }
        });
        return cards;
    } catch (error) {
        console.error(error.message);
        return [];
    }
}

function fetchSystemServices() {
    let services = [];

    // 1. Read existing directory based services
    try {
        if (fs.existsSync(SERVICE_DIR)) {
            fs.readdirSync(SERVICE_DIR).forEach(file => {
                if (!file.startsWith('.') && fs.statSync(path.join(SERVICE_DIR, file)).isDirectory()) {
                    services.push({ name: file, type: 'daemontools' });
                }
            });
        }
    } catch (err) {
        console.error("Daemontools check failed:", err.message);
    }

    // 2. Read and append service names from ~/.audio_selector/services.list
    const listFilePath = path.join(OUTPUT_DIR, 'services.list');
    try {
        if (fs.existsSync(listFilePath)) {
            const content = fs.readFileSync(listFilePath, 'utf8');
            content.split('\n').forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine && !cleanLine.startsWith('#')) {
                    // Check to avoid duplicate dropdown entries
                    if (!services.some(s => s.name === cleanLine)) {
                        services.push({ name: cleanLine, type: 'systemd' });
                    }
                }
            });
        }
    } catch (err) {
        console.error("Failed to read services.list file:", err.message);
    }
    return services;
}

// Part 5
app.get('/favicon.ico', (req, res) => {
    const faviconBase64 = 'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAA' +
                          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                          'AAAAAABbW1sAW1tbAFtbWwBbW1sAW1tbAFtbWwBbW1sAW1tbAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                          'AAAAAFtbWwAAAAAAW1tbAAAAAABbW1sAW1tbAAAAAABbW1sAAAAAAFtbWwAAAAAAAAAAAAAAAAAA' +
                          'AAAAAFtbWwAAAAAAW1tbAAAAAABbW1sAW1tbAAAAAABbW1sAAAAAAFtbWwAAAAAAAAAAAAAAAAAA' +
                          'AAAAAFtbWwAAAAAAW1tbAAAAAABbW1sAW1tbAAAAAABbW1sAAAAAAFtbWwAAAAAAAAAAAAAAAAAA' +
                          'AAAAAFtbWwAAAAAAW1tbAAAAAABbW1sAW1tbAAAAAABbW1sAAAAAAFtbWwAAAAAAAAAAAAAAAAAA' +
                          'AAAAAFtbWwAAAAAAW1tbAAAAAABbW1sAW1tbAAAAAABbW1sAAAAAAFtbWwAAAAAAAAAAAAAAAAAA' +
                          'AAAAAFtbWwAAAAAAW1tbAAAAAABbW1sAW1tbAAAAAABbW1sAAAAAAFtbWwAAAAAAAAAAAAAAAAAA' +
                          'AAAAAFtbWwAAAAAAW1tbAAAAAABbW1sAW1tbAAAAAABbW1sAAAAAAFtbWwAAAAAAAAAAAAAAAAAA' +
                          'AAAAAFtbWwAAAAAAW1tbAAAAAABbW1sAW1tbAAAAAABbW1sAAAAAAFtbWwAAAAAAAAAAAAAAAAAA' +
                          'AAAAAFtbWwBbW1sAW1tbAFtbWwBbW1sAW1tbAFtbWwBbW1sAW1tbAAAAAAAAAAAAAAAAAAAAAAAA' +
                          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
                          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8A' +
                          'AP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAA=';
    const img = Buffer.from(faviconBase64, 'base64');
    res.writeHead(200, { 'Content-Type': 'image/x-icon', 'Content-Length': img.length, 'Cache-Control': 'public, max-age=604800' });
    res.end(img);
});

// Serves the CSS layout definitions dynamically to prevent unstyled rendering breaks
app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/', (req, res) => {
    const cards = getAlsaCards();
    const current = getCurrentConfig();
    const hostname = os.hostname();
    const logoSvg = getDistroLogo();
    const services = fetchSystemServices();

    let template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    template = template.replace('%%HOSTNAME%%', hostname).replace('%%LOGO%%', logoSvg);

    if (cards.length === 0) {
        template = template.replace('%%OPTIONS%%', '<p style="color:red;">No ALSA devices found.</p>');
    } else {
        const optionsHtml = cards.map(card => {
            const isChecked = card.id === current.device ? 'checked' : '';
            return `<label class="radio-label"><input type="radio" name="device" value="${card.id}" ${isChecked} required><span>${card.name}</span></label>`;
        }).join('\n');
        template = template.replace('%%OPTIONS%%', optionsHtml);
    }
    template = template.replace('%%DSD_CHECKED%%', current.dsd ? 'checked' : '');

    // Encode service type directly into the option value string (e.g. "nginx|systemd" or "audio_server|daemontools")
    const servicesHtml = services.map(srv => `<option value="${srv.name}|${srv.type}">${srv.name}</option>`).join('\n');
    template = template.replace('%%SERVICES_OPTIONS%%', servicesHtml);
    res.send(template);
});

// Part 6
app.post('/select', (req, res) => {
    const { device, dsd, theme } = req.body;
    const isDsd = dsd === 'true';
    const isDark = theme === 'dark';

    if (!device) return res.status(400).send('Device parameter missing.');

    const previous = getCurrentConfig();
    // FIXED: Accurately references the full text string tracked inside memory
    const stateChanged = (previous.device !== device) || (previous.dsd !== isDsd);

    const uiBg = isDark ? '#121212' : '#f4f6f9';
    const uiText = isDark ? '#e0e0e0' : '#333333';
    const uiBox = isDark ? '#1e1e1e' : '#ffffff';
    const uiBorder = isDark ? '#444444' : '#cccccc';
    const linkColor = isDark ? '#bb86fc' : '#0066cc';

    try {
        let titleMessage = "Verified!";
        let titleColor = "#2e7d32";
        let subMessage = "No changes detected. Configuration file was not modified.";

        if (stateChanged) {
            if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

            let shortName = 'AUDIO';
            const shortMatch = device.match(/^card \d+:\s+([a-zA-Z0-9_-]+)\s+\[/);
            if (shortMatch) shortName = shortMatch;

            const fileContent = `DEVICE=hw:${shortName}\nCARD_STRING=${device}\nDSD=${isDsd}\n`;
            fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');

            titleMessage = "Action Complete!";
            titleColor = "#0066cc";
            subMessage = "Configuration modified. Audio system successfully updated.";

            console.log(`\n--- [RESTART TRIGGER] RUNNING COMPONENT FORK: ${RESTART_SCRIPT} ---`);
            execSync(RESTART_SCRIPT, { stdio: 'inherit' });
            console.log(`--- [RESTART TRIGGER] COMPLETED CLEANLY ---\n`);
        }
        res.send(getFeedbackHtml(titleMessage, titleColor, `Device context: <strong>${device}</strong> (DSD: ${isDsd}).`, subMessage, uiBg, uiBox, uiText, uiBorder, linkColor));
    } catch (err) {
        res.status(500).send(`Execution Error: ${err.message}`);
    }
});

// Part 7
app.post('/toolbox', (req, res) => {
    const { action, service, theme } = req.body;
    const isDark = theme === 'dark';

    if (!action || !service) {
        return res.status(400).send('Parameters mismatch: Please ensure action and service are selected.');
    }

    // Split the incoming value back into name and supervisor architecture type
    const [serviceName, serviceType] = service.split('|');
    let targetCommand = '';

    if (serviceType === 'systemd') {
        // Map UI commands to systemctl target options
        let systemdAction = '';
        if (action === 'up') systemdAction = 'start';
        else if (action === 'down') systemdAction = 'stop';
        else if (action === 'restart') systemdAction = 'restart';
        targetCommand = `sudo systemctl ${systemdAction} ${serviceName}`;
    } else {
        // Fall back to traditional daemontools commands
        let svcActionFlag = '';
        if (action === 'up') svcActionFlag = '-u';
        else if (action === 'down') svcActionFlag = '-d';
        else if (action === 'restart') svcActionFlag = '-r';
        targetCommand = `sudo svc ${svcActionFlag} /service/${serviceName}`;
    }

    const uiBg = isDark ? '#121212' : '#f4f6f9';
    const uiText = isDark ? '#e0e0e0' : '#333333';
    const uiBox = isDark ? '#1e1e1e' : '#ffffff';
    const uiBorder = isDark ? '#444444' : '#cccccc';
    const linkColor = isDark ? '#bb86fc' : '#0066cc';

    try {
        console.log(`\n--- [TOOL BOX TRIGGER] RUNNING: ${targetCommand} ---`);
        execSync(targetCommand, { stdio: 'inherit' });
        console.log(`--- [TOOL BOX TRIGGER] FINISHED CLEANLY ---\n`);

        res.send(getFeedbackHtml("Tool Box Executed!", "#0066cc", `Command run: <code style="background:rgba(0,0,0,0.1); padding:2px 6px; border-radius:4px;">${targetCommand}</code>`, "System daemon control action dispatched cleanly.", uiBg, uiBox, uiText, uiBorder, linkColor));
    } catch (err) {
        console.error("[TOOL BOX RUN ERROR]:", err.message);
        res.status(500).send(`System Command Error: Foreground supervisor execution failure. ${err.message}`);
    }
});

// ROUTE 1: Serves the immediate loading UI layout page to the browser
app.get('/update-loading', (req, res) => {
    const isDark = req.query.theme === 'dark';
    const uiBg = isDark ? '#121212' : '#f4f6f9';
    const uiText = isDark ? '#e0e0e0' : '#333333';
    const uiBox = isDark ? '#1e1e1e' : '#ffffff';
    const uiBorder = isDark ? '#444444' : '#cccccc';
    const linkColor = isDark ? '#bb86fc' : '#0066cc';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>System Update Running</title>
            <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
        </head>
        <body style="font-family:-apple-system, BlinkMacSystemFont, sans-serif; background-color:${uiBg}; color:${uiText}; padding:40px; text-align:center;">
            <div style="background:${uiBox}; color:${uiText}; padding:25px; display:inline-block; border-radius:8px; border:2px solid ${uiBorder}; box-shadow:0 4px 10px rgba(0,0,0,0.1); width:90%; max-width:900px; text-align:left;">
                <h3 id="statusTitle" style="color:#00897b; margin-top:0; font-size:1.4rem;">Please wait. Updating the system...</h3>
                <div id="loadingIndicator" style="font-size: 1rem; font-style: italic; color: #888; margin-bottom: 15px;">
                    Running package manager tasks in terminal background to avoid network timeout blocks.
                </div>
                <div id="logContainer">
                    <pre id="terminalBox" style="background:#000000; color:#00ff00; padding:15px; border-radius:6px; font-family:SFMono-Regular, Consolas, monospace; font-size:0.85rem; max-height:500px; overflow-y:auto; white-space:pre-wrap; word-break:break-all;">Initializing logs...</pre>
                    <a id="backBtn" href="/" style="color:${linkColor}; text-decoration:none; font-weight:bold; display:none; margin-top:20px; text-align:center;">← Return to Dashboard</a>
                </div>
            </div>
            <script>
                // Step A: Fire and forget trigger to kick off the update background pipeline instantly
                fetch('/trigger-background-update')
                    .then(() => {
                        // Step B: Set up a polling interval timer to pull the progress log every 2 seconds safely
                        const pollInterval = setInterval(() => {
                            fetch('/poll-update-logs')
                                .then(res => res.json())
                                .then(data => {
                                    document.getElementById('terminalBox').innerText = data.output;
                                    // Scroll terminal dynamically to the bottom line
                                    const box = document.getElementById('terminalBox');
                                    box.scrollTop = box.scrollHeight;
                                    if (data.status === 'completed') {
                                        clearInterval(pollInterval);
                                        document.getElementById('statusTitle').innerText = 'Update Execution Log';
                                        document.getElementById('loadingIndicator').style.display = 'none';
                                        document.getElementById('backBtn').style.display = 'block';
                                    } else if (data.status === 'failed') {
                                        clearInterval(pollInterval);
                                        document.getElementById('statusTitle').innerText = 'Update Failed!';
                                        document.getElementById('statusTitle').style.color = '#cc0000';
                                        document.getElementById('terminalBox').style.color = '#ff3333';
                                        document.getElementById('loadingIndicator').style.display = 'none';
                                        document.getElementById('backBtn').style.display = 'block';
                                    }
                                });
                        }, 2000);
                    });
            </script>
        </body>
        </html>
    `);
});

// ROUTE 2: Fires and detaches the execution script immediately, saving output to disk file
app.get('/trigger-background-update', (req, res) => {
    // Send immediate response back to browser to instantly break the network timeout trap
    res.json({ started: true });
    try {
        if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

        // Write fresh processing indicator state line down to file
        fs.writeFileSync(UPDATE_LOG_FILE, "=== SYSTEM UPDATE IN PROGRESS ===\nRunning package list sync updates...\n", 'utf8');
        console.log(`\n--- [UPDATE HELPER TRIGGER] EXEC FORK RUNNING IN BACKGROUND ---`);

        // Spawns shell execution thread natively detached, routing all logs live to the progress file
        exec(`sudo ${UPDATE_HELPER} update > ${UPDATE_LOG_FILE} 2>&1 && echo "\nRunning system package upgrade installations..." >> ${UPDATE_LOG_FILE} && sudo ${UPDATE_HELPER} upgrade >> ${UPDATE_LOG_FILE} 2>&1`, (err) => {
            if (err) {
                console.error("[BACKGROUND UPDATE FAILURE]:", err.message);
                fs.appendFileSync(UPDATE_LOG_FILE, `\n\n=== EXEUCTION FAILURE ===\n${err.message}\nSTATUS=FAILED\n`);
            } else {
                console.log(`--- [UPDATE HELPER TRIGGER] BACKGROUND COMPLETED CLEANLY ---\n`);
                fs.appendFileSync(UPDATE_LOG_FILE, `\n\n=== UPDATE COMPLETED SUCCESSFULLY ===\nSTATUS=COMPLETED\n`);
            }
        });
    } catch (err) {
        console.error(err.message);
        fs.writeFileSync(UPDATE_LOG_FILE, `CRITICAL INIT FAILURE:\n${err.message}\nSTATUS=FAILED\n`, 'utf8');
    }
});

// ROUTE 3: Safe tracking hook allowing browser to read the text file live in chunks
app.get('/poll-update-logs', (req, res) => {
    let output = "Waiting for background worker initialization thread...";
    let status = 'running';
    try {
        if (fs.existsSync(UPDATE_LOG_FILE)) {
            output = fs.readFileSync(UPDATE_LOG_FILE, 'utf8');

            // Check for explicit done state tags written at final shell termination
            if (output.includes('STATUS=COMPLETED')) {
                status = 'completed';
                output = output.replace('STATUS=COMPLETED', '');
            } else if (output.includes('STATUS=FAILED')) {
                status = 'failed';
                output = output.replace('STATUS=FAILED', '');
            }
        }
    } catch (e) {
        output = "Reading progress log failed: " + e.message;
    }
    res.json({ status: status, output: output });
});

// Part 10
app.get('/sys-reboot', (req, res) => {
    try {
        const rebootCommand = "sudo reboot";
        console.log(`\n[SYSTEM CONTROL]: Reboot trigger issued via user interface request.`);
        exec(rebootCommand);
        res.send(`
            <body style="font-family:sans-serif; background-color:#121212; color:#e0e0e0; text-align:center; padding-top:100px;">
                <div style="background:#1e1e1e; border:1px solid #444; display:inline-block; padding:30px; border-radius:8px;">
                    <h2 style="color:#ffb74d; margin-top:0;">System Rebooting</h2>
                    <p>The host machine is processing a standard system reboot sequence right now.</p>
                </div>
            </body>
        `);
    } catch (err) {
        res.status(500).send(`Reboot Call Failure: ${err.message}`);
    }
});

app.get('/sys-shutdown', (req, res) => {
    try {
        const shutdownCommand = "sudo shutdown -h now";
        console.log(`\n[CRITICAL WARNING]: Hardware power-off shutdown sequence initiated.`);
        exec(shutdownCommand);
        res.send(`
            <body style="font-family:sans-serif; background-color:#121212; color:#e0e0e0; text-align:center; padding-top:100px;">
                <div style="background:#1e1e1e; border:1px solid #444; display:inline-block; padding:30px; border-radius:8px;">
                    <h2 style="color:#ff6b6b; margin-top:0;">System Powering Off</h2>
                    <p>The host machine is processing a system-wide poweroff command right now.</p>
                </div>
            </body>
        `);
    } catch (err) {
        res.status(500).send(`Shutdown Call Failure: ${err.message}`);
    }
});

// Part 11
app.get('/service-status', (req, res) => {
    const isDark = req.query.theme === 'dark';
    const uiBg = isDark ? '#121212' : '#f4f6f9';
    const uiText = isDark ? '#e0e0e0' : '#333333';
    const uiBox = isDark ? '#1e1e1e' : '#ffffff';
    const uiBorder = isDark ? '#444444' : '#cccccc';
    const linkColor = isDark ? '#bb86fc' : '#0066cc';

    let allServices = [];

    // 1. Gather Daemontools / Supervise Statuses via exit-code resilient checks
    try {
        if (fs.existsSync(SERVICE_DIR)) {
            const dirs = fs.readdirSync(SERVICE_DIR).filter(file => {
                return !file.startsWith('.') && fs.statSync(path.join(SERVICE_DIR, file)).isDirectory();
            });

            dirs.forEach(dir => {
                let status = 'Down';
                let pidOrSpid = '-';
                let remarks = 'Normally Up';
                let totalSeconds = 0;
                let svstatOut = '';

                try {
                    // Try executing normally
                    svstatOut = execSync(`sudo svstat ${path.join(SERVICE_DIR, dir)}`).toString();
                } catch (err) {
                    if (err.stdout) svstatOut = err.stdout.toString();
                }

                if (svstatOut) {
                    svstatOut = svstatOut.trim();

                    // Parse raw duration float/integer seconds cleanly from the stream string
                    const durationMatch = svstatOut.match(/(?:up|down)\s+(\d+(?:\.\d+)?)/);
                    if (durationMatch && durationMatch[1]) {
                        // FIXED: Correctly targeting index [1] to grab string digit values for accurate sorting comparisons
                        totalSeconds = parseFloat(durationMatch[1]) || 0;
                    }

                    if (svstatOut.includes(': up ')) {
                        status = 'Up';
                        const pidMatch = svstatOut.match(/pid\s+(\d+)/);
                        if (pidMatch) pidOrSpid = pidMatch[1];
                    } else if (svstatOut.includes(': down ')) {
                        status = 'Down';
                        const spidMatch = svstatOut.match(/spid\s+(\d+)/);
                        if (spidMatch) pidOrSpid = spidMatch[1];
                    }
                }

                if (fs.existsSync(path.join(SERVICE_DIR, dir, 'down'))) remarks = 'Normally Down';
                allServices.push({ name: dir, type: 'supervise', status: status, remarks: remarks, seconds: totalSeconds, pid: pidOrSpid });
            });
        }
    } catch (err) {
        console.error(err.message);
    }

    // 2. Gather Systemd Statuses from your services.list file
    const listFilePath = path.join(OUTPUT_DIR, 'services.list');
    try {
        if (fs.existsSync(listFilePath)) {
            const content = fs.readFileSync(listFilePath, 'utf8');
            content.split('\n').forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine && !cleanLine.startsWith('#')) {
                    let status = 'Down';
                    let remarks = 'Normally Up';
                    let pidOrSpid = '-';
                    let totalSeconds = 0;
                    let statusOut = '';

                    try {
                        // systemctl status also returns non-zero codes if a service is stopped; handle it safely
                        statusOut = execSync(`sudo systemctl status ${cleanLine}`).toString();
                    } catch (err) {
                        if (err.stdout) statusOut = err.stdout.toString();
                    }

                    if (statusOut) {
                        // FIXED: Parses 'disabled' state signature cleanly from the layout block text string
                        if (statusOut.includes('Active: active (running)')) status = 'Up';
                        const loadedLineMatch = statusOut.match(/Loaded:\s+[^\n]+/);

                        // Parse Main PID
                        if (loadedLineMatch && loadedLineMatch[0].includes('; disabled;')) remarks = 'Normally Down';
                        const pidMatch = statusOut.match(/Main PID:\s+(\d+)/);
                        if (pidMatch) pidOrSpid = pidMatch[1];

                        // Precise datetime math parsing for the active systemd timestamp loop
                        const sinceMatch = statusOut.match(/since\s+([^;\n]+)/);
                        if (sinceMatch) {
                            let dateStr = sinceMatch[1].trim();

                            // Clean up day names and bracketed timezone strings to ensure strict native Date constructor parsing
                            dateStr = dateStr.replace(/^[A-Za-z]+/, '').replace(/\b[A-Z]{3,4}\b/, '').trim();
                            const sinceDate = new Date(dateStr);
                            if (!isNaN(sinceDate.getTime())) totalSeconds = Math.max(0, (Date.now() - sinceDate.getTime()) / 1000);
                        }
                    }
                    allServices.push({ name: cleanLine, type: 'systemd', status: status, remarks: remarks, seconds: totalSeconds, pid: pidOrSpid });
                }
            });
        }
    } catch (err) {
        console.error(err.message);
    }

    // FIXED: Multi-tier sorting arrays now correctly evaluate clean numeric floats
    const downServices = allServices.filter(s => s.status === 'Down').sort((a, b) => b.seconds - a.seconds);
    const upServices = allServices.filter(s => s.status === 'Up').sort((a, b) => a.seconds - b.seconds);
    const sortedServices = downServices.concat(upServices);

    const tableRowsHtml = sortedServices.map(srv => {
        const durationText = srv.seconds > 0 ? formatDurationFromSeconds(srv.seconds) : '0s';
        return `<tr><td>${srv.name}</td><td>${srv.type}</td><td style="color: ${srv.status === 'Up' ? '#4caf50' : '#f44336'}; font-weight: bold;">${srv.status}</td><td>${srv.remarks}</td><td>${durationText}</td><td>${srv.pid}</td></tr>`;
    }).join('\n');

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><title>Service Status Monitor</title><link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
            <style>
                body { font-family:-apple-system, BlinkMacSystemFont, sans-serif; background-color:${uiBg}; color:${uiText}; padding:40px; text-align:center; }
                .status-box { background:${uiBox}; color:${uiText}; padding:25px; display:inline-block; border-radius:8px; border:2px solid ${uiBorder}; box-shadow:0 4px 10px rgba(0,0,0,0.1); width:95%; max-width:900px; text-align:left; }
                .status-table { width:100%; border-collapse:collapse; font-family:SFMono-Regular, Consolas, monospace; font-size:0.9rem; margin-top:20px; }
                .status-table th, .status-table td { text-align:left; padding:10px 14px; border-bottom:1px solid ${uiBorder}; }
                .status-table th { color:${linkColor}; font-weight:bold; text-transform:uppercase; font-size:0.8rem; letter-spacing:0.5px; }
                .status-table tr:hover { background: rgba(0,0,0,0.02); }
                [data-theme="dark"] .status-table tr:hover { background: rgba(255,255,255,0.02); }
            </style>
        </head>
        <body>
            <div class="status-box">
                <h3 style="color:#d81b60; margin-top:0; font-size:1.3rem;">System Service Status</h3>
                <table class="status-table">
                    <thead><tr><th>Service Name</th><th>Type</th><th>Status</th><th>Remarks</th><th>Uptime/Downtime</th><th>PID/SPID</th></tr></thead>
                    <tbody>${tableRowsHtml || '<tr><td colspan="6" style="text-align:center; color:#888;">No services tracked or found.</td></tr>'}</tbody>
                </table>
                <a href="/" style="color:${linkColor}; text-decoration:none; font-weight:bold; display:block; margin-top:25px; text-align:center;">← Return to Dashboard</a>
            </div>
        </body>
        </html>
    `);
});

// Part 12
function getFeedbackHtml(title, titleColor, desc, sub, bg, box, text, border, link) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><title>Result</title><link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"></head>
        <body style="font-family:-apple-system, BlinkMacSystemFont, sans-serif; background-color:${bg}; color:${text}; padding:40px; text-align:center;">
            <div style="background:${box}; color:${text}; padding:25px; display:inline-block; border-radius:8px; border:2px solid ${border}; box-shadow:0 4px 10px rgba(0,0,0,0.1); min-width:320px; text-align:left;">
                <h3 style="color:${titleColor}; margin-top:0;">${title}</h3>
                <p style="margin-bottom: 8px;">${desc}</p>
                <p style="color:${text === '#333333' ? '#555' : '#aaa'}; font-size:0.9rem; font-style:italic; margin-top: 0;">${sub}</p>
                <a href="/" style="color:${link}; text-decoration:none; font-weight:bold; display:block; margin-top:20px; text-align:center;">← Go Back</a>
            </div>
        </body>
        </html>`;
}

const server = app.listen(PORT, () => {
    console.log(`Launched audio_selector on ${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
    	console.log(`${PORT}: Address is already in use`);
        process.exit(1);
    }
});


// $Log: server.js,v $
// Revision 1.4  2026-07-24 17:31:26+05:30  Cprogrammer
// sort service entries according to uptime/downtime values
//
// Revision 1.3  2026-07-22 22:00:47+05:30  Cprogrammer
// run update in background
//
// Revision 1.2  2026-07-21 19:52:08+05:30  Cprogrammer
// added styles.css
//
// Revision 1.1  2026-07-21 01:19:54+05:30  Cprogrammer
// Initial revision
//
