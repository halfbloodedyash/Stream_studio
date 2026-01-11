import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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

                <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
                <p className="text-zinc-500 mb-12">Last updated: January 11, 2026</p>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            By accessing or using StreamStudio, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">2. Description of Service</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            StreamStudio provides a browser-based live streaming platform that enables users to broadcast video content, invite guests, and stream to multiple destinations including YouTube, Twitch, and custom RTMP endpoints.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">3. User Accounts</h2>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>You must provide accurate and complete registration information</li>
                            <li>You are responsible for maintaining the security of your account</li>
                            <li>You must be at least 13 years old to use our services</li>
                            <li>You may not share your account with others</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">4. Acceptable Use</h2>
                        <p className="text-zinc-300 leading-relaxed mb-3">
                            You agree NOT to use StreamStudio to:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>Stream illegal, harmful, or offensive content</li>
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Harass, abuse, or harm others</li>
                            <li>Distribute malware or engage in hacking</li>
                            <li>Interfere with the platform's operation</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">5. Content Ownership</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            You retain ownership of all content you create and stream through StreamStudio. By using our service, you grant us a limited license to process and transmit your content as necessary to provide the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">6. Third-Party Services</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            StreamStudio integrates with third-party services such as YouTube, Twitch, and LiveKit. Your use of these integrations is subject to their respective terms of service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">7. Service Availability</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We strive to maintain high availability but do not guarantee uninterrupted service. We may perform maintenance or updates that temporarily affect access.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">8. Limitation of Liability</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            StreamStudio is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">9. Termination</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We may terminate or suspend your account at any time for violations of these terms. You may also terminate your account at any time by contacting support.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">10. Changes to Terms</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">11. Contact Us</h2>
                        <p className="text-zinc-300 leading-relaxed">
                            For questions about these Terms of Service, please contact us at:<br />
                            <a href="mailto:legal@streamstudio.app" className="text-orange-500 hover:underline">
                                legal@streamstudio.app
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
