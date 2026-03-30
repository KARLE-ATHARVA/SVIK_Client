export default function ToggleBar() {
  return (
    <div className="flex gap-2 mb-4">
      <button className="px-4 py-1.5 text-sm rounded bg-[#1F3A5F] text-white">
        Wall
      </button>
      <button className="px-4 py-1.5 text-sm rounded bg-gray-100 text-gray-700">
        Floor
      </button>
    </div>
  )
}