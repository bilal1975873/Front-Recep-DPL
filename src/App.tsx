import { useState, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { visitorService } from './services/api';
import type { ChatState } from './types';
import dplLogo from '../DPL_LOGO_tagline.png';

const INITIAL_STATE: ChatState = {
  messages: [
    {
      type: 'bot',
      content: 'Welcome to DPL! I am your AI receptionist. Please select your visitor type:\n\n1. I am here as a guest\n2. I am a vendor\n3. I am here for a pre-scheduled meeting',
      timestamp: new Date(),
    },
  ],
  currentStep: 'visitor_type',
  visitorInfo: {},
  isLoading: false,
  showConfirmation: false,
};

function App() {
  const [state, setState] = useState<ChatState>(INITIAL_STATE);
  const [resetTimer, setResetTimer] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer) {
        window.clearTimeout(resetTimer);
      }
    };
  }, [resetTimer]);

  const resetChat = () => {
    if (resetTimer) {
      window.clearTimeout(resetTimer);
    }
    setState(INITIAL_STATE);
  };

  const handleConfirmation = async (isConfirmed: boolean) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { response, nextStep, visitorInfo } = await visitorService.processMessage(
        isConfirmed ? 'confirm' : 'edit',
        state.currentStep,
        state.visitorInfo
      );

      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { type: 'bot', content: response, timestamp: new Date() },
        ],
        currentStep: nextStep,
        visitorInfo,
        showConfirmation: false,
        isLoading: false,
      }));

      // If registration is complete, set a timer to reset after 5 seconds
      if (nextStep === 'complete' || visitorInfo.registration_completed) {
        const timer = window.setTimeout(() => {
          resetChat();
        }, 5000);
        setResetTimer(timer);
      }
    } catch (error) {
      console.error('Error processing confirmation:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSend = async (message: string) => {
    // If in completed state, reset the chat for new visitor
    if (state.currentStep === 'complete' && !state.isLoading) {
      resetChat();
      return;
    }

    // Add user message
    setState(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        { type: 'user', content: message, timestamp: new Date() },
      ],
      isLoading: true,
    }));

    try {
      // Process the message using AI
      const { response, nextStep, visitorInfo } = await visitorService.processMessage(
        message,
        state.currentStep,
        state.visitorInfo
      );
      
      // Check if we're at the confirmation step
      const showConfirmation = nextStep === 'confirmation' || response.includes('confirm the information');
      
      // Update state with new message and visitor info
      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { type: 'bot', content: response, timestamp: new Date() },
        ],
        currentStep: nextStep,
        visitorInfo: { ...prev.visitorInfo, ...visitorInfo },
        showConfirmation,
        isLoading: false,
      }));

      // If registration is complete, set a timer to reset after 5 seconds
      if (nextStep === 'complete' || visitorInfo.registration_completed) {
        const timer = window.setTimeout(() => {
          resetChat();
        }, 5000);
        setResetTimer(timer);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
      {/* Background grid animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid transform -skew-y-12"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/5 to-black"></div>
      </div>

      {/* Side decorative elements */}
      <div className="fixed top-0 right-0 w-1/3 h-screen bg-gradient-to-l from-red-900/10 to-transparent pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-1/3 h-screen bg-gradient-to-r from-red-900/10 to-transparent pointer-events-none"></div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 min-h-screen flex flex-col">
        {/* Logo */}
        <div className="flex justify-center mb-8 pt-8">
          <img src={dplLogo} alt="DPL Logo" className="h-16 md:h-20" />
        </div>

        {/* Chat interface */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
            <ChatContainer 
              messages={state.messages} 
              isLoading={state.isLoading}
              onSend={handleSend}
            />
          </div>

          {/* Confirmation buttons or chat input */}
          <div className="mt-auto">
            {state.showConfirmation ? (
              <div className="flex justify-center gap-4 mb-4">
                <button
                  onClick={() => handleConfirmation(true)}
                  disabled={state.isLoading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleConfirmation(false)}
                  disabled={state.isLoading}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="w-full">
                <input
                  type="text"
                  placeholder={state.isLoading ? "Please wait..." : "Type your message..."}
                  disabled={state.isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                      handleSend((e.target as HTMLInputElement).value.trim());
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-red-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-900/20 via-red-600/40 to-red-900/20 fixed bottom-0 left-0"></div>
      </div>

      {/* Corner accents */}
      <div className="fixed top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent"></div>
      <div className="fixed top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent"></div>
    </div>
  );
}

export default App;
