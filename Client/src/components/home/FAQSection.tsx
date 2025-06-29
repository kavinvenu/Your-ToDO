import React, { useState } from 'react';

const faqs = [
  { q: "Is this app free?", a: "Yes, you can use all basic features for free." },
  { q: "Can I use it on mobile?", a: "Absolutely! Our app is fully responsive." },
  { q: "How do I invite my team?", a: "Just go to the Team section and send invites by email." },
  { q: "Is my data safe?", a: "We use industry-standard encryption and never share your data." }
];

const FAQSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ background: "#fff", padding: "60px 0" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: 32, color: "#232946", marginBottom: 32 }}>FAQs</h2>
        <div>
          {faqs.map((faq, idx) => (
            <div key={idx} style={{
              borderBottom: "1px solid #e2e8f0",
              padding: "18px 0"
            }}>
              <button
                onClick={() => setOpen(open === idx ? null : idx)}
                style={{
                  background: "none",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 18,
                  color: "#232946",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                {faq.q}
              </button>
              {open === idx && (
                <div style={{ marginTop: 8, color: "#555", fontSize: 16 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;