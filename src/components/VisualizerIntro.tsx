export default function VisualizerIntro() {
  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <span className="text-[10px] lg:text-[12px] tracking-[0.4em] font-bold text-amber-600 uppercase">
          SVIK · Visualizer
        </span>
        
        <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mt-4 mb-4 leading-[1.1]">
          Discover <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">
            Comfort in <br /> Every Curve
          </span>
        </h1>

        <div className="w-12 h-1 bg-amber-500 mb-6" />

        <p className="text-sm lg:text-base text-slate-600 leading-relaxed mb-6">
          Experience our premium tiles in high-definition 3D environments. 
        </p>

        <ul className="space-y-3 text-xs lg:text-sm text-slate-500 font-medium">
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 
            Real-time Texture Comparison
          </li>
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 
            Dynamic Lighting Simulation
          </li>
        </ul>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Designed for clarity · Built for confidence
        </p>
      </div>
    </div>
  );
}