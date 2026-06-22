import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  ContactRound,
  Hand,
  Server,
  UserCircle,
} from "lucide-react";

const actions = [
  {
    title: "Getting Started",
    description:
      "Everything you need to know to get started and get to work in ChatCloud.",
    href: "#",
    icon: ArrowRight,
    iconForeground: "text-zinc-900 dark:text-zinc-100",
    iconBackground: "bg-zinc-100 dark:bg-zinc-900",
    ringColorClass: "ring-zinc-200 dark:ring-zinc-800",
  },
  {
    title: "Admin Settings",
    description:
      "Learn how to manage your current workspace or your enterprise space.",
    href: "#",
    icon: UserCircle,
    iconForeground: "text-red-600 dark:text-red-400",
    iconBackground: "bg-red-50 dark:bg-red-950/20",
    ringColorClass: "ring-red-600/10 dark:ring-red-400/10",
  },
  {
    title: "Server Setup",
    description:
      "Connect, simplify, and automate. Discover the power of apps and tools.",
    href: "#",
    icon: Server,
    iconForeground: "text-zinc-900 dark:text-zinc-100",
    iconBackground: "bg-zinc-100 dark:bg-zinc-900",
    ringColorClass: "ring-zinc-200 dark:ring-zinc-800",
  },
  {
    title: "Login and Verification",
    description:
      "Read on to learn how to sign in with your email address, or your Apple or Google.",
    href: "#",
    icon: CheckCircle,
    iconForeground: "text-zinc-900 dark:text-zinc-100",
    iconBackground: "bg-zinc-100 dark:bg-zinc-900",
    ringColorClass: "ring-zinc-200 dark:ring-zinc-800",
  },
  {
    title: "Account Setup",
    description:
      "Adjust your profile and preferences to make ChatCloud work just for you.",
    href: "#",
    icon: ContactRound,
    iconForeground: "text-zinc-900 dark:text-zinc-100",
    iconBackground: "bg-zinc-100 dark:bg-zinc-900",
    ringColorClass: "ring-zinc-200 dark:ring-zinc-800",
  },
  {
    title: "Trust & Safety",
    description:
      "Trust on our current database and learn how we distribute your data.",
    href: "#",
    icon: Hand,
    iconForeground: "text-zinc-900 dark:text-zinc-100",
    iconBackground: "bg-zinc-100 dark:bg-zinc-900",
    ringColorClass: "ring-zinc-200 dark:ring-zinc-800",
  },
];

export default function GridList03() {
  return (
    <div className="flex items-center justify-center p-4 w-full">
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px p-px w-full max-w-5xl">
        {actions.map((action) => (
          <Card
            key={action.title}
            className={cn(
              "group relative rounded-lg border-0 bg-white dark:bg-zinc-950 p-0 shadow-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset"
            )}
          >
            <CardContent className="p-6">
              <div>
                <span
                  className={cn(
                    action.iconBackground,
                    action.iconForeground,
                    "inline-flex rounded-lg p-3 ring-2 ring-inset",
                    action.ringColorClass
                  )}
                >
                  <action.icon aria-hidden="true" className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-balance text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  <a href={action.href} className="focus:outline-none">
                    <span aria-hidden="true" className="absolute inset-0" />
                    {action.title}
                  </a>
                </h3>
                <p className="text-pretty mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {action.description}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-6 right-6 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"
              >
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
