import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

export const ErrorPage = () => {
    const error = useRouteError();

    const is404 = error?.status === 404;

    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center">
                {/* Error Icon */}
                <div className="mb-8">
                    {is404 ? (
                        <div className="relative">
                            <h1 className="font-secondary text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#D4AF37] to-[#F59E0B]">
                                404
                            </h1>
                            <p className="text-zinc-500 text-lg mt-2">Halaman tidak ditemukan</p>
                        </div>
                    ) : (
                        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                <div className="bg-[#121214] border border-zinc-800 rounded-sm p-8">
                    <h2 className="font-secondary text-2xl text-white mb-3">
                        {is404 ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan'}
                    </h2>
                    <p className="text-zinc-400 mb-6">
                        {is404
                            ? 'Halaman yang Anda cari tidak ada atau telah dipindahkan.'
                            : 'Kami sedang mengalami masalah teknis. Silakan coba lagi nanti.'}
                    </p>

                    {error && process.env.NODE_ENV === 'development' && (
                        <details className="text-left mb-6 bg-zinc-900/50 p-4 rounded text-xs">
                            <summary className="text-red-400 cursor-pointer mb-2">Error Details (Development)</summary>
                            <pre className="text-zinc-400 overflow-auto">
                                {error.statusText || error.message}
                            </pre>
                        </details>
                    )}

                    <div className="flex gap-3 justify-center">
                        <Link
                            to="/dashboard"
                            className="px-6 py-3 bg-[#D4AF37] text-black hover:bg-[#B5952F] rounded-sm font-semibold transition-colors"
                        >
                            Kembali ke Dashboard
                        </Link>
                        {!is404 && (
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-zinc-800 text-white hover:bg-zinc-700 rounded-sm font-semibold transition-colors"
                            >
                                Muat Ulang
                            </button>
                        )}
                    </div>
                </div>

                {/* Helpful Links */}
                <div className="mt-8 text-zinc-500 text-sm">
                    <p>Butuh bantuan? Hubungi support atau</p>
                    <Link to="/dashboard" className="text-[#D4AF37] hover:underline">
                        kembali ke halaman utama
                    </Link>
                </div>
            </div>
        </div>
    );
};
