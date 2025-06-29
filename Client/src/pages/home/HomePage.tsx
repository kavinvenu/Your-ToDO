import React from 'react';
import Layout from '../../components/common/Layout';
import FeaturesSection from '../../components/home/FeaturesSection';
import FAQSection from '../../components/home/FAQSection';
import HeroSection from '../../components/home/HeroSection';

const HomePage: React.FC = () => {
  return (
    <Layout>
      <FeaturesSection />
      <div style={{ background: "#f0f4f8", padding: "40px 0" }}>
        <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: 32, color: "#2d3748" }}>Why Choose Us?</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 32 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #e2e8f0" }}>
            <h3 style={{ color: "#3182ce" }}>Fast</h3>
            <p>Lightning quick task management for busy people.</p>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #e2e8f0" }}>
            <h3 style={{ color: "#38a169" }}>Simple</h3>
            <p>No clutter, just your tasks and progress.</p>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px #e2e8f0" }}>
            <h3 style={{ color: "#d69e2e" }}>Reliable</h3>
            <p>Never lose your work, always in sync.</p>
          </div>
        </div>
      </div>
      <HeroSection />
      <FAQSection />
    </Layout>
  );
};

export default HomePage;