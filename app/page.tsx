import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-3xl font-bold text-blue-900">Inspection Report System</h1>
      <p className="text-gray-600 max-w-md text-center">
        Sistem pencatatan inspection report untuk pekerjaan valve maintenance & repair.
      </p>
      <div className="flex gap-4">
        <Link
          href="/reports"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Lihat Reports
        </Link>
        <Link
          href="/reports/new"
          className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition font-medium"
        >
          Buat Report Baru
        </Link>
      </div>
    </div>
  );
}
