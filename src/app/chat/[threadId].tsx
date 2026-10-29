import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, ShieldCheck, Lock } from 'lucide-react-native';
import { getDB, addInquiryMessage } from '@/api/mock/db';
import { formatIST } from '@/lib/dates';
import { cn } from '@/lib/cn';

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
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full bg-muted mr-3"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </TouchableOpacity>
          <View>
            <View className="flex-row items-center">
              <Text className="text-body font-body-semibold text-foreground mr-1.5">
                {owner?.displayName ?? 'Verified Owner'}
              </Text>
              <ShieldCheck size={14} color="hsl(var(--success))" />
            </View>
            <Text className="text-[11px] font-body text-muted-foreground">
              Direct chat • 0% Brokerage
            </Text>
          </View>
        </View>
      </View>

      {/* Masked Contact Notice Banner */}
      <View className="bg-muted/70 px-4 py-2 border-b border-border flex-row items-center justify-center">
        <Lock size={12} className="text-muted-foreground mr-1.5" />
        <Text className="text-[11px] font-body text-muted-foreground text-center">
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
                      ? 'self-end bg-primary rounded-tr-none'
                      : 'self-start bg-card border border-border rounded-tl-none shadow-elevation-1',
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
                      'text-[10px] font-body mt-1',
                      isMine ? 'text-primary-foreground/75 text-right' : 'text-muted-foreground',
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
        <View className="p-3 bg-card border-t border-border flex-row items-center gap-2">
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={inputText}
            onChangeText={setInputText}
            className="flex-1 bg-muted rounded-full px-4 py-2.5 font-body text-sm text-foreground"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
            className={cn(
              'h-10 w-10 rounded-full items-center justify-center',
              inputText.trim() ? 'bg-primary' : 'bg-muted',
            )}
          >
            <Send
              size={16}
              color={inputText.trim() ? 'white' : 'hsl(var(--muted-foreground))'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
