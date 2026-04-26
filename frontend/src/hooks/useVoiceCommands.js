import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const useVoiceCommands = (commandMap) => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    const startListening = () => {
        if (!SpeechRecognition) {
            toast.error("Speech recognition not supported in this browser");
            return;
        }
        setListening(true);
    };

    const stopListening = () => {
        setListening(false);
    };

    useEffect(() => {
        if (!listening || !SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const resultTranscript = event.results[current][0].transcript.toLowerCase();
            setTranscript(resultTranscript);

            // Match commands
            Object.keys(commandMap).forEach(cmd => {
                if (resultTranscript.includes(cmd.toLowerCase())) {
                    commandMap[cmd](resultTranscript);
                }
            });

            setListening(false);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognition.onerror = (event) => {
            console.error("Speech error", event.error);
            setListening(false);
        };

        recognition.start();

        return () => recognition.stop();
    }, [listening, commandMap, SpeechRecognition]);

    return { listening, transcript, startListening, stopListening };
};
