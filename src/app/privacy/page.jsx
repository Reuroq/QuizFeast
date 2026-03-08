'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-900 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-6">Last updated: March 8, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What We Collect</h2>
            <p>QuizFeast collects only what is necessary to provide the service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Quiz questions and answers</strong> — sent to our server for AI analysis. Questions may be cached anonymously to improve accuracy for future users.</li>
              <li><strong>Screenshots</strong> — when you use the snapshot feature, the screenshot is sent to our server for AI vision analysis. Screenshots are processed in real-time and not stored permanently.</li>
              <li><strong>Settings</strong> — your extension preferences (server URL, auto-submit toggle, delay) are stored locally in your browser via Chrome storage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What We Do NOT Collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Personal information (name, email, etc.)</li>
              <li>Browsing history or page content beyond quiz questions</li>
              <li>Cookies or tracking identifiers</li>
              <li>Any data from pages where you do not actively use the extension</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How Data Is Used</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Questions are matched against our cached answer database to provide instant results.</li>
              <li>When no cache match is found, questions are sent to AI models for analysis.</li>
              <li>Correct answers may be cached anonymously to help other users with the same questions.</li>
              <li>The &quot;Wrong Answer&quot; voting system uses community input to improve answer accuracy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Storage</h2>
            <p>Cached Q&amp;A pairs are stored in our Pinecone vector database. These contain only the question text and answer — no personal information is attached. Extension settings are stored locally in your browser.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Third-Party Services</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>OpenAI</strong> — for AI question analysis and text embeddings</li>
              <li><strong>Anthropic (Claude)</strong> — for screenshot/image analysis</li>
              <li><strong>Pinecone</strong> — for vector-based answer caching</li>
            </ul>
            <p className="mt-2">These services process data according to their own privacy policies. No personal data is shared with them — only quiz content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
            <p>You can uninstall the extension at any time to stop all data collection. Extension settings are automatically removed when you uninstall. To request removal of cached answers, contact us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>For questions about this privacy policy, contact us through our website.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
