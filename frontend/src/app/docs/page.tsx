"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Activity,
    Monitor,
    Mic,
    Globe,
    Layers,
    Cpu,
    Terminal,
    Share2,
    Video,
    Shield,
    Zap,
    Users,
    MessageSquare,
    Radio,
    Palette,
    Settings,
    Play,
    AlertTriangle,
    CheckCircle,
    HelpCircle,
    Rocket,
    BookOpen,
    Code,
    Webhook
} from "lucide-react";
import styles from "./docs.module.css";

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("overview");

    // Handle scroll spy for active section
    useEffect(() => {
        const handleScroll = () => {
            const sections = [
                "overview", "getting-started", "interface", "guests",
                "destinations", "overlays", "broadcasting", "troubleshooting"
            ];
            const scrollPosition = window.scrollY + 200;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveSection(section);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: "smooth"
            });
        }
    };

    const NavLink = ({ id, children }: { id: string; children: React.ReactNode }) => (
        <a
            href={`#${id}`}
            className={`${styles.navLink} ${activeSection === id ? styles.active : ''}`}
            onClick={(e) => { e.preventDefault(); scrollTo(id); }}
        >
            {children}
        </a>
    );

    return (
        <div className={styles.container}>
            <div className={styles.noise} />

            {/* Sidebar Navigation */}
            <aside className={styles.sidebar}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.liveBug} />
                    <span className={styles.logoText}>StreamStudio Docs</span>
                </Link>

                <nav>
                    <div className={styles.navGroup}>
                        <div className={styles.navTitle}>Getting Started</div>
                        <NavLink id="overview">System Overview</NavLink>
                        <NavLink id="getting-started">Quick Start Guide</NavLink>
                    </div>

                    <div className={styles.navGroup}>
                        <div className={styles.navTitle}>User Guide</div>
                        <NavLink id="interface">Studio Interface</NavLink>
                        <NavLink id="guests">Guest Management</NavLink>
                        <NavLink id="destinations">Destinations</NavLink>
                        <NavLink id="overlays">Overlays & Branding</NavLink>
                        <NavLink id="broadcasting">Going Live</NavLink>
                    </div>

                    <div className={styles.navGroup}>
                        <div className={styles.navTitle}>Support</div>
                        <NavLink id="troubleshooting">Troubleshooting</NavLink>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {/* HERO SECTION */}
                <div id="overview" className={styles.hero}>
                    <div className={styles.eyebrow}>
                        <Terminal size={14} />
                        <span>Documentation v2.1.0</span>
                    </div>
                    <h1>System Manual</h1>
                    <p className={styles.lead}>
                        Comprehensive documentation for the StreamStudio broadcasting platform.
                        Master the controls, understand the architecture, and look behind the curtain.
                    </p>
                </div>

                {/* OVERVIEW SECTION */}
                <section className={styles.section}>
                    <h2>Why StreamStudio?</h2>
                    <p>
                        StreamStudio redefines browser-based broadcasting by prioritizing <span className={styles.inlineCode}>zero-latency performance</span> and
                        <span className={styles.inlineCode}> industrial aesthetics</span>. Unlike legacy tools like OBS or StreamYard,
                        we focus on providing a raw, powerful interface that feels like a physical piece of hardware.
                    </p>

                    <div className={styles.featureGrid}>
                        <div className={styles.featureCard}>
                            <Zap size={20} className={styles.featureIcon} />
                            <div className={styles.featureTitle}>Instant Response</div>
                            <div className={styles.featureDesc}>Sub-500ms latency interactions via WebRTC and Edge Network routing.</div>
                        </div>
                        <div className={styles.featureCard}>
                            <Layers size={20} className={styles.featureIcon} />
                            <div className={styles.featureTitle}>Composer Engine</div>
                            <div className={styles.featureDesc}>Drag-and-drop scene composition with real-time layer management.</div>
                        </div>
                        <div className={styles.featureCard}>
                            <Shield size={20} className={styles.featureIcon} />
                            <div className={styles.featureTitle}>Secure Streams</div>
                            <div className={styles.featureDesc}>Token-based authentication and encrypted media transport.</div>
                        </div>
                        <div className={styles.featureCard}>
                            <Users size={20} className={styles.featureIcon} />
                            <div className={styles.featureTitle}>Multi-Guest Support</div>
                            <div className={styles.featureDesc}>Invite up to 12 guests with dedicated Green Room admission.</div>
                        </div>
                        <div className={styles.featureCard}>
                            <Globe size={20} className={styles.featureIcon} />
                            <div className={styles.featureTitle}>Multi-Platform</div>
                            <div className={styles.featureDesc}>Simulcast to YouTube, Twitch, LinkedIn, and custom RTMP endpoints.</div>
                        </div>
                        <div className={styles.featureCard}>
                            <MessageSquare size={20} className={styles.featureIcon} />
                            <div className={styles.featureTitle}>Unified Chat</div>
                            <div className={styles.featureDesc}>Aggregate chat from all platforms into a single, manageable feed.</div>
                        </div>
                    </div>
                </section>

                {/* GETTING STARTED SECTION */}
                <section id="getting-started" className={styles.section}>
                    <h2><Rocket size={24} /> Quick Start Guide</h2>
                    <p>
                        Get your first broadcast running in under 5 minutes.
                    </p>

                    <h3>Step 1: Create a Broadcast</h3>
                    <p>
                        From the <span className={styles.inlineCode}>Dashboard</span>, click the <strong>"New Operation"</strong> button.
                        This creates a new broadcast room with a unique ID. You'll be redirected to the Studio immediately.
                    </p>

                    <h3>Step 2: Configure Your Devices</h3>
                    <p>
                        Before entering the Studio, you'll pass through the <strong>Green Room</strong> where you can:
                    </p>
                    <ul>
                        <li>Select your camera and microphone</li>
                        <li>Preview your video feed</li>
                        <li>Adjust audio levels</li>
                        <li>Check your network quality indicator</li>
                    </ul>

                    <h3>Step 3: Add a Destination</h3>
                    <p>
                        In the Studio, open the <strong>Destinations</strong> panel from the right sidebar.
                        Add your streaming platform credentials (YouTube, Twitch, or custom RTMP).
                    </p>
                    <div className={styles.codeBlock}>
                        <code>
                            Platform: YouTube Live<br />
                            Stream Key: xxxx-xxxx-xxxx-xxxx<br />
                            Server URL: rtmp://a.rtmp.youtube.com/live2
                        </code>
                    </div>

                    <h3>Step 4: Go Live!</h3>
                    <p>
                        Press the <span className={styles.inlineCode}>GO LIVE</span> button in the Control Deck.
                        Your stream will begin immediately with health monitoring displayed in real-time.
                    </p>
                </section>

                {/* INTERFACE SECTION */}
                <section id="interface" className={styles.section}>
                    <h2><Monitor size={24} /> Studio Interface</h2>
                    <p>The Studio is divided into four primary zones for maximum control.</p>

                    <h3>1. Canvas (The Viewport)</h3>
                    <p>
                        The central area displays the active program feed—exactly what your viewers see.
                        It supports drag-and-drop manipulation of sources when in <span className={styles.inlineCode}>Edit Mode</span>.
                    </p>
                    <ul>
                        <li><strong>Camera Sources:</strong> Your webcam and guest video feeds</li>
                        <li><strong>Screen Shares:</strong> Entire screen, window, or browser tab captures</li>
                        <li><strong>Images:</strong> Logos, backgrounds, and static graphics</li>
                        <li><strong>Text Overlays:</strong> Dynamic lower-thirds and titles</li>
                    </ul>

                    <h3>2. Control Deck (Bottom Bar)</h3>
                    <p>
                        Primary broadcast controls for quick access:
                    </p>
                    <ul>
                        <li><strong>Mic Toggle:</strong> Hardware-level mute with visual indicator</li>
                        <li><strong>Cam Toggle:</strong> Instantly disable/enable video</li>
                        <li><strong>Screen Share:</strong> Start/stop screen capture</li>
                        <li><strong>Edit Mode:</strong> Toggle scene composition editing</li>
                        <li><strong>GO LIVE:</strong> The "Big Red Button" that initiates RTMP egress</li>
                        <li><strong>Stream Timer:</strong> Live duration counter when broadcasting</li>
                    </ul>

                    <h3>3. Left Sidebar (Command Panel)</h3>
                    <p>
                        Multi-function sidebar with tabbed navigation:
                    </p>
                    <ul>
                        <li><strong>Scenes:</strong> Switch between predefined layouts (Solo, Duo, PIP, Grid)</li>
                        <li><strong>Guests:</strong> View Green Room waiting list, admit or remove guests</li>
                        <li><strong>Banners:</strong> Manage and push lower-thirds and ticker text</li>
                        <li><strong>Brand:</strong> Configure custom brand colors, logos, and fonts</li>
                    </ul>

                    <h3>4. Right Sidebar (Data Panel)</h3>
                    <p>
                        Real-time monitoring and chat integration:
                    </p>
                    <ul>
                        <li><strong>Chat:</strong> Unified chat stream from all connected platforms</li>
                        <li><strong>Destinations:</strong> Stream health, bitrate, and connection status</li>
                        <li><strong>Analytics:</strong> Live viewer count and engagement metrics</li>
                    </ul>
                </section>

                {/* GUESTS SECTION */}
                <section id="guests" className={styles.section}>
                    <h2><Users size={24} /> Guest Management</h2>
                    <p>
                        StreamStudio makes it easy to bring guests into your broadcast with a secure, streamlined flow.
                    </p>

                    <h3>Inviting Guests</h3>
                    <p>
                        From the <strong>Guests</strong> tab in the left sidebar, click <span className={styles.inlineCode}>Generate Invite Link</span>.
                        Share this unique URL with your guest—no account or download required.
                    </p>

                    <h3>The Green Room</h3>
                    <p>
                        When a guest clicks the invite link, they enter the <strong>Green Room</strong>:
                    </p>
                    <ul>
                        <li>They can preview their camera and microphone</li>
                        <li>Adjust audio/video settings before joining</li>
                        <li>Wait for host admission</li>
                    </ul>

                    <h3>Admission Control</h3>
                    <p>
                        As the host, you'll see a notification when a guest is waiting. From the Guests panel:
                    </p>
                    <ul>
                        <li><strong>Admit:</strong> Bring the guest into the live studio</li>
                        <li><strong>Reject:</strong> Decline the guest's request to join</li>
                        <li><strong>Remove:</strong> Eject a guest from the active broadcast</li>
                    </ul>

                    <h3>Guest Limits by Plan</h3>
                    <div className={styles.codeBlock}>
                        <code>
                            Level 1 (Public):     1 Guest<br />
                            Level 2 (Director):   6 Guests<br />
                            Level 3 (Executive): 12 Guests
                        </code>
                    </div>
                </section>

                {/* DESTINATIONS SECTION */}
                <section id="destinations" className={styles.section}>
                    <h2><Radio size={24} /> Destinations & Multi-streaming</h2>
                    <p>
                        Configure where your broadcast is sent. StreamStudio supports simultaneous streaming to multiple platforms.
                    </p>

                    <h3>Supported Platforms</h3>
                    <ul>
                        <li><strong>YouTube Live:</strong> Direct integration with OAuth authentication</li>
                        <li><strong>Twitch:</strong> Stream key based connection</li>
                        <li><strong>Facebook Live:</strong> Page and profile streaming</li>
                        <li><strong>LinkedIn Live:</strong> Professional broadcast mode</li>
                        <li><strong>Custom RTMP:</strong> Any RTMP-compatible server</li>
                    </ul>

                    <h3>Adding a Destination</h3>
                    <p>
                        Open the <strong>Destinations</strong> panel from the right sidebar:
                    </p>
                    <ol>
                        <li>Click <span className={styles.inlineCode}>+ Add Destination</span></li>
                        <li>Select platform or choose "Custom RTMP"</li>
                        <li>Enter your Stream Key and Server URL</li>
                        <li>Click <span className={styles.inlineCode}>Test Connection</span> to verify</li>
                        <li>Save the destination</li>
                    </ol>

                    <h3>Multi-streaming (Simulcast)</h3>
                    <p>
                        On Director and Executive plans, you can stream to multiple destinations simultaneously.
                        Our cloud infrastructure handles the transcoding—your local bandwidth is only used once.
                    </p>
                    <div className={styles.codeBlock}>
                        <code>
              // How simulcast works<br />
                            Your Browser → StreamStudio Cloud → YouTube<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Twitch<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Custom RTMP
                        </code>
                    </div>

                    <h3>Stream Health Monitoring</h3>
                    <p>
                        Each active destination displays real-time metrics:
                    </p>
                    <ul>
                        <li><strong>Connection Status:</strong> Connected, Connecting, Error</li>
                        <li><strong>Bitrate:</strong> Current upload speed in Kbps</li>
                        <li><strong>Duration:</strong> Time since stream started</li>
                        <li><strong>Dropped Frames:</strong> Quality indicator</li>
                    </ul>
                </section>

                {/* OVERLAYS SECTION */}
                <section id="overlays" className={styles.section}>
                    <h2><Palette size={24} /> Overlays & Branding</h2>
                    <p>
                        Customize your broadcast with professional overlays and consistent branding.
                    </p>

                    <h3>Banner System</h3>
                    <p>
                        The <strong>Banners</strong> panel lets you create and push lower-third text overlays:
                    </p>
                    <ul>
                        <li><strong>Title Banners:</strong> Guest names, segment titles</li>
                        <li><strong>Ticker Text:</strong> Scrolling announcements</li>
                        <li><strong>One-Click Push:</strong> Show/hide banners instantly</li>
                    </ul>

                    <h3>Brand Customization</h3>
                    <p>
                        From the <strong>Brand</strong> tab, configure your visual identity:
                    </p>
                    <ul>
                        <li><strong>Primary Color:</strong> Used for accents and overlays</li>
                        <li><strong>Logo:</strong> Upload a PNG or SVG for watermark</li>
                        <li><strong>Background:</strong> Custom backdrop for scenes</li>
                        <li><strong>Typography:</strong> Select from preset font families</li>
                    </ul>

                    <h3>Scene Layouts</h3>
                    <p>
                        Pre-built layouts optimize common broadcasting scenarios:
                    </p>
                    <div className={styles.featureGrid}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureTitle}>Solo</div>
                            <div className={styles.featureDesc}>Full-screen single presenter view</div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureTitle}>Duo</div>
                            <div className={styles.featureDesc}>Side-by-side for interviews</div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureTitle}>PIP (Picture-in-Picture)</div>
                            <div className={styles.featureDesc}>Main feed with small overlay</div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureTitle}>Grid</div>
                            <div className={styles.featureDesc}>Equal tiles for panel discussions</div>
                        </div>
                    </div>
                </section>

                {/* BROADCASTING SECTION */}
                <section id="broadcasting" className={styles.section}>
                    <h2><Play size={24} /> Going Live</h2>

                    <h3>Pre-Flight Checklist</h3>
                    <p>
                        Before hitting the GO LIVE button, verify:
                    </p>
                    <ul>
                        <li>At least one destination is configured and tested</li>
                        <li>Camera and microphone are working properly</li>
                        <li>Audio levels are visible in the level meter</li>
                        <li>Scene layout matches your intended format</li>
                        <li>Overlays and banners are prepared</li>
                    </ul>

                    <h3>Starting a Broadcast</h3>
                    <ol>
                        <li>Click the <span className={styles.inlineCode}>GO LIVE</span> button in the Control Deck</li>
                        <li>Confirm the action in the dialog</li>
                        <li>Wait for connection confirmation (green status)</li>
                        <li>Your stream is now live!</li>
                    </ol>

                    <h3>During the Broadcast</h3>
                    <p>
                        While live, you have full control:
                    </p>
                    <ul>
                        <li>Switch scenes without interruption</li>
                        <li>Push/dismiss banners</li>
                        <li>Admit or remove guests</li>
                        <li>Monitor chat and respond</li>
                        <li>Track stream health metrics</li>
                    </ul>

                    <h3>Ending the Broadcast</h3>
                    <p>
                        Click <span className={styles.inlineCode}>STOP</span> to end the stream. A confirmation dialog prevents accidental termination.
                        All connected destinations will receive the stop signal simultaneously.
                    </p>
                </section>

                {/* TROUBLESHOOTING SECTION */}
                <section id="troubleshooting" className={styles.section}>
                    <h2><AlertTriangle size={24} /> Troubleshooting</h2>
                    <p>
                        Common issues and their solutions.
                    </p>

                    <h3>Camera/Microphone Not Detected</h3>
                    <ul>
                        <li>Ensure browser permissions are granted for media devices</li>
                        <li>Check that no other application is using the camera</li>
                        <li>Try refreshing the page or restarting the browser</li>
                        <li>Verify devices are connected and powered on</li>
                    </ul>

                    <h3>Stream Connection Failed</h3>
                    <ul>
                        <li>Verify your stream key is correct and not expired</li>
                        <li>Check that the RTMP server URL is accurate</li>
                        <li>Ensure your firewall allows outbound connections on port 1935</li>
                        <li>Test your network speed—minimum 5 Mbps upload recommended</li>
                    </ul>

                    <h3>Video Feed is Blank</h3>
                    <ul>
                        <li>Browser tab may have been backgrounded—click to refocus</li>
                        <li>Hardware acceleration might be disabled—check browser settings</li>
                        <li>Try a different browser (Chrome recommended)</li>
                    </ul>

                    <h3>High Latency or Buffering</h3>
                    <ul>
                        <li>Close other bandwidth-intensive applications</li>
                        <li>Use a wired ethernet connection instead of WiFi</li>
                        <li>Reduce stream quality in destination settings</li>
                        <li>Check for network congestion or ISP throttling</li>
                    </ul>

                    <h3>Guest Cannot Join</h3>
                    <ul>
                        <li>Ensure the invite link hasn't expired</li>
                        <li>Verify guest has camera/mic permissions in their browser</li>
                        <li>Check that you haven't reached your guest limit</li>
                        <li>Ask guest to try incognito mode or a different browser</li>
                    </ul>

                    <div className={styles.featureCard} style={{ marginTop: '2rem', borderColor: 'var(--accent-primary)' }}>
                        <div className={styles.featureTitle}>Still need help?</div>
                        <div className={styles.featureDesc}>
                            Contact support at support@streamstudio.app or visit our Discord community for real-time assistance.
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
