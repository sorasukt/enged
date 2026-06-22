import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/sidebar-02/app-sidebar";
import GridList03 from "./components/GridList03";
import Dialog12 from "./components/Dialog12";
import { Separator } from "@/components/ui/separator";

function App() {
  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden">
        <DashboardSidebar />
        
        <SidebarInset className="flex flex-col flex-1 overflow-y-auto">
          {/* Header Bar */}
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-900 px-6">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</span>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Overview</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Dialog12 />
            </div>
          </header>
          
          {/* Main workspace */}
          <main className="flex-1 p-6 md:p-10 flex flex-col items-center justify-start overflow-y-auto bg-zinc-50/30 dark:bg-zinc-950/30">
            <div className="max-w-5xl w-full text-left space-y-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Welcome back
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                  Here is what's happening with your workspace.
                </p>
              </div>
              
              <GridList03 />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default App;
