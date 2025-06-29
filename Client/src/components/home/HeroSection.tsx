import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <section style={{ background: "#232946", color: "#fff", padding: "60px 0" }}>
      <div style={{ display: "flex", alignItems: "center", maxWidth: 1200, margin: "0 auto", gap: 48 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}>Organize. Track. Succeed.</h1>
          <p style={{ fontSize: 20, marginBottom: 32 }}>
            A fresh way to manage your tasks and projects. Stay focused and get more done with our minimal, distraction-free interface.
          </p>
          <Link to="/signup" style={{
            background: "#eebbc3",
            color: "#232946",
            padding: "14px 32px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 18,
            textDecoration: "none"
          }}>
            Get Started
          </Link>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <img src="https://undraw.co/api/illustrations/organize.svg" alt="Organize tasks" style={{ width: 340, borderRadius: 24, boxShadow: "0 4px 24px #12162944" }} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;