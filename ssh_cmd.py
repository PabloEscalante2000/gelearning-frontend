import paramiko, os, sys
sys.stdout.reconfigure(encoding='utf-8')

SSH_PASSWORD = os.environ.get("SSH_PASSWORD", "")
BACKEND = "/home/u286274846/gelearningbackend_app"
PHP84   = "/opt/alt/php84/usr/bin/php"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("145.223.105.59", port=65002, username="u286274846", password=SSH_PASSWORD, timeout=15)

def run(cmd, timeout=60):
    _, out, err = c.exec_command(cmd, timeout=timeout)
    o = out.read().decode("utf-8", errors="replace").strip()
    e = err.read().decode("utf-8", errors="replace").strip()
    return (o + ("\n" + e if e else "")).strip()

def write_remote(path, content):
    sftp = c.open_sftp()
    with sftp.file(path, 'w') as f:
        f.write(content)
    sftp.close()
    print(f"  Wrote: {path}")

# ── 1. LessonType enum ────────────────────────────────────────────────────────
print("=== 1. LessonType enum ===")
enum_content = r"""<?php

namespace App\Enums;

enum LessonType: string
{
    case Video      = 'video';
    case Pdf        = 'pdf';
    case Word       = 'word';
    case Link       = 'link';
    case Submission = 'submission';
}
"""
write_remote(f"{BACKEND}/app/Enums/LessonType.php", enum_content)

# ── 2. Patch LessonController (store + update) ────────────────────────────────
print("\n=== 2. Patch LessonController ===")
lc = run(f"cat {BACKEND}/app/Http/Controllers/Api/V1/LessonController.php")

old_store_val = "            'type'             => ['required', 'in:video,pdf,word,link'],\n            'content_url'      => ['required', 'url'],"
new_store_val = "            'type'             => ['required', 'in:video,pdf,word,link,submission'],\n            'content_url'      => ['nullable', 'string', 'max:2000'],"

old_upd_val   = "            'type'             => ['sometimes', 'required', 'in:video,pdf,word,link'],\n            'content_url'      => ['sometimes', 'required', 'url'],"
new_upd_val   = "            'type'             => ['sometimes', 'required', 'in:video,pdf,word,link,submission'],\n            'content_url'      => ['sometimes', 'nullable', 'string', 'max:2000'],"

ok = True
if old_store_val in lc:
    lc = lc.replace(old_store_val, new_store_val)
    print("  store validation patched")
else:
    ok = False
    print("  ERROR: store validation not found")

if old_upd_val in lc:
    lc = lc.replace(old_upd_val, new_upd_val)
    print("  update validation patched")
else:
    ok = False
    print("  ERROR: update validation not found")

if ok:
    write_remote(f"{BACKEND}/app/Http/Controllers/Api/V1/LessonController.php", lc)

# ── 3. Migration ──────────────────────────────────────────────────────────────
print("\n=== 3. Migration ===")
migration = r"""<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('file_name');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size');
            $table->string('mime_type')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();
            $table->unique(['user_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_submissions');
    }
};
"""
write_remote(f"{BACKEND}/database/migrations/2026_06_25_000001_create_student_submissions_table.php", migration)

# ── 4. StudentSubmission model ────────────────────────────────────────────────
print("\n=== 4. StudentSubmission model ===")
model = r"""<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'lesson_id', 'course_id', 'file_name', 'file_path', 'file_size', 'mime_type', 'submitted_at'])]
class StudentSubmission extends Model
{
    protected $casts = ['submitted_at' => 'datetime', 'file_size' => 'integer'];

    public function user(): BelongsTo   { return $this->belongsTo(User::class); }
    public function lesson(): BelongsTo { return $this->belongsTo(Lesson::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
}
"""
write_remote(f"{BACKEND}/app/Models/StudentSubmission.php", model)

