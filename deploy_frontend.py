"""
Deploy script: Next.js static export -> Hostinger shared hosting
Frontend: /home/u286274846/domains/grupoeades.org/public_html/learning/
URL:      https://grupoeades.org/learning/
"""

import io
import os
import sys
import zipfile
import hashlib
import subprocess
import urllib.request
import urllib.parse
import paramiko
from pathlib import Path

# ── Configuracion ──────────────────────────────────────────────────────────
SSH_HOST     = os.environ.get("SSH_HOST", "145.223.105.59")
SSH_PORT     = int(os.environ.get("SSH_PORT", 65002))
SSH_USER     = os.environ.get("SSH_USER", "u286274846")
SSH_PASSWORD = os.environ.get("SSH_PASSWORD", "")

WEB_REMOTE   = "/home/u286274846/domains/grupoeades.org/public_html/learning"
BASE_URL     = "https://grupoeades.org/learning"
LOCAL_ROOT   = Path(__file__).parent

DEPLOY_SECRET = hashlib.sha256((SSH_PASSWORD + "frontend").encode()).hexdigest()[:32]

HTACCESS = """<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /learning/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . index.html [L]
</IfModule>

<IfModule mod_headers.c>
    Header set X-Content-Type-Options nosniff
    Header set X-Frame-Options SAMEORIGIN
    Header set Referrer-Policy strict-origin-when-cross-origin
</IfModule>

# Cache assets agresivamente
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
"""

RECEIVER_PHP = f"""<?php
$secret = '{DEPLOY_SECRET}';
$given  = $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? '';
if (!hash_equals($secret, $given)) {{ http_response_code(403); die('Forbidden'); }}

$action = $_GET['action'] ?? '';
$tmpDir = sys_get_temp_dir();

if ($action === 'ping') {{ echo 'pong'; exit; }}

if ($action === 'chunk') {{
    $id    = preg_replace('/[^a-z0-9]/', '', $_POST['id'] ?? '');
    $part  = (int)($_POST['part'] ?? 0);
    $data  = base64_decode($_POST['data'] ?? '');
    if (!$id || !$data) {{ http_response_code(400); die('Missing params'); }}
    file_put_contents("$tmpDir/deploy_{{$id}}_{{$part}}.chunk", $data);
    echo 'ok'; exit;
}}

if ($action === 'assemble') {{
    $id    = preg_replace('/[^a-z0-9]/', '', $_POST['id'] ?? '');
    $total = (int)($_POST['total'] ?? 0);
    $dest  = $_POST['dest'] ?? '';
    if (!$id || !$total || !$dest) {{ http_response_code(400); die('Missing params'); }}
    $zipPath = "$tmpDir/deploy_{{$id}}.zip";
    $fp = fopen($zipPath, 'wb');
    for ($i = 0; $i < $total; $i++) {{
        $chunk = "$tmpDir/deploy_{{$id}}_{{$i}}.chunk";
        fwrite($fp, file_get_contents($chunk));
        unlink($chunk);
    }}
    fclose($fp);
    $z = new ZipArchive();
    if ($z->open($zipPath) !== true) {{ http_response_code(500); die('Bad zip'); }}
    $count = $z->count();
    $z->extractTo($dest);
    $z->close();
    unlink($zipPath);
    echo 'ok:' . $count; exit;
}}

if ($action === 'write') {{
    $path = $_POST['path'] ?? '';
    $data = $_POST['data'] ?? '';
    if (!$path) {{ http_response_code(400); die('Missing path'); }}
    file_put_contents($path, $data);
    echo 'ok'; exit;
}}

if ($action === 'self_destruct') {{ unlink(__FILE__); echo 'gone'; exit; }}

http_response_code(400); die('Unknown action');
"""


# ── SSH helpers ───────────────────────────────────────────────────────────

def ssh_connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASSWORD, timeout=15)
    return c


def ssh_run(ssh, cmd):
    print(f"  $ {cmd[:100]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    for line in (out + "\n" + err).splitlines():
        if line.strip():
            print(f"    {line}")
    return out


def sftp_put_small(ssh, content: bytes, remote_path: str):
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(content), remote_path)
    sftp.close()


