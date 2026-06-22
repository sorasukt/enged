import Dialog01 from './components/Dialog01'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="max-w-2xl text-center space-y-6 p-8 border border-slate-800 rounded-xl bg-slate-900/50 shadow-2xl backdrop-blur">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Welcome to blocks.so
        </h1>
        <p className="text-lg text-slate-300">
          Your new React app is ready. Tailwind CSS and shadcn/ui are configured and running smoothly!
        </p>
        <div className="pt-4 flex justify-center">
          <Dialog01 />
        </div>
      </div>
    </div>
  )
}

export default App
