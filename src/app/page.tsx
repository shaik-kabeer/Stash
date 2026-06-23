import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Layers,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stats = [
  { value: "₹73,925", label: "Average Portfolio", icon: Wallet },
  { value: "7+", label: "Programs", icon: Layers },
  { value: "93%", label: "Points Utilized", icon: TrendingUp },
];

const features = [
  {
    icon: Layers,
    title: "Aggregate",
    description:
      "Connect every loyalty program — credit cards, airlines, hotels, and cashback — into one unified dashboard.",
    gradient: "from-violet-500 to-indigo-600",
  },
  {
    icon: BarChart3,
    title: "Analyze",
    description:
      "See the true INR value of every point with real-time valuation across all your reward programs.",
    gradient: "from-indigo-500 to-blue-600",
  },
  {
    icon: Sparkles,
    title: "Optimize",
    description:
      "AI-powered recommendations tell you exactly when to redeem, transfer, or earn for maximum value.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bell,
    title: "Monitor",
    description:
      "Never lose points again. Smart expiry alerts and balance tracking keep your portfolio healthy.",
    gradient: "from-cyan-500 to-teal-500",
  },
];

const steps = [
  {
    step: "01",
    title: "Connect Your Programs",
    description:
      "Link your credit cards, airline miles, hotel points, and cashback accounts in seconds.",
  },
  {
    step: "02",
    title: "See Your Full Portfolio",
    description:
      "Instantly view total INR value, program breakdowns, and utilization across all rewards.",
  },
  {
    step: "03",
    title: "Act on AI Insights",
    description:
      "Get personalized recommendations to maximize redemptions and avoid point expiry.",
  },
];

export default function Home() {
  return (
    <div className="min-h-full bg-white">
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0f2e]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <Zap className="size-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              RewardOS
            </span>
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <a
              href="#features"
              className="text-sm text-indigo-200/80 transition-colors hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-indigo-200/80 transition-colors hover:text-white"
            >
              How It Works
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-indigo-100 hover:bg-white/10 hover:text-white"
              )}
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-white text-indigo-950 hover:bg-indigo-50"
              )}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a0f2e] via-[#151b45] to-[#1e1b4b] pt-32 pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/4 size-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute -right-20 top-20 size-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 size-[300px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-indigo-200 backdrop-blur-sm duration-700">
            <Sparkles className="size-3.5 text-violet-400" />
            Intelligent rewards management for India
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both text-5xl font-bold tracking-tight delay-150 duration-700 sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-indigo-100 to-violet-300 bg-clip-text text-transparent">
              The Mint for Rewards
            </span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-indigo-200/80 delay-300 duration-700 sm:text-xl">
            Aggregate all your loyalty points, miles, and cashback in one place.
            Know their true value. Never let rewards expire unused again.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both mt-10 flex flex-col items-center justify-center gap-4 delay-500 duration-700 sm:flex-row">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 px-8 text-base shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-500"
              )}
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 border-white/20 bg-white/5 px-8 text-base text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
              )}
            >
              View Dashboard
            </Link>
          </div>

          {/* Hero preview card */}
          <div className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both mx-auto mt-16 max-w-3xl delay-700 duration-1000">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
              <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-300/70">Total Portfolio Value</p>
                    <p className="text-3xl font-bold text-white sm:text-4xl">
                      ₹73,925
                    </p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/20">
                    <TrendingUp className="size-6 text-emerald-400" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["HDFC SmartBuy", "Amex MR", "IndiGo BluChip"].map(
                    (program, i) => (
                      <div
                        key={program}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left"
                      >
                        <p className="truncate text-xs text-indigo-300/60">
                          {program}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-white">
                          {["₹28,400", "₹22,150", "₹23,375"][i]}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-12 px-6 pb-8">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both rounded-2xl border border-slate-200/80 bg-white/80 p-6 text-center shadow-xl shadow-slate-200/50 backdrop-blur-xl duration-700"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-indigo-50">
                <stat.icon className="size-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-wider text-indigo-600 uppercase">
              Platform
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to master your rewards
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              From aggregation to optimization — RewardOS gives you complete
              visibility and control over every loyalty program you belong to.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/50"
              >
                <CardHeader>
                  <div
                    className={cn(
                      "mb-2 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
                      feature.gradient
                    )}
                  >
                    <feature.icon className="size-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <div
                  className={cn(
                    "absolute -right-8 -bottom-8 size-32 rounded-full bg-gradient-to-br opacity-[0.06] transition-opacity group-hover:opacity-[0.12]",
                    feature.gradient
                  )}
                />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-gradient-to-b from-slate-50 to-white px-6 py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-wider text-indigo-600 uppercase">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to smarter rewards
            </h2>
          </div>

          <div className="relative mt-16 grid gap-8 md:grid-cols-3">
            <div className="absolute top-12 hidden h-0.5 w-full bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200 md:block" />

            {steps.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="relative z-10 mx-auto flex size-16 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-xl font-bold text-indigo-600 shadow-lg shadow-indigo-100/50">
                  {item.step}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0f2e] via-[#151b45] to-[#312e81] px-8 py-16 text-center shadow-2xl shadow-indigo-950/30">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 size-60 rounded-full bg-violet-500/20 blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 size-60 rounded-full bg-indigo-500/20 blur-[80px]" />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to unlock your rewards?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-indigo-200/80">
              Join thousands of smart spenders who maximize every point with
              RewardOS.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 gap-2 bg-white px-8 text-base text-indigo-950 hover:bg-indigo-50"
                )}
              >
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
                )}
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600">
              <Zap className="size-3.5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">RewardOS</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} RewardOS. The Mint for Rewards.
          </p>
        </div>
      </footer>
    </div>
  );
}
