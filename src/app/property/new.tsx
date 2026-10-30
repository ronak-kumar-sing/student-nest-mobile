import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  MapPin,
} from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { getDB, MockProperty } from '@/api/mock/db';
import { formatINR, rupeesToPaise } from '@/lib/money';
import { toast } from '@/components/ui/toast';
import { lightImpact, mediumImpact } from '@/lib/haptics';

const AVAILABLE_AMENITIES = [
  'WiFi',
  'AC',
  'Attached Washroom',
  'Power Backup',
  'Geyser',
  'Washing Machine',
  'CCTV',
  'Biometric Entry',
  'Food Included',
  'Cleaning Service',
  'Balcony',
  'RO Water',
];

const ROOM_TYPES = [
  { label: 'Single Room', value: 'single_room' },
  { label: 'Double Sharing', value: 'double_sharing' },
  { label: 'PG Accommodation', value: 'pg' },
  { label: '1 BHK Studio', value: '1bhk' },
  { label: '2 BHK Flat', value: '2bhk' },
];

const CITIES = ['Bengaluru', 'Indore', 'Pune'];

const LOCALITIES: Record<string, string[]> = {
  Bengaluru: ['Koramangala', 'HSR Layout', 'Indiranagar', 'BTM Layout', 'Whitefield'],
  Indore: ['Vijay Nagar', 'Palasia', 'Bhawarkua', 'AB Road'],
  Pune: ['Kothrud', 'Hinjewadi', 'Viman Nagar', 'Baner'],
};

