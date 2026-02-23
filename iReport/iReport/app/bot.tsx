import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import colors from '@/constants/colors';
import Groq from 'groq-sdk';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a helpful and supportive bot for the iReport app, which helps students report bullying incidents safely and anonymously.

You ONLY answer questions related to:
1. Bullying prevention and how to handle being bullied
2. How to use the iReport app to report incidents
3. Student safety and wellbeing
4. What to do if you witness bullying
5. How to support victims of bullying
6. Creating incident reports in the app

If someone asks about topics unrelated to bullying or the iReport app, politely redirect them back to bullying-related topics.
Always be empathetic, supportive, and helpful. Keep responses concise and clear.`;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function BotScreen() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();
  const { colors } = useSettings();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello! I\'m the iReport Bot. I\'m here to help you with bullying prevention, reporting, and app usage. What can I help you with?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Call Groq API with bullying-focused system prompt
  const getBotResponse = async (userMessage: string): Promise<string> => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      if (!apiKey) {
        console.error('Groq API key not found in environment variables');
        return 'API key not configured. Please check your environment variables.';
      }

      const message = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        model: 'llama-3.1-8b-instant',
        max_tokens: 200,
        temperature: 0.7,
      });

      return message.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
    } catch (error: any) {
      console.error('Error calling Groq API:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unknown error';
      console.error('Error details:', errorMessage);
      return `Sorry, I encountered an error: ${errorMessage}`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    const userInput = inputText;
    setInputText('');
    setLoading(true);

    try {
      const botResponse = await getBotResponse(userInput);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Sorry, something went wrong. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>iReport Bot</Text>
        <Text style={styles.subtitle}>Ask me anything</Text>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {messages.map((message: Message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.sender === 'user'
                ? styles.userMessage
                : styles.botMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.sender === 'user'
                  ? styles.userMessageText
                  : styles.botMessageText,
              ]}
            >
              {message.text}
            </Text>
            <Text
              style={[
                styles.timestamp,
                message.sender === 'user'
                  ? styles.userTimestamp
                  : styles.botTimestamp,
              ]}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Bot is thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about bullying, reporting, or the app..."
          placeholderTextColor={colors.textLight}
          value={inputText}
          onChangeText={setInputText}
          editable={!loading}
          multiline
          maxHeight={100}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Send
            size={20}
            color={inputText.trim() ? colors.surface : colors.textLight}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageBubble: {
    marginBottom: 12,
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.surface,
  },
  botMessageText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: colors.surface,
    opacity: 0.7,
  },
  botTimestamp: {
    color: colors.textSecondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