# ── HTTP helpers ──────────────────────────────────────────────────────────

CHUNK_SIZE = 800 * 1024


def http_post(action: str, data: dict = None) -> str:
    url = f"{BASE_URL}/_deploy_recv.php?action={action}"
    body = urllib.parse.urlencode(data or {}).encode()
    req = urllib.request.Request(url, data=body or None, headers={
        "X-Deploy-Secret": DEPLOY_SECRET,
        "Content-Type": "application/x-www-form-urlencoded",
    }, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read(500).decode()}")


def upload_zip_chunked(zip_bytes: bytes, dest: str, label: str) -> str:
    import base64
    chunks = [zip_bytes[i:i+CHUNK_SIZE] for i in range(0, len(zip_bytes), CHUNK_SIZE)]
    total = len(chunks)
    print(f"      {len(zip_bytes)//1024} KB en {total} chunks de ~{CHUNK_SIZE//1024} KB")
    for i, chunk in enumerate(chunks):
        encoded = base64.b64encode(chunk).decode()
        result = http_post("chunk", {"id": label, "part": str(i), "data": encoded})
        if result != "ok":
            raise RuntimeError(f"Chunk {i} fallo: {result}")
        print(f"      chunk {i+1}/{total} OK", end="\r", flush=True)
    print()
    result = http_post("assemble", {"id": label, "total": str(total), "dest": dest})
    return result


# ── Zip builder ──────────────────────────────────────────────────────────

def build_zip_from_dir(local_dir: Path) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for path in local_dir.rglob("*"):
            if path.is_file():
                rel = path.relative_to(local_dir)
                zf.write(path, rel.as_posix())
    return buf.getvalue()


def main():
    print("\n=== Deploy Grupo Eades Learning Frontend -> grupoeades.org/learning ===\n")

    # ── 1. Compilar frontend ──────────────────────────────────────────────
    print("[1/5] Compilando frontend (npm run build)...")
    result = subprocess.run(
        "npm run build",
        cwd=str(LOCAL_ROOT),
        capture_output=False,
        shell=True,
    )
    if result.returncode != 0:
        print("ERROR: la build fallo. Revisa los errores arriba.")
        sys.exit(1)

    out_dir = LOCAL_ROOT / "out"
    if not out_dir.exists():
        print("ERROR: no se encontro el directorio 'out/' tras la build.")
        sys.exit(1)
    print("      Build OK")

    # ── 2. SSH: crear directorio y subir receiver ─────────────────────────
    print("[2/5] Preparando servidor via SSH...")
    ssh = ssh_connect()
    ssh_run(ssh, f"mkdir -p {WEB_REMOTE}")
    sftp_put_small(ssh, RECEIVER_PHP.encode(), f"{WEB_REMOTE}/_deploy_recv.php")
    print("      Verificando receiver...")
    ping = http_post("ping")
    if ping != "pong":
        print(f"      ERROR: receiver no responde ({ping!r})")
        ssh.close()
        sys.exit(1)
    print("      Receiver activo")

    # ── 3. Subir archivos estaticos (out/) ────────────────────────────────
    print("[3/5] Subiendo archivos estaticos...")
    zip_bytes = build_zip_from_dir(out_dir)
    result_str = upload_zip_chunked(zip_bytes, WEB_REMOTE, "frontend")
    print(f"      {result_str}")

    # ── 4. Escribir .htaccess ─────────────────────────────────────────────
    print("[4/5] Escribiendo .htaccess...")
    http_post("write", {"path": f"{WEB_REMOTE}/.htaccess", "data": HTACCESS})
    print("      OK")

    # ── 5. Limpieza ───────────────────────────────────────────────────────
    print("[5/5] Limpiando receiver...")
    http_post("self_destruct")
    ssh.close()
    print("      OK")
    print(f"\n✅ Frontend desplegado en: https://grupoeades.org/learning/")


if __name__ == "__main__":
    if not SSH_PASSWORD:
        print("ERROR: Configura SSH_PASSWORD como variable de entorno")
        print("  PowerShell: $env:SSH_PASSWORD='tu_password'; python deploy_frontend.py")
        sys.exit(1)
    main()
