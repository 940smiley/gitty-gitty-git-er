import React, { useState } from 'react';
import { githubApi } from '../services/apiClient';

const STEPS = {
  NAME: 0,
  MODE: 1,
  AI_GUIDELINES: 2,
  SUMMARY: 3
};

const NewRepository = () => {
  const [step, setStep] = useState(STEPS.NAME);
  const [repoName, setRepoName] = useState('');
  const [mode, setMode] = useState(''); // 'ai' or 'manual'
  const [aiGuidelines, setAiGuidelines] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiWorking, setAiWorking] = useState(false);

  const handleNext = () => {
    setError('');
    if (step === STEPS.NAME && !repoName.trim()) {
      setError('Repository name is required.');
      return;
    }
    if (step === STEPS.MODE && !mode) {
      setError('Please select an option.');
      return;
    }
    if (step === STEPS.AI_GUIDELINES && !aiGuidelines.trim()) {
      setError('Please provide some guidelines for the AI.');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'manual') {
        await githubApi.createRepository({
          name: repoName,
          auto_init: true
        });
        setSuccess(true);
      } else if (mode === 'ai') {
        setAiWorking(true);
        // Send AI repo creation request to backend
        await githubApi.createRepository({
          name: repoName,
          ai: true,
          ai_guidelines: aiGuidelines
        });
        setAiWorking(false);
        setSuccess(true);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create repository.');
      setAiWorking(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (aiWorking) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-6">AI is building your repository...</h1>
        <div className="flex justify-center mb-4">
          <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Copilot (or a free AI) is generating your repository based on your guidelines...</p>
        <p className="mt-4 text-sm text-gray-400">This may take a few moments.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Repository Created!</h1>
        <p className="text-green-600 dark:text-green-400 mb-4">Your repository <b>{repoName}</b> has been created.</p>
        {mode === 'ai' && (
          <div className="text-yellow-600 dark:text-yellow-400 mb-4">
            (AI-powered repository creation is not yet implemented. Only a placeholder was created.)
          </div>
        )}
        {/* Optionally, link to the new repo */}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Repository</h1>
      {step === STEPS.NAME && (
        <>
          <label className="block mb-2 font-medium">Name of repository?</label>
          <input
            className="w-full px-3 py-2 border rounded mb-4 dark:bg-gray-800 dark:text-white"
            type="text"
            value={repoName}
            onChange={e => setRepoName(e.target.value)}
            placeholder="e.g. my-awesome-repo"
            autoFocus
          />
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            onClick={handleNext}
          >
            Next
          </button>
        </>
      )}
      {step === STEPS.MODE && (
        <>
          <label className="block mb-4 font-medium">What would you like to do with this repository?</label>
          <div className="mb-4">
            <label className="flex items-center mb-2">
              <input
                type="radio"
                name="mode"
                value="ai"
                checked={mode === 'ai'}
                onChange={() => setMode('ai')}
                className="mr-2"
              />
              Utilize AI to create this repository
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="manual"
                checked={mode === 'manual'}
                onChange={() => setMode('manual')}
                className="mr-2"
              />
              Manually add files, edit, etc.
            </label>
          </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded border"
              onClick={handleBack}
            >Back</button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={handleNext}
            >Next</button>
          </div>
        </>
      )}
      {step === STEPS.AI_GUIDELINES && mode === 'ai' && (
        <>
          <label className="block mb-2 font-medium">What would you like this repository built for?</label>
          <textarea
            className="w-full px-3 py-2 border rounded mb-4 dark:bg-gray-800 dark:text-white"
            rows={4}
            value={aiGuidelines}
            onChange={e => setAiGuidelines(e.target.value)}
            placeholder="Describe what you want Copilot or the AI to build (e.g. a Next.js blog, a Python API, etc.)"
            autoFocus
          ></textarea>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded border"
              onClick={handleBack}
            >Back</button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={handleNext}
            >Next</button>
          </div>
        </>
      )}
      {step === STEPS.SUMMARY && (
        <>
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <ul className="mb-4 list-disc list-inside text-gray-700 dark:text-gray-200">
            <li><b>Name:</b> {repoName}</li>
            <li><b>Mode:</b> {mode === 'ai' ? 'AI-assisted' : 'Manual'}</li>
            {mode === 'ai' && <li><b>AI Guidelines:</b> {aiGuidelines}</li>}
          </ul>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded border"
              onClick={handleBack}
              disabled={submitting}
            >Back</button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={handleSubmit}
              disabled={submitting}
            >{submitting ? 'Creating...' : 'Create Repository'}</button>
          </div>
        </>
      )}
    </div>
  );
};

export default NewRepository;
