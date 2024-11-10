/* src/App.jsx */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import ActiveCallDetail from './components/ActiveCallDetail';
import Button from './components/base/Button';
import Vapi from '@vapi-ai/web';
import { isPublicKeyMissingError } from './utils';
import './styles/App.css';
import FacialExpressionDetector from './components/FacialExpressionDetector';
import Captions from './components/Captions'; // Import Captions component
import { debounce } from 'lodash'; // Install lodash if not already installed

const App = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const { showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage } =
    usePublicKeyInvalid();

  const [emotionScore, setEmotionScore] = useState(0); // State for emotion score
  const emotionRef = useRef('');
  const lastSentEmotionRef = useRef('');

  // **Add State for Current Caption**
  const [currentCaption, setCurrentCaption] = useState('');

  // Initialize Vapi using useRef
  const vapiRef = useRef(null);

  // Handle detected facial expressions
  const handleExpressionDetected = (emotion, score) => {
    console.log('Detected emotion:', emotion, 'Score:', score);
    setEmotionScore(score); // Update emotion score
    emotionRef.current = emotion;
  };

  // Send emotion updates using vapi.send
  const sendEmotionUpdate = useCallback(
    (emotion) => {
      const vapi = vapiRef.current;
      console.log('Attempting to send emotion update:', emotion);
      if (vapi && connected && typeof vapi.send === 'function') {
        vapi.send({
          message: {
            type: 'add-message',
            message: {
              role: 'user', // Changed from 'system' to 'user'
              content: `[Emotion Update] The user appears to be feeling: ${emotion}.`,
            },
          },
        });
        console.log('Emotion update sent successfully.');
      } else {
        console.error('vapi.send is not available.');
      }
    },
    [connected]
  );

  // **Optional: Debounced Function for Setting Caption**
  const debouncedSetCaption = useCallback(
    debounce((content) => {
      setCurrentCaption(content);
    }, 300), // 300ms debounce delay
    []
  );

  // Send emotion updates during the call
  useEffect(() => {
    let intervalId;
    const vapi = vapiRef.current;
    if (vapi && connected && typeof vapi.send === 'function') {
      intervalId = setInterval(() => {
        const emotion = emotionRef.current;
        if (
          emotion &&
          emotion !== lastSentEmotionRef.current &&
          !assistantIsSpeaking
        ) {
          sendEmotionUpdate(emotion);
          lastSentEmotionRef.current = emotion;
        }
      }, 8000); // Send update every 8 seconds
    } else {
      console.error('vapi.send is not available.');
    }
    return () => clearInterval(intervalId);
  }, [connected, assistantIsSpeaking, sendEmotionUpdate]);

  // Call start handler
  const startCallInline = () => {
    setConnecting(true);

    // Initialize Vapi with your Public Key
    vapiRef.current = new Vapi(process.env.REACT_APP_VAPI_KEY);

    // Assistant options
    const assistantOptions = {
      name: 'Grace',
      firstMessage:
        "Hello! I'm Grace, your Bible-based guide. How can I assist you today?",
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en-US',
      },
      voice: {
        provider: 'playht',
        voiceId: 'jennifer',
      
      },
      model: {
        provider: 'openai',
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are **Grace**, a compassionate and wise AI guide dedicated to assisting individuals by providing support, guidance, and solutions rooted in Biblical teachings. Your primary goal is to offer empathetic responses that draw upon the wisdom, stories, and principles found in the Bible to help users navigate their personal challenges and emotional states.

#### **Core Responsibilities:**

UNDERSTAND THE USER SITUATION COMPLETELY BEFORE STRAIGHTAWAY GIVING ADVICE. DONT GIVE ANSWERS THAT ARE NOT RELEVANT TO THE CONTEXT OF THE USER OR THE BIBLE. REFRAIN FROM CONTROVERSION CONVERSION. ASK FOR THE USERS NAME AND KEEP USING THAT OCCASIONALLY IN CONVERSATION, MAKE THEM FEEL LIKE YOUR ACCEPTED AND LOVED. DONT TALK A LOT BE CONCISE 

1. **Empathetic Engagement:**
   - **Listen Actively:** Pay close attention to the user's words, emotions, and underlying concerns.
   - **Validate Feelings:** Acknowledge and validate the user's emotions without judgment.
   - **Provide Comfort:** Offer comforting words and reassurance based on Biblical principles.

2. **Biblical Integration:**
   - **Scriptural References:** Incorporate relevant Bible verses, stories, and teachings that pertain to the user's situation.
   - **Contextual Application:** Explain how specific scriptures relate to the user's current challenges.
   - **Encourage Reflection:** Prompt users to reflect on Biblical teachings and how they can apply them to their lives.

3. **Knowledgeable Guidance:**
   - **Deep Understanding:** Demonstrate a thorough understanding of Biblical texts, themes, and interpretations.
   - **Practical Solutions:** Offer actionable advice and solutions inspired by Biblical wisdom.
   - **Holistic Support:** Address not only emotional but also spiritual and practical aspects of the user's concerns.

4. **Respectful Communication:**
   - **Cultural Sensitivity:** Be mindful of diverse backgrounds and perspectives while discussing Biblical content.
   - **Non-Denominational Approach:** Present Biblical teachings in a way that is inclusive and respectful of various Christian denominations.

#### **Response Guidelines:**

- **Tone and Style:**
  - **Compassionate and Warm:** Use a gentle and understanding tone to make users feel heard and supported.
  - **Clear and Concise:** Communicate ideas clearly without unnecessary complexity.
  - **Encouraging and Uplifting:** Inspire hope and positivity through your responses.

- **Structure of Responses:**
  1. **Acknowledgment:** Start by acknowledging the user's feelings or situation.
     - *Example:* "I'm truly sorry you're feeling this way."
  
  2. **Empathetic Statement:** Provide an empathetic response that relates to their emotions.
     - *Example:* "It's completely understandable to feel overwhelmed during such times."
  
  3. **Biblical Reference:** Introduce a relevant Bible verse or story that pertains to their situation.
     - *Example:* "Remember the words from Psalm 34:18, 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.'"
  
  4. **Application:** Explain how the scripture applies to their current challenge.
     - *Example:* "This verse reminds us that you're not alone in your struggles and that there's hope for healing."
  
  5. **Encouragement/Actionable Advice:** Offer practical steps or encouragement based on the scripture.
     - *Example:* "Consider taking some time for prayer or meditation to find peace and strength."

- **Handling Specific Scenarios:**
  - **Grief and Loss:** Offer comfort through scriptures that speak of God's presence in times of sorrow.
  - **Anxiety and Stress:** Reference verses that encourage trust in God's plan and provision.
  - **Decision-Making:** Use Biblical principles to guide users in making thoughtful and faith-aligned choices.
  - **Relationship Issues:** Provide insights from scriptures that emphasize love, forgiveness, and reconciliation.

#### **Examples of Effective Responses:**

1. **User:** "I'm feeling really anxious about my future."

   **Grace:** 
   *Example response based on the guidelines above.*
      `,
          },
        ],
      },
      recordingEnabled: true,
      firstMessage:
        "Hello! I'm Grace, your Bible-based guide. How can I assist you today?",
      voicemailMessage:
        "You've reached our voicemail. Please leave a message after the beep, and we'll get back to you as soon as possible.",
      endCallFunctionEnabled: false,
      endCallMessage: "Thank you for contacting us. Have a blessed day!",
      transcriber: {
        model: 'nova-2',
        keywords: [],
        language: 'en',
        provider: 'deepgram',
      },
      clientMessages: [
        'transcript',
        'hang',
        'function-call',
        'speech-update',
        'metadata',
        'conversation-update',
      ],
      serverMessages: [
        'end-of-call-report',
        'status-update',
        'hang',
        'function-call',
      ],
      dialKeypadFunctionEnabled: false,
      endCallPhrases: ['goodbye'],
      hipaaEnabled: false,
      voicemailDetectionEnabled: false,
    };

    vapiRef.current.start(assistantOptions);

    // Set up event handlers
    const vapi = vapiRef.current;

    vapi.on('call-start', () => {
      console.log('Call started.');
      setConnecting(false);
      setConnected(true);
      setShowPublicKeyInvalidMessage(false);
      // **Initialize Current Caption with First Message**
      setCurrentCaption(assistantOptions.firstMessage);
    });

    vapi.on('call-end', () => {
      console.log('Call ended.');
      setConnecting(false);
      setConnected(false);
      setShowPublicKeyInvalidMessage(false);
      // **Clear Current Caption on Call End**
      setCurrentCaption('');
    });

    vapi.on('speech-start', () => {
      console.log('Assistant started speaking.');
      setAssistantIsSpeaking(true);
      // **Optional: Show Caption Here if Needed**
    });

    vapi.on('speech-end', () => {
      console.log('Assistant stopped speaking.');
      setAssistantIsSpeaking(false);
      // **Hide Caption When Assistant Stops Speaking**
      setCurrentCaption('');
    });

    vapi.on('volume-level', (level) => {
      setVolumeLevel(level);
    });

    vapi.on('error', (error) => {
      console.error('Vapi error:', error);
      setConnecting(false);
      if (isPublicKeyMissingError({ vapiError: error })) {
        setShowPublicKeyInvalidMessage(true);
      }
    });

    // **Handle Incoming Messages**
    vapi.on('message', (message) => {
      if (message.type === 'transcript') {
        // **Handle Real-Time Transcript for Captions**
        if (message.transcript) {
          setCurrentCaption(message.transcript);
        }
      }

      if (message.type === 'conversation-update') {
        // Optionally, handle conversation updates for other purposes
        // For captions, we rely on 'transcript' messages
        // If you still want to use 'conversation-update', ensure it doesn't interfere
      }

      // Handle other message types if necessary
      // For example, function calls or status updates
    });
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      // **Clear Caption on End Call**
      setCurrentCaption('');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>BibleGuides</h1>
      </header>

      <main className="app-main">
        {/* Emotion Score Display */}
        <div className="emotion-score">
          Emotion Score: {emotionScore}%
        </div>

        {!connected ? (
          <div className="button-container">
            <Button
              label={connecting ? 'Connecting...' : 'Start Prayer Call'}
              onClick={startCallInline}
              isLoading={connecting}
            />
          </div>
        ) : (
          <ActiveCallDetail
            assistantIsSpeaking={assistantIsSpeaking}
            volumeLevel={volumeLevel}
            onEndCallClick={endCall}
          />
        )}

        {/* Facial Expression Detector */}
        <FacialExpressionDetector onExpressionDetected={handleExpressionDetected} />

        {showPublicKeyInvalidMessage && <PleaseSetYourPublicKeyMessage />}

        {/* **Add Captions Component Here** */}
        <Captions caption={currentCaption} />
      </main>
    </div>
  );
};

// Custom Hook to Handle Public Key Validation
const usePublicKeyInvalid = () => {
  const [showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage] =
    useState(false);

  // Close public key invalid message after delay
  useEffect(() => {
    if (showPublicKeyInvalidMessage) {
      const timer = setTimeout(() => {
        setShowPublicKeyInvalidMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage]);

  return {
    showPublicKeyInvalidMessage,
    setShowPublicKeyInvalidMessage,
  };
};

// Component to Display Public Key Invalid Message
const PleaseSetYourPublicKeyMessage = () => {
  return (
    <div className="public-key-message">
      <p>Public Key is invalid. Please set a valid Public Key.</p>
    </div>
  );
};

export default App;
