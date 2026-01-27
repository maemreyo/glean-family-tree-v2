import { Activity, Share2, Shield, Zap } from "lucide-react";

const features = [
  {
    name: "Realtime Updates",
    description: "Changes to your family tree are reflected instantly across all devices.",
    icon: Zap,
  },
  {
    name: "Interactive Visualization",
    description: "Drag, zoom, and explore your family history with an intuitive interactive map.",
    icon: Activity,
  },
  {
    name: "Secure & Private",
    description: "Your data is protected with enterprise-grade security and Row Level Security.",
    icon: Shield,
  },
  {
    name: "Easy Sharing",
    description: "Share your family tree with relatives securely and collaborate in real-time.",
    icon: Share2,
  },
];

export default function Features() {
  return (
    <section id="features" className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Features
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Everything you need to build and preserve your family legacy.
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="relative overflow-hidden rounded-lg border bg-background p-2"
          >
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <feature.icon className="h-12 w-12 text-primary" />
              <div className="space-y-2">
                <h3 className="font-bold">{feature.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
