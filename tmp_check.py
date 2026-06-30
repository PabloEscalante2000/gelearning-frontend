import paramiko, os, sys
sys.stdout.reconfigure(encoding="utf-8")
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("145.223.105.59", port=65002, username="u286274846", password=os.environ["SSH_PASSWORD"], timeout=15)
def run(cmd, timeout=30):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode("utf-8","replace").strip()

B = "/home/u286274846/gelearningbackend_app"
PHP = "/opt/alt/php84/usr/bin/php"

print("=== routes/api.php ===")
print(run(f"cat {B}/routes/api.php"))

print("\n=== app/Http/Controllers/Api/V1/ (list) ===")
print(run(f"ls {B}/app/Http/Controllers/Api/V1/"))

print("\n=== app/Models/ (list) ===")
print(run(f"ls {B}/app/Models/"))

print("\n=== app/Http/Traits/ ===")
print(run(f"cat {B}/app/Http/Traits/ApiResponse.php"))

print("\n=== config/filesystems.php (local disk) ===")
print(run(f"grep -A5 \"'local'\" {B}/config/filesystems.php | head -20"))

print("\n=== .env relevant ===")
print(run(f"grep -E 'APP_URL|DB_DATABASE|CORS|FILESYSTEM|STORAGE' {B}/.env"))

print("\n=== migrations list ===")
print(run(f"ls {B}/database/migrations/ | tail -20"))

print("\n=== User model isAdmin ===")
print(run(f"grep -A3 'isAdmin\|isInstructor\|role' {B}/app/Models/User.php | head -30"))
c.close()
