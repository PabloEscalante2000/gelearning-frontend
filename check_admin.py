import os, paramiko

SSH_PASSWORD = os.environ.get("SSH_PASSWORD", "")
WEB_REMOTE = "/home/u286274846/domains/grupoeades.org/public_html/learning"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("145.223.105.59", port=65002, username="u286274846", password=SSH_PASSWORD, timeout=15)

cmds = [
    f"test -f {WEB_REMOTE}/admin/users/index.html && echo EXISTS || echo MISSING",
    f"test -f {WEB_REMOTE}/admin/courses/index.html && echo EXISTS || echo MISSING",
    f"test -f {WEB_REMOTE}/courses/index.html && echo EXISTS || echo MISSING",
    f"test -f {WEB_REMOTE}/dashboard/index.html && echo EXISTS || echo MISSING",
    f"ls {WEB_REMOTE}/admin/ 2>&1",
]

labels = ["admin/users/index.html", "admin/courses/index.html", "courses/index.html", "dashboard/index.html", "admin/ contents"]
for label, cmd in zip(labels, cmds):
    print(f"{label}:")
    _, stdout, _ = client.exec_command(cmd, timeout=10)
    print(" ", stdout.read().decode("utf-8", errors="replace").strip())

client.close()
