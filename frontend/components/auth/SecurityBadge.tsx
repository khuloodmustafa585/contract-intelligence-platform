import { Shield, Lock, CheckCircle2, Wifi } from "lucide-react";

const ITEMS = [
  { icon: Shield,       label: "SOC 2 TYPE II"   },
  { icon: Lock,         label: "AES-256"         },
  { icon: CheckCircle2, label: "GDPR COMPLIANT"  },
  { icon: Wifi,         label: "TLS 1.3"         },
];

export default function SecurityBadge() {
  return (
    <div className="flex items-center justify-center gap-5 flex-wrap">
      {ITEMS.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <Icon size={9} style={{ color: "#1e2d47" }} />
          <span className="font-mono-label" style={{ color: "#141e30", fontSize: "0.55rem" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
