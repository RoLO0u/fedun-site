import React from 'react';

const AnalyzePage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Telegram Group Chat Analyzer</h1>
                <p className="text-gray-600 mt-2">
                    Gain insights and analytics about your Telegram group chats in seconds.
                </p>
            </header>
            <main className="w-full max-w-md shadow-md rounded-lg p-6">
                <form>
                    <label htmlFor="groupLink" className="block text-sm font-medium text-gray-700">
                        Telegram Group Link
                    </label>
                    <input
                        type="text"
                        id="groupLink"
                        name="groupLink"
                        placeholder="Enter your Telegram group link"
                        className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                    >
                        Analyze Now
                    </button>
                </form>
            </main>
        </div>
    );
};

export default AnalyzePage;