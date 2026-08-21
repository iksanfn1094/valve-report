import Link from "next/link";

const menus = [
  {
    title: "Site Survei",
    desc: "Form site survey untuk pekerjaan di lapangan",
    href: "/site-survey",
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    title: "Timesheet",
    desc: "Pencatatan waktu kerja harian",
    href: "/timesheet",
    color: "bg-green-600 hover:bg-green-700",
  },
  {
    title: "Report",
    desc: "Inspection report untuk valve maintenance & repair",
    href: "/reports",
    color: "bg-purple-600 hover:bg-purple-700",
  },
  {
    title: "Budgeting",
    desc: "Perencanaan dan pengelolaan anggaran",
    href: "/budgeting",
    color: "bg-orange-600 hover:bg-orange-700",
  },
  {
    title: "Project Control",
    desc: "Monitoring dan kendali proyek",
    href: "/project-control",
    color: "bg-red-600 hover:bg-red-700",
  },
];

export default function Home() {
  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-900">Project &amp; Service Transformation</h1>
        <p className="text-gray-600 mt-2">
          Transform. Execute. Elevate.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {menus.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            className={`${m.color} text-white rounded-xl p-6 shadow-lg transition hover:scale-105`}
          >
            <h2 className="text-xl font-bold">{m.title}</h2>
            <p className="text-sm mt-2 text-white/80">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
