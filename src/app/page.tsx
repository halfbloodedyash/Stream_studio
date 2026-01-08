"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Users,
  Monitor,
  Layers,
  Radio,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";

const features = [
  {
    icon: Users,
    title: "Multi-Participant",
    description: "Up to 10 guests on screen with individual controls",
  },
  {
    icon: Monitor,
    title: "Screen Sharing",
    description: "Share your screen, windows, or browser tabs",
  },
  {
    icon: Layers,
    title: "Custom Overlays",
    description: "Logos, lower thirds, and branded graphics",
  },
  {
    icon: Radio,
    title: "Multi-Platform",
    description: "Stream to YouTube, Facebook, Twitch & more",
  },
  {
    icon: Zap,
    title: "Low Latency",
    description: "Sub-second delay for real-time interaction",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "End-to-end encryption for all streams",
  },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateStudio = () => {
    setIsCreating(true);
    // Generate a random room ID for demo
    const roomId = Math.random().toString(36).substring(2, 10);
    router.push(`/studio/${roomId}`);
  };

  return (
    <div className={styles.container}>
      {/* Ambient Background */}
      <div className={styles.ambientGlow} />

      {/* Hero Section */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Video className={styles.logoIcon} />
          <span>StreamStudio</span>
        </div>
        <nav className={styles.nav}>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link href="/login" className={styles.signInBtn}>
            {user ? "Dashboard" : "Sign In"}
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>Professional Broadcasting Made Simple</span>
            </div>
            <h1 className={styles.title}>
              Your Browser is Now a
              <span className={styles.gradient}> Live Studio</span>
            </h1>
            <p className={styles.subtitle}>
              Create professional live streams with guests, overlays, and
              multi-platform streaming — entirely from your browser. No
              downloads, no complex setup.
            </p>
            <div className={styles.cta}>
              <button
                className={styles.primaryBtn}
                onClick={handleCreateStudio}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <span className={styles.spinner}></span>
                    Creating Studio...
                  </>
                ) : (
                  <>
                    Create Broadcast
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              <button className={styles.secondaryBtn}>
                <Globe size={18} />
                Watch Demo
              </button>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.studioPreview}>
              <div className={styles.previewHeader}>
                <div className={styles.previewDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className={styles.previewTitle}>StreamStudio</span>
                <div className={styles.liveIndicator}>
                  <span className={styles.liveDot}></span>
                  LIVE
                </div>
              </div>
              <div className={styles.previewContent}>
                <div className={styles.previewGrid}>
                  <div className={styles.previewTile}>
                    <div className={styles.tilePlaceholder}>
                      <Users size={32} />
                    </div>
                    <span className={styles.tileLabel}>Host</span>
                    <div className={`${styles.audioBars} ${styles.active}`}>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                  <div className={styles.previewTile}>
                    <div className={styles.tilePlaceholder}>
                      <Users size={32} />
                    </div>
                    <span className={styles.tileLabel}>Guest 1</span>
                    <div className={styles.audioBars}>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                  <div className={styles.previewTile}>
                    <div className={styles.tilePlaceholder}>
                      <Monitor size={32} />
                    </div>
                    <span className={styles.tileLabel}>Screen</span>
                  </div>
                  <div className={styles.previewTile}>
                    <div className={styles.tilePlaceholder}>
                      <Users size={32} />
                    </div>
                    <span className={styles.tileLabel}>Guest 2</span>
                    <div className={`${styles.audioBars} ${styles.active}`}>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
                <div className={styles.previewOverlay}>
                  <div className={styles.lowerThird}>
                    <span className={styles.lowerThirdName}>John Smith</span>
                    <span className={styles.lowerThirdTitle}>CEO, TechCorp</span>
                  </div>
                </div>
              </div>
              <div className={styles.previewControls}>
                <div className={styles.controlDot}></div>
                <div className={styles.controlDot}></div>
                <div className={styles.controlDot}></div>
                <div className={styles.controlBtn}>Go Live</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={styles.features}>
          <h2 className={styles.sectionTitle}>Everything You Need</h2>
          <p className={styles.sectionSubtitle}>
            Professional broadcasting tools, zero complexity
          </p>
          <div className={styles.featureGrid}>
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={styles.featureCard}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={styles.featureIcon}>
                  <feature.icon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <h2>Ready to Go Live?</h2>
          <p>Start streaming in seconds. No credit card required.</p>
          <button className={styles.primaryBtn} onClick={handleCreateStudio}>
            Create Your First Broadcast
            <ArrowRight size={18} />
          </button>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <Video size={20} />
            <span>StreamStudio</span>
          </div>
          <p>© 2024 StreamStudio. Professional live streaming for everyone.</p>
        </div>
      </footer>
    </div>
  );
}
