import DraggableMenuGrid from "./draggable-menu";

export default function Home() {
  return (
    <div className="space-y-10 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-900">Project &amp; Service Transformation</h1>
        <p className="text-gray-500 mt-2 text-sm tracking-wide">Transform. Execute. Elevate.</p>
        <p className="text-gray-400 mt-1 text-xs">Drag &amp; drop to reorder menu</p>
      </div>
      <DraggableMenuGrid />
    </div>
  );
}