# ── 5. SubmissionController ───────────────────────────────────────────────────
print("\n=== 5. SubmissionController ===")
controller = r"""<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\StudentSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SubmissionController extends BaseController
{
    private function ensureEnrolled(Request $request, Lesson $lesson): void
    {
        $user = $request->user();
        if ($user->isAdmin()) return;
        $courseId = $lesson->module->course_id;
        if (!Enrollment::where('user_id', $user->id)->where('course_id', $courseId)->exists()) {
            abort(403, 'No estás inscrito en este curso.');
        }
    }

    /** POST /api/v1/lessons/{lesson}/submissions — student uploads file */
    public function store(Request $request, Lesson $lesson): JsonResponse
    {
        $this->ensureEnrolled($request, $lesson);

        $request->validate([
            'file' => [
                'required', 'file', 'max:51200',
                'mimes:pdf,doc,docx,ppt,pptx,jpg,jpeg,png,gif,zip,txt,xlsx,xls,csv,mp4',
            ],
        ]);

        $user   = $request->user();
        $course = $lesson->module->course;
        $courseSlug = Str::slug($course->title, '_');
        $file   = $request->file('file');
        $ext    = $file->getClientOriginalExtension();
        $stored = "{$user->id}_" . Str::uuid() . ".{$ext}";
        $path   = "tareas/{$courseSlug}/lesson_{$lesson->id}/{$stored}";

        Storage::disk('local')->put($path, file_get_contents($file->getRealPath()));

        $existing = StudentSubmission::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        if ($existing) {
            Storage::disk('local')->delete($existing->file_path);
            $existing->update([
                'file_name'    => $file->getClientOriginalName(),
                'file_path'    => $path,
                'file_size'    => $file->getSize(),
                'mime_type'    => $file->getMimeType(),
                'submitted_at' => now(),
            ]);
            $submission = $existing->fresh();
        } else {
            $submission = StudentSubmission::create([
                'user_id'      => $user->id,
                'lesson_id'    => $lesson->id,
                'course_id'    => $course->id,
                'file_name'    => $file->getClientOriginalName(),
                'file_path'    => $path,
                'file_size'    => $file->getSize(),
                'mime_type'    => $file->getMimeType(),
                'submitted_at' => now(),
            ]);
        }

        // Auto-mark lesson as complete on submission
        LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            ['completed' => true, 'completed_at' => now()]
        );

        return $this->success($submission, 'Tarea entregada correctamente.');
    }

    /** GET /api/v1/lessons/{lesson}/my-submission — student's own submission */
    public function mySubmission(Request $request, Lesson $lesson): JsonResponse
    {
        $user = $request->user();
        $submission = StudentSubmission::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        return $this->success($submission);
    }

    /** GET /api/v1/lessons/{lesson}/submissions — all submissions (admin/instructor) */
    public function index(Request $request, Lesson $lesson): JsonResponse
    {
        if (!$request->user()?->isAdmin()) abort(403);

        $submissions = StudentSubmission::with('user:id,name,email')
            ->where('lesson_id', $lesson->id)
            ->orderBy('submitted_at', 'desc')
            ->get();

        return $this->success($submissions);
    }

    /** GET /api/v1/submissions/{submission}/download — serve file */
    public function download(Request $request, StudentSubmission $submission): mixed
    {
        $user = $request->user();
        if (!$user->isAdmin() && $submission->user_id !== $user->id) {
            abort(403);
        }

        $fullPath = Storage::disk('local')->path($submission->file_path);
        if (!file_exists($fullPath)) {
            abort(404, 'Archivo no encontrado.');
        }

        return response()->download($fullPath, $submission->file_name);
    }
}
"""
write_remote(f"{BACKEND}/app/Http/Controllers/Api/V1/SubmissionController.php", controller)

# ── 6. Patch routes/api.php ───────────────────────────────────────────────────
print("\n=== 6. Patch routes/api.php ===")
routes = run(f"cat {BACKEND}/routes/api.php")

old_use = "use App\\Http\\Controllers\\Api\\V1\\ModuleAccessController;"
new_use = "use App\\Http\\Controllers\\Api\\V1\\ModuleAccessController;\nuse App\\Http\\Controllers\\Api\\V1\\SubmissionController;"

old_complete = "Route::post('/lessons/{lesson}/complete', [LessonController::class, 'complete']);"
new_complete = """Route::post('/lessons/{lesson}/complete',          [LessonController::class,  'complete']);
        Route::post('/lessons/{lesson}/submissions',        [SubmissionController::class, 'store']);
        Route::get('/lessons/{lesson}/my-submission',       [SubmissionController::class, 'mySubmission']);
        Route::get('/lessons/{lesson}/submissions',         [SubmissionController::class, 'index']);
        Route::get('/submissions/{submission}/download',    [SubmissionController::class, 'download']);"""

if old_use in routes and "SubmissionController" not in routes:
    routes = routes.replace(old_use, new_use)
    print("  Added use SubmissionController")

if old_complete in routes:
    routes = routes.replace(old_complete, new_complete)
    print("  Added submission routes")
    write_remote(f"{BACKEND}/routes/api.php", routes)
else:
    print("  ERROR: complete route not found")

# ── 7. Migrate + caches ───────────────────────────────────────────────────────
print("\n=== 7. Migrate ===")
print(run(f"cd {BACKEND} && {PHP84} artisan migrate --force 2>&1", timeout=90))

print("\n=== 8. Clear caches ===")
print(run(f"cd {BACKEND} && {PHP84} artisan route:clear && {PHP84} artisan config:clear && {PHP84} artisan cache:clear 2>&1"))

print("\n=== 9. Verify routes ===")
print(run(f"cd {BACKEND} && {PHP84} artisan route:list --columns=method,uri | grep submission"))

c.close()
print("\nDone.")