export default function NewPropertyScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [roomType, setRoomType] = useState('single_room');
  const [city, setCity] = useState('Bengaluru');
  const [locality, setLocality] = useState('Koramangala');
  const [address, setAddress] = useState('');
  const [rentRupees, setRentRupees] = useState('14500');
  const [depositRupees, setDepositRupees] = useState('29000');
  const [maintenanceRupees, setMaintenanceRupees] = useState('1500');
  const [genderPolicy, setGenderPolicy] = useState<'unisex' | 'male' | 'female'>('unisex');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'WiFi',
    'AC',
    'Power Backup',
    'RO Water',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAmenity = (item: string) => {
    lightImpact();
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleNext = () => {
    mediumImpact();
    if (step === 1) {
      if (!title.trim()) {
        toast.error('Please enter a property title');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const rent = parseInt(rentRupees, 10);
      if (isNaN(rent) || rent <= 0) {
        toast.error('Please enter a valid monthly rent');
        return;
      }
      setStep(3);
    }
  };

  const handlePublish = () => {
    mediumImpact();
    setIsSubmitting(true);

    const rentPaise = rupeesToPaise(parseInt(rentRupees, 10) || 12000);
    const depositPaise = rupeesToPaise(parseInt(depositRupees, 10) || 24000);
    const maintenancePaise = rupeesToPaise(parseInt(maintenanceRupees, 10) || 0);

    const newProperty: MockProperty = {
      id: `prop-${Date.now()}`,
      title: title.trim(),
      rentPaise,
      depositPaise,
      maintenancePaise,
      billsPaise: 0,
      city,
      locality,
      address: address.trim() || `House #42, 5th Main, ${locality}, ${city}`,
      roomType,
      genderPolicy,
      status: 'published',
      ownerId: 'owner-1',
      images: [
        'https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80',
      ],
      amenities: selectedAmenities,
      rating: 4.8,
      reviewCount: 1,
      nearbyColleges: [`${city} University`, 'Apex Engineering College'],
    };

    // Save to mock database
    const db = getDB();
    db.properties.unshift(newProperty);

    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Listing published! It is now live to students.');
      router.replace('/(owner)/(tabs)/listings');
    }, 450);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep((prev) => (prev - 1) as any) : router.back())}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add New Listing</Text>
          <Text style={styles.stepIndicator}>Step {step} of 3</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Step Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={Platform.OS === 'ios' ? 70 : 40}
      >
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Property Overview</Text>
              <Text style={styles.sectionSubtitle}>
                Enter the name, location, and room format for college students.
              </Text>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Listing Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Modern Studio with Balcony near RV College"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Room Type Pills */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Room Category</Text>
              <View style={styles.pillsRow}>
                {ROOM_TYPES.map((rt) => {
                  const selected = roomType === rt.value;
                  return (
                    <TouchableOpacity
                      key={rt.value}
                      onPress={() => {
                        lightImpact();
                        setRoomType(rt.value);
                      }}
                      style={[styles.typePill, selected && styles.typePillSelected]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.typePillText, selected && styles.typePillTextSelected]}
                      >
                        {rt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* City Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <View style={styles.pillsRow}>
                {CITIES.map((c) => {
                  const selected = city === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => {
                        lightImpact();
                        setCity(c);
                        setLocality(LOCALITIES[c]?.[0] || 'Center');
                      }}
                      style={[styles.cityPill, selected && styles.cityPillSelected]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.cityPillText, selected && styles.cityPillTextSelected]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Locality Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Locality / Neighborhood</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locScroll}>
                {(LOCALITIES[city] || []).map((loc) => {
                  const selected = locality === loc;
                  return (
                    <TouchableOpacity
                      key={loc}
                      onPress={() => {
                        lightImpact();
                        setLocality(loc);
                      }}
                      style={[styles.locPill, selected && styles.locPillSelected]}
                      activeOpacity={0.8}
                    >
                      <MapPin size={12} color={selected ? '#FFFFFF' : '#6B7280'} style={{ marginRight: 4 }} />
                      <Text style={[styles.locPillText, selected && styles.locPillTextSelected]}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Street Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Exact Address (Hidden until booked)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. House #102, 3rd Cross Road, near Metro station"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>
        )}

        {/* STEP 2: Pricing & Policies */}
        {step === 2 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rent & Terms</Text>
              <Text style={styles.sectionSubtitle}>
                Transparent pricing with 0% brokerage for verified college students.
              </Text>
            </View>

            {/* Monthly Rent Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Rent (₹)</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="numeric"
                  value={rentRupees}
                  onChangeText={setRentRupees}
                  placeholder="12000"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.perMonthText}>/ month</Text>
              </View>
            </View>

            {/* Security Deposit Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Security Deposit (₹)</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="numeric"
                  value={depositRupees}
                  onChangeText={setDepositRupees}
                  placeholder="24000"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.perMonthText}>refundable</Text>
              </View>
            </View>

            {/* Monthly Maintenance */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Maintenance / Utilities (₹)</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="numeric"
                  value={maintenanceRupees}
                  onChangeText={setMaintenanceRupees}
                  placeholder="1500"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.perMonthText}>/ month</Text>
              </View>
            </View>

            {/* Gender Policy */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender Policy</Text>
              <View style={styles.pillsRow}>
                {(['unisex', 'male', 'female'] as const).map((gp) => {
                  const selected = genderPolicy === gp;
                  const label =
                    gp === 'unisex' ? 'All / Unisex' : gp === 'male' ? 'Boys Only' : 'Girls Only';
                  return (
                    <TouchableOpacity
                      key={gp}
                      onPress={() => {
                        lightImpact();
                        setGenderPolicy(gp);
                      }}
                      style={[styles.cityPill, selected && styles.cityPillSelected]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.cityPillText, selected && styles.cityPillTextSelected]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: Amenities & Final Review */}
        {step === 3 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Amenities & Features</Text>
              <Text style={styles.sectionSubtitle}>
                Select the amenities provided in this room or property.
              </Text>
            </View>

            {/* Amenities Grid */}
            <View style={styles.amenitiesGrid}>
              {AVAILABLE_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <TouchableOpacity
                    key={amenity}
                    onPress={() => toggleAmenity(amenity)}
                    style={[styles.amenityCard, isSelected && styles.amenityCardSelected]}
                    activeOpacity={0.8}
                  >
                    <CheckCircle2
                      size={16}
                      color={isSelected ? '#10B981' : '#D1D5DB'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[styles.amenityText, isSelected && styles.amenityTextSelected]}
                    >
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Summary Review Card */}
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Sparkles size={16} color="#059669" />
                <Text style={styles.previewHeaderTitle}>Listing Summary</Text>
              </View>

              <Text style={styles.previewTitle} numberOfLines={1}>
                {title || 'New Student Nest Room'}
              </Text>
              <Text style={styles.previewLoc}>
                {locality}, {city} • {roomType.replace('_', ' ').toUpperCase()}
              </Text>

              <View style={styles.previewPricingRow}>
                <View>
                  <Text style={styles.previewPriceLabel}>Monthly Rent</Text>
                  <Text style={styles.previewPriceValue}>
                    {formatINR(rupeesToPaise(parseInt(rentRupees, 10) || 0))}
                  </Text>
                </View>
                <View>
                  <Text style={styles.previewPriceLabel}>Deposit</Text>
                  <Text style={styles.previewPriceValue}>
                    {formatINR(rupeesToPaise(parseInt(depositRupees, 10) || 0))}
                  </Text>
                </View>
                <View>
                  <Text style={styles.previewPriceLabel}>Amenities</Text>
                  <Text style={styles.previewPriceValue}>{selectedAmenities.length} items</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.footerBar}>
        {step < 3 ? (
          <TouchableOpacity
            onPress={handleNext}
            style={styles.primaryButton}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handlePublish}
            disabled={isSubmitting}
            style={[styles.primaryButton, { backgroundColor: '#10B981' }]}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE3',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  stepIndicator: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    marginTop: 1,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#111827',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typePillSelected: {
    backgroundColor: '#18191E',
    borderColor: '#18191E',
  },
  typePillText: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
  },
  typePillTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  cityPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cityPillSelected: {
    backgroundColor: '#18191E',
    borderColor: '#18191E',
  },
  cityPillText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
  },
  cityPillTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  locScroll: {
    flexDirection: 'row',
  },
  locPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  locPillSelected: {
    backgroundColor: '#18191E',
    borderColor: '#18191E',
  },
  locPillText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
  },
  locPillTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  currencyPrefix: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    paddingVertical: 6,
  },
  perMonthText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '48%',
  },
  amenityCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  amenityText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
  },
  amenityTextSelected: {
    color: '#065F46',
    fontFamily: 'Inter_600SemiBold',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  previewHeaderTitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  previewLoc: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },
  previewPricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  previewPriceLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
  },
  previewPriceValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    marginTop: 2,
  },
  footerBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EBEAE3',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#18191E',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
