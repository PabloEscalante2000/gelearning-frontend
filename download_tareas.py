import paramiko, os, sys, json, re

sys.stdout.reconfigure(encoding="utf-8")

SSH_PASSWORD = os.environ.get("SSH_PASSWORD", "")
if not SSH_PASSWORD:
    print("ERROR: Configura SSH_PASSWORD como variable de entorno")
    sys.exit(1)

BACKEND = "/home/u286274846/gelearningbackend_app"
PHP84 = "/opt/alt/php84/usr/bin/php"
LOCAL_BASE = os.path.join(os.path.dirname(__file__), "tareas_descargadas")

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("145.223.105.59", port=65002, username="u286274846", password=SSH_PASSWORD, timeout=15)

def run(cmd, timeout=60):
    _, out, err = c.exec_command(cmd, timeout=timeout)
    o = out.read().decode("utf-8", errors="replace")
    e = err.read().decode("utf-8", errors="replace")
    return o, e

# Dump submissions with original file_name + student + course + lesson info
tinker_cmd = (
    r"""echo 'echo json_encode(
        \App\Models\StudentSubmission::with(["user:id,name,email","course:id,title","lesson:id,title"])
            ->get(["id","user_id","lesson_id","course_id","file_name","file_path","submitted_at"])
    );' | """ + f"{PHP84} {BACKEND}/artisan tinker 2>/dev/null"
)

out, err = run(tinker_cmd, timeout=60)

# tinker echoes back some noise; extract the JSON array
match = re.search(r"\[.*\]", out, re.DOTALL)
if not match:
    print("ERROR: no se pudo obtener el JSON de submissions.")
    print("STDOUT:", out[:2000])
    print("STDERR:", err[:2000])
    c.close()
    sys.exit(1)

submissions = json.loads(match.group(0))
print(f"Encontradas {len(submissions)} entregas en la base de datos.\n")

def safe(name):
    return re.sub(r'[<>:"/\\|?*]', "_", name).strip() or "sin_nombre"

sftp = c.open_sftp()
ok, failed = 0, 0

for s in submissions:
    course_title = safe(s.get("course", {}).get("title", "curso_desconocido")) if s.get("course") else "curso_desconocido"
    lesson_title = safe(s.get("lesson", {}).get("title", f"leccion_{s['lesson_id']}")) if s.get("lesson") else f"leccion_{s['lesson_id']}"
    user = s.get("user") or {}
    student_name = safe(user.get("name", f"user_{s['user_id']}"))
    student_email = user.get("email", "")

    remote_path = f"{BACKEND}/storage/app/private/{s['file_path']}"
    local_dir = os.path.join(LOCAL_BASE, course_title, lesson_title, f"{student_name} ({student_email})" if student_email else student_name)
    os.makedirs(local_dir, exist_ok=True)
    local_path = os.path.join(local_dir, safe(s["file_name"]))

    try:
        sftp.get(remote_path, local_path)
        ok += 1
        print(f"  [OK] {course_title}/{lesson_title}/{student_name}/{s['file_name']}")
    except Exception as ex:
        failed += 1
        print(f"  [FALLO] {remote_path} -> {ex}")

sftp.close()
c.close()

print(f"\nListo. {ok} archivos descargados, {failed} fallidos.")
print(f"Carpeta: {LOCAL_BASE}")
