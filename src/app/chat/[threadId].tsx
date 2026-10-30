import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, ShieldCheck, Lock } from 'lucide-react-native';
import { getDB, addInquiryMessage } from '@/api/mock/db';
import { formatIST } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

export default function ChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const db = getDB();
  const inquiry = db.inquiries.find((i) => i.id === threadId) ?? db.inquiries[0]!;
  const owner = db.users.find((u) => u.id === inquiry.ownerId);

  const [messages, setMessages] = useState(inquiry.messages);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: 'student-1',
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    addInquiryMessage(inquiry.id, newMsg);
    setInputText('');

    // Simulate owner replying after 3 seconds in mock mode (§6)
    setTimeout(() => {
      const ownerReply = {
        id: `msg-reply-${Date.now()}`,
        senderId: 'owner-1',
        text: 'Thanks for inquiring! Yes, the room is ready for occupancy. When would you like to schedule a visit?',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, ownerReply]);
      addInquiryMessage(inquiry.id, ownerReply);
    }, 3000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <View className="flex-1 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-muted"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </TouchableOpacity>
          <View>
            <View className="flex-row items-center">
              <Text className="mr-1.5 font-body-semibold text-body text-foreground">
                {owner?.displayName ?? 'Verified Owner'}
              </Text>
              <ShieldCheck size={14} color={colors.success} />
            </View>
            <Text className="font-body text-[11px] text-muted-foreground">
              Direct chat • 0% Brokerage
            </Text>
          </View>
        </View>
      </View>

      {/* Masked Contact Notice Banner */}
      <View className="flex-row items-center justify-center border-b border-border bg-muted/70 px-4 py-2">
        <Lock size={12} className="mr-1.5 text-muted-foreground" />
        <Text className="text-center font-body text-[11px] text-muted-foreground">
          Contact details are hidden in chat to protect your privacy until booking approval.
        </Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          className="flex-1"
        >
          <View className="gap-3">
            {messages.map((msg) => {
              const isMine = msg.senderId === 'student-1';
              return (
                <View
                  key={msg.id}
                  className={cn(
                    'max-w-[80%] rounded-2xl p-3.5',
                    isMine
                      ? 'self-end rounded-tr-none bg-primary'
                      : 'shadow-elevation-1 self-start rounded-tl-none border border-border bg-card',
                  )}
                >
                  <Text
                    className={cn(
                      'font-body text-sm leading-5',
                      isMine ? 'text-primary-foreground' : 'text-foreground',
                    )}
                  >
                    {msg.text}
                  </Text>
                  <Text
                    className={cn(
                      'mt-1 font-body text-[10px]',
                      isMine ? 'text-right text-primary-foreground/75' : 'text-muted-foreground',
                    )}
                  >
                    {formatIST(msg.createdAt, 'hh:mm a')}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View className="flex-row items-center gap-2 border-t border-border bg-card p-3">
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            className="flex-1 rounded-full bg-muted px-4 py-2.5 font-body text-sm text-foreground"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full',
              inputText.trim() ? 'bg-primary' : 'bg-muted',
            )}
          >
            <Send size={16} color={inputText.trim() ? 'white' : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
