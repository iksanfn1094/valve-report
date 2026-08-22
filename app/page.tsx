import Link from "next/link";

const menus = [
  {
    title: "FIELD SURVEY",
    tagline: "Capture. Analyze. Execute.",
    desc: "Field data & site survey management.",
    href: "/site-survey",
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    title: "WORKFORCE",
    tagline: "Track. Optimize. Perform.",
    desc: "Manpower, timesheet & productivity management.",
    href: "/timesheet",
    color: "bg-green-600 hover:bg-green-700",
  },
  {
    title: "VALVE SERVICE REPORT",
    tagline: "Inspect. Repair. Verify.",
    desc: "Complete valve service documentation from initial inspection through repair and final verification.",
    href: "/reports",
    color: "bg-purple-600 hover:bg-purple-700",
  },
  {
    title: "PROJECT COST",
    tagline: "Plan. Control. Optimize.",
    desc: "Project budgeting & cost management.",
    href: "/budgeting",
    color: "bg-orange-600 hover:bg-orange-700",
  },
  {
    title: "PROJECT CONTROL",
    tagline: "Plan. Monitor. Deliver.",
    desc: "Project progress, performance & execution control.",
    href: "/project-control",
    color: "bg-red-600 hover:bg-red-700",
  },
];

export default function Home() {
  return (
    <div className="space-y-10 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-900">Project &amp; Service Transformation</h1>
        <p className="text-gray-500 mt-2 text-sm tracking-wide">Transform. Execute. Elevate.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {menus.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            className={`${m.color} text-white rounded-xl p-6 shadow-lg transition hover:scale-105 flex flex-col min-h-[160px]`}
          >
            <h2 className="text-lg font-bold tracking-wide">{m.title}</h2>
            <p className="text-xs text-white/70 mt-1 italic">{m.tagline}</p>
            <p className="text-sm mt-3 text-white/90 leading-relaxed flex-1">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
