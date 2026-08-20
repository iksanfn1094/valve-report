import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Documentation</h1>
        <Link href="/reports" className="text-blue-600 hover:underline text-sm">
          &larr; Kembali ke Reports
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow border p-6 space-y-6">
        <section>
          <h2 className="text-lg font-bold text-blue-900 mb-2">Valve Report System</h2>
          <p className="text-gray-600 text-sm">
            Sistem pencatatan report untuk pekerjaan valve maintenance &amp; repair.
            Memungkinkan tim untuk membuat, mengedit, dan export Inspection Report secara online.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-blue-900 mb-2">Cara Menggunakan</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li><strong>Buat Report Baru</strong> &mdash; Klik &quot;+ New Report&quot; di navbar, isi Job Number dan data valve.</li>
            <li><strong>Isi Inspection Items</strong> &mdash; Buka report, klik &quot;+ Tambah Baris&quot;, pilih komponen, isi condition, centang recommendation (C/RP/RE), pilih Repair Category.</li>
            <li><strong>Upload Foto</strong> &mdash; Setelah simpan baris, klik &quot;+ Foto&quot; untuk upload foto per komponen.</li>
            <li><strong>Isi BOM</strong> &mdash; Klik tombol &quot;BOM&quot; untuk mengisi Bill of Material.</li>
            <li><strong>Export</strong> &mdash; Klik &quot;Export PDF&quot; atau &quot;Export Excel&quot; untuk download file.</li>
            <li><strong>Status</strong> &mdash; Ubah status report: Draft &rarr; Submitted &rarr; Approved.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-blue-900 mb-2">Kolom Recommendation</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-green-50 rounded p-3 text-center">
              <div className="font-bold text-green-700">C (Clean)</div>
              <div className="text-gray-500 text-xs">Komponen bersih, tidak perlu perbaikan</div>
            </div>
            <div className="bg-yellow-50 rounded p-3 text-center">
              <div className="font-bold text-yellow-700">RP (Repair)</div>
              <div className="text-gray-500 text-xs">Komponen perlu diperbaiki</div>
            </div>
            <div className="bg-red-50 rounded p-3 text-center">
              <div className="font-bold text-red-700">RE (Replace)</div>
              <div className="text-gray-500 text-xs">Komponen perlu diganti</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-blue-900 mb-2">Repair Category</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 rounded p-3 text-center">
              <div className="font-bold text-blue-700">Inspection</div>
              <div className="text-gray-500 text-xs">Pemeriksaan rutin</div>
            </div>
            <div className="bg-orange-50 rounded p-3 text-center">
              <div className="font-bold text-orange-700">Minor</div>
              <div className="text-gray-500 text-xs">Perbaikan kecil</div>
            </div>
            <div className="bg-red-50 rounded p-3 text-center">
              <div className="font-bold text-red-700">Major</div>
              <div className="text-gray-500 text-xs">Perbaikan besar / penggantian</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-blue-900 mb-2">Export Format</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li><strong>PDF</strong> &mdash; Format Inspection Report lengkap dengan tabel, foto, BOM, dan signature.</li>
            <li><strong>Excel</strong> &mdash; 4 sheet: Valve Details, Inspection Items, Summary, BOM.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-blue-900 mb-2">Tim / Signatures</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
            <div><span className="font-medium">QC Inspected</span><br/>Diisi manual</div>
            <div><span className="font-medium">Engineering</span><br/>Diisi manual</div>
            <div><span className="font-medium">Workshop Co.</span><br/>Wistanto</div>
            <div><span className="font-medium">Project Manager</span><br/>FN Iksan</div>
          </div>
        </section>
      </div>
    </div>
  )
}
