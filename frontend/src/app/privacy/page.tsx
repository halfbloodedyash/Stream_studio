import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-zinc-500 mb-12">Last updated: January 11, 2026</p>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">1. Introduction</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            StreamStudio ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our streaming platform and services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">2. Information We Collect</h2>
                        <h3 className="text-lg font-medium mb-2 text-zinc-200">Personal Information</h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>Email address and account credentials</li>
                            <li>Profile information (name, avatar)</li>
                            <li>Payment information (processed securely via third-party providers)</li>
                            <li>Usage data and analytics</li>
                        </ul>

                        <h3 className="text-lg font-medium mb-2 mt-4 text-zinc-200">Streaming Data</h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>Video and audio content during live streams</li>
                            <li>Stream metadata (titles, descriptions, settings)</li>
                            <li>Recordings (when enabled by user)</li>
                        </ul>

                        <h3 className="text-lg font-medium mb-2 mt-4 text-zinc-200">Third-Party Integrations</h3>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>YouTube account information (when connected for live chat)</li>
                            <li>RTMP destination configurations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Information</h2>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>To provide and maintain our streaming services</li>
                            <li>To process transactions and send related information</li>
                            <li>To send administrative information and updates</li>
                            <li>To respond to inquiries and offer support</li>
                            <li>To improve our platform and develop new features</li>
                            <li>To detect and prevent fraud or abuse</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Sharing</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We do not sell your personal information. We may share data with:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2 mt-2">
                            <li>Service providers who assist in operating our platform</li>
                            <li>Third-party streaming platforms when you choose to stream to them</li>
                            <li>Law enforcement when required by law</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">5. Data Security</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We implement industry-standard security measures including encryption, secure authentication, and regular security audits to protect your data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">6. Your Rights</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            You have the right to access, correct, or delete your personal information. You may also request data portability or restrict processing. Contact us at privacy@streamstudio.app to exercise these rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">7. Contact Us</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            For questions about this Privacy Policy, please contact us at:<br />
                            <a href="mailto:privacy@streamstudio.app" className="text-orange-500 hover:underline">
                                privacy@streamstudio.app
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
