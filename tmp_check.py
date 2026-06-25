import paramiko, os, sys
sys.stdout.reconfigure(encoding="utf-8")
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("145.223.105.59", port=65002, username="u286274846", password=os.environ["SSH_PASSWORD"], timeout=15)
def run(cmd, timeout=30):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    return o.read().decode("utf-8","replace").strip()
def write_remote(path, content):
    sftp = c.open_sftp()
    with sftp.file(path, "w") as f:
        f.write(content)
    sftp.close()
    print(f"  Wrote: {path}")

BACKEND = "/home/u286274846/gelearningbackend_app"
PHP84   = "/opt/alt/php84/usr/bin/php"

controller = r"""<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\StudentSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SubmissionController extends Controller
{
    use ApiResponse;

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

        $user       = $request->user();
        $course     = $lesson->module->course;
        $courseSlug = Str::slug($course->title, '_');
        $file       = $request->file('file');
        $ext        = $file->getClientOriginalExtension();
        $stored     = "{$user->id}_" . Str::uuid() . ".{$ext}";
        $path       = "tareas/{$courseSlug}/lesson_{$lesson->id}/{$stored}";

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
        $user       = $request->user();
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
print(run(f"cd {BACKEND} && {PHP84} artisan route:clear && {PHP84} artisan cache:clear 2>&1"))
c.close()
