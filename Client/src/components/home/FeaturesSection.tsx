import React from 'react';
import { Rocket, Users, Smartphone, Lock } from 'lucide-react';

const features = [
  {
    icon: <Rocket size={32} color="#ff8906" />,
    title: "Instant Setup",
    desc: "Start managing your tasks in seconds. No learning curve."
  },
  {
    icon: <Users size={32} color="#6a4c93" />,
    title: "Team Friendly",
    desc: "Invite your team and collaborate in real time."
  },
  {
    icon: <Smartphone size={32} color="#232946" />,
    title: "Mobile Ready",
    desc: "Works perfectly on any device, anywhere."
  },
  {
    icon: <Lock size={32} color="#eebbc3" />,
    title: "Secure",
    desc: "Your data is encrypted and always safe."
  }
];

const FeaturesSection: React.FC = () => (
  <section style={{ background: "#f7f7f7", padding: "60px 0" }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: 36, color: "#232946", marginBottom: 40 }}>Features</h2>
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
        {features.map((f, i) => (
          <div key={i} style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 12px #e2e8f0",
            padding: 32,
            minWidth: 240,
            maxWidth: 260,
            display: "flex",
            alignItems: "center",
            gap: 20
          }}>
            <div>{f.icon}</div>
            <div>
              <h3 style={{ fontWeight: 600, fontSize: 20, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: "#555", fontSize: 15 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;