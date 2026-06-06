// app/download/page.tsx - Download page for SimTrace mobile app
import React from 'react';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Download SimTrace
          </h1>
          <p className="text-xl text-gray-300">
            Protect your devices with real-time tracking and recovery
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Android Download */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all">
            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-white mb-4">Android</h2>
              <p className="text-gray-300 mb-6">
                Download the APK file for Android devices
              </p>
              <a
                href="/simtrace-android.apk"
                download
                className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Download APK
              </a>
              <p className="text-sm text-gray-400 mt-4">Version 1.0.0 • 25MB</p>
            </div>
          </div>

          {/* iOS Download */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all">
            <div className="text-center">
              <div className="text-6xl mb-4">🍎</div>
              <h2 className="text-2xl font-bold text-white mb-4">iOS</h2>
              <p className="text-gray-300 mb-6">
                Download from the App Store (Coming Soon)
              </p>
              <button
                disabled
                className="inline-block bg-gray-600 text-white font-bold py-4 px-8 rounded-xl cursor-not-allowed opacity-50"
              >
                Coming Soon
              </button>
              <p className="text-sm text-gray-400 mt-4">Under Review</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-12">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📍</div>
              <h4 className="text-lg font-semibold text-white mb-2">Real-Time Tracking</h4>
              <p className="text-gray-300 text-sm">Track your devices in real-time with GPS precision</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h4 className="text-lg font-semibold text-white mb-2">Remote Lock</h4>
              <p className="text-gray-300 text-sm">Lock your device remotely to protect your data</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🚨</div>
              <h4 className="text-lg font-semibold text-white mb-2">Panic Mode</h4>
              <p className="text-gray-300 text-sm">Activate panic mode to alert authorities</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">👮</div>
              <h4 className="text-lg font-semibold text-white mb-2">Police Integration</h4>
              <p className="text-gray-300 text-sm">Direct integration with law enforcement</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📡</div>
              <h4 className="text-lg font-semibold text-white mb-2">Telecom Integration</h4>
              <p className="text-gray-300 text-sm">Network-level tracking with telecom partners</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🤖</div>
              <h4 className="text-lg font-semibold text-white mb-2">AI-Powered</h4>
              <p className="text-gray-300 text-sm">AI-powered theft detection and recovery</p>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">System Requirements</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Android</h4>
              <ul className="text-gray-300 space-y-2">
                <li>• Android 8.0 (Oreo) or higher</li>
                <li>• GPS enabled</li>
                <li>• Internet connection</li>
                <li>• 50MB free storage</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">iOS</h4>
              <ul className="text-gray-300 space-y-2">
                <li>• iOS 14.0 or higher</li>
                <li>• GPS enabled</li>
                <li>• Internet connection</li>
                <li>• 100MB free storage</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-300 mb-4">
            Already have an account?{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Login here
            </a>
          </p>
          <p className="text-gray-300">
            New user?{' '}
            <a href="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
