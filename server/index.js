import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Decode latin1 output from netsh (Windows Spanish)
const decode = (buf) => buf.toString('latin1');

// Parse "Señal : 82%" -> 82
const parseSignal = (str) => {
    const m = str.match(/(\d+)%/);
    return m ? parseInt(m[1]) : 0;
};

// Normalize security type
const parseSecurity = (str) => {
    const s = str.toLowerCase();
    if (s.includes('wpa3')) return 'WPA3';
    if (s.includes('wpa2')) return 'WPA2';
    if (s.includes('wpa')) return 'WPA';
    if (s.includes('open') || s.includes('abierta') || s.includes('ninguna') || s.includes('none')) return 'OPEN';
    return str.trim() || 'WPA2';
};

// Run netsh and get raw output
const runCmd = (cmd) => new Promise((resolve) => {
    exec(cmd, { encoding: 'buffer', shell: 'cmd.exe', timeout: 8000 }, (err, out) => {
        resolve(decode(out || Buffer.alloc(0)));
    });
});

// GET /api/networks - scan visible WiFi networks
app.get('/api/networks', async (req, res) => {
    try {
        const raw = await runCmd('netsh wlan show networks mode=bssid');
        const networks = [];
        const blocks = raw.split(/SSID \d+ :/);

        for (let i = 1; i < blocks.length; i++) {
            const block = blocks[i];
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

            const ssid = lines[0]?.trim();
            if (!ssid || ssid.startsWith('HESSID')) continue;

            let signal = 0;
            let sec = 'WPA2';
            let band = '2.4 GHz';
            let channel = '-';
            let radio = '802.11n';

            for (const line of lines) {
                const lower = line.toLowerCase();
                if (lower.includes('señal') || lower.includes('se') && lower.includes('al')) {
                    signal = parseSignal(line);
                }
                if (lower.includes('autenticaci')) {
                    sec = parseSecurity(line.split(':').slice(1).join(':'));
                }
                if (lower.includes('banda')) {
                    band = line.split(':').slice(1).join(':').trim() || band;
                }
                if (lower.includes('canal') || lower.includes('channel')) {
                    channel = line.split(':').slice(1).join(':').trim() || channel;
                }
                if (lower.includes('tipo de radio') || lower.includes('radio type')) {
                    radio = line.split(':').slice(1).join(':').trim() || radio;
                }
            }

            networks.push({ ssid, signal, sec, band, channel, radio });
        }

        // Sort by signal desc
        networks.sort((a, b) => b.signal - a.signal);
        res.json({ ok: true, networks });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// GET /api/current - current connection info
app.get('/api/current', async (req, res) => {
    try {
        const raw = await runCmd('netsh wlan show interfaces');

        const get = (keys) => {
            for (const key of keys) {
                const re = new RegExp(key + '\\s*:\\s*(.+)', 'i');
                const m = raw.match(re);
                if (m) return m[1].trim();
            }
            return null;
        };

        const state = get(['Estado', 'State']) || '';
        const connected = state.toLowerCase().includes('conect');

        if (!connected) {
            return res.json({ ok: true, connected: false, ssid: '', ip: '', signal: 0, speed: { rx: 0, tx: 0 } });
        }

        const ssid = get(['SSID']) || '';
        const signal = parseSignal(get(['Señal', 'Signal']) || '0%');
        const rxStr = get(['Velocidad de recepci', 'Receive rate']) || '0';
        const txStr = get(['Velocidad de transmisi', 'Transmit rate']) || '0';
        const rx = parseFloat(rxStr) || 0;
        const tx = parseFloat(txStr) || 0;

        // Get IP from ipconfig
        const ipRaw = await runCmd('netsh interface ip show address "Wi-Fi"');
        const ipMatch = ipRaw.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        const ip = ipMatch ? ipMatch[1] : '---';

        const gateway = (await runCmd('netsh interface ip show config "Wi-Fi"')).match(/Puerta de enlace predeterminada[^:]*:\s*([\d.]+)/i)?.[1]
            || (await runCmd('netsh interface ip show config "Wi-Fi"')).match(/Default Gateway[^:]*:\s*([\d.]+)/i)?.[1]
            || '---';

        res.json({ ok: true, connected: true, ssid, ip, signal, speed: { rx: Math.round(rx), tx: Math.round(tx) }, gateway });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// POST /api/connect - connect to a network
app.post('/api/connect', async (req, res) => {
    const { ssid, password, security } = req.body;
    if (!ssid) return res.status(400).json({ ok: false, error: 'ssid requerido' });

    try {
        // Check if profile already exists
        const existing = await runCmd(`netsh wlan show profile name="${ssid}"`);
        const hasProfile = !existing.toLowerCase().includes('no se encontr') && !existing.toLowerCase().includes('not found');

        if (hasProfile) {
            // Connect using existing profile
            await runCmd(`netsh wlan connect name="${ssid}"`);
            return res.json({ ok: true, message: `Conectado a ${ssid} usando perfil guardado` });
        }

        if (!password && security !== 'OPEN') {
            return res.status(400).json({ ok: false, error: 'Contrasena requerida' });
        }

        // Create a new profile XML
        const authMap = { 'WPA3': 'WPA3SAE', 'WPA2': 'WPA2PSK', 'WPA': 'WPAPSK', 'OPEN': 'open' };
        const auth = authMap[security] || 'WPA2PSK';
        const encr = security === 'OPEN' ? 'none' : 'AES';

        const xml = security === 'OPEN'
            ? `<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>${ssid}</name>
    <SSIDConfig><SSID><name>${ssid}</name></SSID></SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM><security>
        <authEncryption><authentication>open</authentication><encryption>none</encryption><useOneX>false</useOneX></authEncryption>
    </security></MSM>
</WLANProfile>`
            : `<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>${ssid}</name>
    <SSIDConfig><SSID><name>${ssid}</name></SSID></SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM><security>
        <authEncryption><authentication>${auth}</authentication><encryption>${encr}</encryption><useOneX>false</useOneX></authEncryption>
        <sharedKey><keyType>passPhrase</keyType><protected>false</protected><keyMaterial>${password}</keyMaterial></sharedKey>
    </security></MSM>
</WLANProfile>`;

        // Write profile to temp file and add it
        const tmpPath = `%TEMP%\\wlan_profile_${Date.now()}.xml`;
        await runCmd(`echo ${xml.replace(/"/g, '\\"').replace(/\n/g, ' ')} > "${tmpPath}"`);

        // Use PowerShell for clean XML writing
        const psCmd = `powershell -Command "$xml = @'\n${xml}\n'@; $xml | Out-File -FilePath '$env:TEMP\\wprofile.xml' -Encoding UTF8"`;
        await runCmd(psCmd);
        await runCmd('netsh wlan add profile filename="%TEMP%\\wprofile.xml" user=current');
        const connectResult = await runCmd(`netsh wlan connect name="${ssid}"`);

        if (connectResult.toLowerCase().includes('error') || connectResult.toLowerCase().includes('correcto') === false) {
            // Clean up failed profile
            await runCmd(`netsh wlan delete profile name="${ssid}"`);
            return res.status(400).json({ ok: false, error: 'Contrasena incorrecta o red no disponible' });
        }

        res.json({ ok: true, message: `Conectando a ${ssid}...` });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// POST /api/disconnect
app.post('/api/disconnect', async (req, res) => {
    try {
        await runCmd('netsh wlan disconnect');
        res.json({ ok: true, message: 'Desconectado' });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n  NET-WATCHER API corriendo en http://localhost:${PORT}`);
    console.log('  Endpoints:');
    console.log('    GET  /api/networks   - escanear redes WiFi');
    console.log('    GET  /api/current    - conexion actual');
    console.log('    POST /api/connect    - conectar a red');
    console.log('    POST /api/disconnect - desconectar\n');
});
