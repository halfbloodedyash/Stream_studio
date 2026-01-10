"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Zap,
  Globe,
  Mic,
  Monitor,
  Hexagon,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";

// FAQ Item Component with accordion toggle
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.active : ""}`}>
      <button className={styles.faqQuestion} onClick={() => setIsOpen(!isOpen)}>
        {question}
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        />
      </button>
      {isOpen && <div className={styles.faqAnswer}>{answer}</div>}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [isHoveringMockup, setIsHoveringMockup] = useState(false);

  const handleCreateStudio = () => {
    const roomId = Math.random().toString(36).substring(2, 10);
    router.push(`/studio/${roomId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.noise} />
      <div className={styles.gridOverlay} />

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.liveBug} />
          <span>StreamStudio</span>
        </div>
        <nav className={styles.nav}>
          <a href="#manifesto" className={styles.navLink}>Manifesto</a>
          <a href="#specs" className={styles.navLink}>Specs</a>
          <Link href={user ? "/dashboard" : "/login"} className={styles.navLink}>
            {user ? "Control Room" : "Login"}
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroEyebrow}>
            <Activity size={16} />
            <span>System Operational // v2.0 Ready</span>
          </div>

          <h1 className={styles.heroTitle}>
            <span>BROADCAST</span>
            <span className={styles.outline}>YOURSELF</span>
          </h1>

          <p className={styles.heroDesc}>
            The raw power of a television studio in your browser.
            Zero latency. Total control. Industrial grade.
          </p>

          <div className={styles.ctaGroup}>
            <button className={styles.primaryBtn} onClick={handleCreateStudio}>
              Initialize Studio
            </button>
            <button className={styles.secondaryBtn}>
              Read Docs
            </button>
          </div>
        </section>

        {/* TICKER STRIP */}
        <section className={styles.tickerWraper}>
          <div className={styles.tickerContent}>
            <span className={styles.tickerItem}>LIVE ANYWHERE</span>
            <span className={styles.tickerItem}>//</span>
            <span className={styles.tickerItem}>4K STREAMING</span>
            <span className={styles.tickerItem}>//</span>
            <span className={styles.tickerItem}>ZERO LATENCY</span>
            <span className={styles.tickerItem}>//</span>
            <span className={styles.tickerItem}>MULTI-TRACK RECORDING</span>
            <span className={styles.tickerItem}>//</span>
            <span className={styles.tickerItem}>LIVE ANYWHERE</span>
            <span className={styles.tickerItem}>//</span>
            <span className={styles.tickerItem}>4K STREAMING</span>
            <span className={styles.tickerItem}>//</span>
            <span className={styles.tickerItem}>ZERO LATENCY</span>
            <span className={styles.tickerItem}>//</span>
            <span className={styles.tickerItem}>MULTI-TRACK RECORDING</span>
          </div>
        </section>

        {/* INTERFACE SHOWCASE */}
        <section className={styles.showcaseSection}>
          <div
            className={styles.showcaseFrame}
            onMouseEnter={() => setIsHoveringMockup(true)}
            onMouseLeave={() => setIsHoveringMockup(false)}
          >
            <div className={styles.interface}>
              <div className={styles.interfaceHeader}>
                <div className={styles.recTag}>
                  <div className={styles.liveBug} />
                  <span>REC 00:04:23</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                </div>
              </div>
              <div className={styles.interfaceGrid}>
                <div className={styles.mainFeed}>
                  <Monitor size={64} className={styles.placeholderIcon} />
                  <div className={styles.overlay}>
                    MAIN FEED
                  </div>
                </div>
                <div className={styles.guestSide}>
                  <div className={styles.guestTile}>
                    <div className="absolute top-2 left-2 text-[10px] font-mono text-zinc-500">CAM 01</div>
                  </div>
                  <div className={styles.guestTile}>
                    <div className="absolute top-2 left-2 text-[10px] font-mono text-zinc-500">CAM 02</div>
                  </div>
                  <div className={styles.guestTile}>
                    <div className="absolute top-2 left-2 text-[10px] font-mono text-zinc-500">SCREEN</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section className={styles.comparison} id="specs">
          <div className={styles.compCol}>
            <h3>Legacy Systems</h3>
            <div className={`${styles.compItem} ${styles.bad}`}>Generic "Blue Tech" Aesthetic</div>
            <div className={`${styles.compItem} ${styles.bad}`}>Clunky OBS Setup</div>
            <div className={`${styles.compItem} ${styles.bad}`}> Expensive Hardware</div>
            <div className={`${styles.compItem} ${styles.bad}`}>5s+ Latency</div>
          </div>
          <div className={styles.compCol}>
            <h3 style={{ color: 'var(--accent-primary)' }}>StreamStudio</h3>
            <div className={`${styles.compItem} ${styles.good}`}>
              <Check size={16} className="inline mr-2 text-green-500" />
              Industrial Design
            </div>
            <div className={`${styles.compItem} ${styles.good}`}>
              <Check size={16} className="inline mr-2 text-green-500" />
              Browser Native
            </div>
            <div className={`${styles.compItem} ${styles.good}`}>
              <Check size={16} className="inline mr-2 text-green-500" />
              Cloud Powered
            </div>
            <div className={`${styles.compItem} ${styles.good}`}>
              <Check size={16} className="inline mr-2 text-green-500" />
              Real-time
            </div>
          </div>
        </section>


        {/* TESTIMONIALS (Signal Intercepts) */}
        <section className={styles.testimonials}>
          <div className={styles.heroEyebrow}>
            <Activity size={16} />
            <span>Intercepted Transmissions</span>
          </div>
          <div className={styles.testimonialGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.tAvatar} />
                <p className={styles.tText}>
                  "StreamStudio rewrote the protocol. We abandoned OBS entirely. The latency is practically non-existent."
                </p>
                <div className={styles.tAuthor}>// SARAH_CONNOR_CREATIVE</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING (Clearance Levels) */}
        <section className={styles.pricing} id="pricing">
          <h2 className={styles.gridTitle}>Clearance Levels</h2>
          <div className={styles.pricingGrid}>
            {/* Level 1 */}
            <div className={styles.pricingCard}>
              <div className={styles.pricingLevel}>Level 1: Public</div>
              <div className={styles.pricingPrice}>$0 <span>/mo</span></div>
              <ul className={styles.pricingFeatures}>
                <li><Check size={14} /> 720p Streaming</li>
                <li><Check size={14} /> 1 Guest</li>
                <li><Check size={14} /> Standard Overlays</li>
              </ul>
              <button className={styles.pricingBtn}>Initiate</button>
            </div>

            {/* Level 2 (Featured) */}
            <div className={`${styles.pricingCard} ${styles.featured}`}>
              <div className="absolute top-0 right-0 bg-[#FF3300] text-black text-[10px] font-bold px-2 py-1 uppercase">
                Recommended
              </div>
              <div className={styles.pricingLevel}>Level 2: Director</div>
              <div className={styles.pricingPrice}>$29 <span>/mo</span></div>
              <ul className={styles.pricingFeatures}>
                <li><Check size={14} /> 1080p Streaming</li>
                <li><Check size={14} /> 6 Guests</li>
                <li><Check size={14} /> Custom Branding</li>
                <li><Check size={14} /> Recording (10h)</li>
              </ul>
              <button className={styles.pricingBtn}>Authorize</button>
            </div>

            {/* Level 3 */}
            <div className={styles.pricingCard}>
              <div className={styles.pricingLevel}>Level 3: Executive</div>
              <div className={styles.pricingPrice}>$99 <span>/mo</span></div>
              <ul className={styles.pricingFeatures}>
                <li><Check size={14} /> 4K Streaming</li>
                <li><Check size={14} /> 12 Guests</li>
                <li><Check size={14} /> ISO Recording</li>
                <li><Check size={14} /> Priority Support</li>
              </ul>
              <button className={styles.pricingBtn}>Contact</button>
            </div>
          </div>
        </section>

        {/* FAQ (System Protocols) */}
        <section className={styles.faq}>
          <div className={styles.heroEyebrow}>
            <Monitor size={16} />
            <span>System Protocols</span>
          </div>
          <div className={styles.faqList}>
            <FaqItem
              question="What is the latency protocol?"
              answer="StreamStudio uses WebRTC with sub-500ms glass-to-glass latency. Our infrastructure leverages edge servers globally to ensure real-time communication between hosts and guests, making conversations feel natural and uninterrupted."
            />
            <FaqItem
              question="Is hardware acceleration required?"
              answer="No special hardware is required. StreamStudio runs entirely in your browser using WebCodecs and hardware-accelerated encoding when available. A modern laptop with a webcam is all you need to start broadcasting in professional quality."
            />
            <FaqItem
              question="Can I simulcast to multiple targets?"
              answer="Yes! With Director and Executive clearance levels, you can simulcast your stream to multiple RTMP destinations simultaneously—YouTube, Twitch, LinkedIn, and custom endpoints. Configure your destinations once and go live everywhere with a single click."
            />
            <FaqItem
              question="What video quality is supported?"
              answer="StreamStudio supports up to 4K resolution at 60fps for Executive tier users. All tiers include adaptive bitrate streaming to ensure viewers receive the best quality their connection can handle."
            />
            <FaqItem
              question="How do I invite guests to my stream?"
              answer="Simply share your unique room link with guests. They can join directly from their browser—no downloads or accounts required. As the host, you control who enters your studio through our green room admission system."
            />
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.liveBug} />
              <span>StreamStudio</span>
            </div>
            <p className={styles.footerTagline}>
              Broadcast-grade streaming. Zero compromise.
            </p>
          </div>

          <div className={styles.footerColumns}>
            <div className={styles.footerColumn}>
              <h4>Product</h4>
              <a href="#specs">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#">Changelog</a>
              <a href="#">Roadmap</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Status Page</a>
              <a href="#">Support</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>Company</h4>
              <a href="#manifesto">Manifesto</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>

        <div className={styles.footerDivider} />

        <div className={styles.footerBottom}>
          <div className={styles.footerLegal}>
            <span>© 2024 StreamStudio. All rights reserved.</span>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
          <div className={styles.footerSocial}>
            <a href="#" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" aria-label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="#" aria-label="Discord">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
            </a>
          </div>
        </div>

        <div className={styles.footerSignal}>
          <Activity size={12} />
          <span>SYSTEM STATUS: OPERATIONAL</span>
        </div>
      </footer>
    </div>
  );
}
