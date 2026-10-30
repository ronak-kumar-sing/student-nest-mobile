import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageStyle,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Circle, G } from 'react-native-svg';
import {
  TrendingUp,
  Plus,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Wrench,
  Percent,
  Music,
  ShoppingBag,
  Send,
  MoreVertical,
  X,
  CheckCircle2,
  Download,
  MessageSquare,
  ShieldCheck,
  Building,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { RubberSegment } from '@/components/common/rubber-segment';
import { formatINR, rupeesToPaise, paiseToRupees } from '@/lib/money';
import { toast } from '@/components/ui/toast';
import { selectionFeedback, mediumImpact, lightImpact } from '@/lib/haptics';
import { useOwnerStore, OwnerTransaction } from '@/stores/owner-store';
import { formatIST } from '@/lib/dates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const orderAvatarStyle: ImageStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#E5E7EB',
  marginRight: 10,
};

const salesAvatarStyle: ImageStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#E5E7EB',
  marginRight: 12,
};

// ─── Sparkline SVG for Yellow Sales Card ───────────────────────────────────────
function SalesSparkline({ width = 280, height = 44 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 280 44">
      {/* Subtle dotted baseline */}
      <Line
        x1={0}
        y1={24}
        x2={280}
        y2={24}
        stroke="#D97706"
        strokeWidth={1}
        strokeDasharray="4, 4"
        opacity={0.4}
      />
      {/* Organic wavy sparkline curve matching the screenshot */}
      <Path
        d="M 4 32 C 40 38, 70 20, 100 28 C 130 36, 160 14, 195 24 C 230 34, 255 12, 276 15"
        fill="none"
        stroke="#B45309"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Donut Chart for Monthly Profits ──────────────────────────────────────────
function ProfitsDonutChart({
  directPaise = 4581300,
  affiliatePaise = 1832500,
  offlinePaise = 1221600,
}: {
  directPaise?: number;
  affiliatePaise?: number;
  offlinePaise?: number;
}) {
  const total = directPaise + affiliatePaise + offlinePaise;
  const directPct = directPaise / total;
  const affiliatePct = affiliatePaise / total;
  const offlinePct = offlinePaise / total;

  const size = 220;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Arc stroke dash offsets
  const directDash = circumference * directPct;
  const affiliateDash = circumference * affiliatePct;
  const offlineDash = circumference * offlinePct;

  const directOffset = 0;
  const affiliateOffset = -directDash;
  const offlineOffset = -(directDash + affiliateDash);

  return (
    <View style={donutStyles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Lavender Arc (Direct Student Bookings 60%) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#9FA8FF"
            strokeWidth={strokeWidth}
            strokeDasharray={`${directDash} ${circumference - directDash}`}
            strokeDashoffset={directOffset}
            fill="transparent"
          />

          {/* Yellow Arc (Campus Portals & Deposits 24%) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FDE68A"
            strokeWidth={strokeWidth}
            strokeDasharray={`${affiliateDash} ${circumference - affiliateDash}`}
            strokeDashoffset={affiliateOffset}
            fill="transparent"
          />

          {/* Sage Green Arc (Walk-in & Offline 16%) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#CDE2B8"
            strokeWidth={strokeWidth}
            strokeDasharray={`${offlineDash} ${circumference - offlineDash}`}
            strokeDashoffset={offlineOffset}
            fill="transparent"
          />
        </G>
      </Svg>

      {/* Floating Dark Callout Badges on Segments (matching screenshot) */}
      <View style={[donutStyles.badgePill, { top: 12, right: 10 }]}>
        <Text style={donutStyles.badgeText}>{formatINR(affiliatePaise)}</Text>
      </View>
      <View style={[donutStyles.badgePill, { top: 96, right: -4 }]}>
        <Text style={donutStyles.badgeText}>{formatINR(offlinePaise)}</Text>
      </View>
      <View style={[donutStyles.badgePill, { bottom: 20, left: 16 }]}>
        <Text style={donutStyles.badgeText}>{formatINR(directPaise)}</Text>
      </View>

      {/* Center Display: "Total ₹ 76,356" */}
      <View style={donutStyles.centerLabel}>
        <Text style={donutStyles.centerSub}>Total</Text>
        <Text style={donutStyles.centerTotal}>{formatINR(total)}</Text>
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  container: {
    width: 240,
    height: 240,
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSub: {
    fontSize: 13,
    color: '#71717A',
    fontFamily: 'Inter_500Medium',
  },
  centerTotal: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  badgePill: {
    position: 'absolute',
    backgroundColor: '#18191E',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.2,
  },
});

// ─── Main Owner Dashboard Screen ─────────────────────────────────────────────
export default function OwnerDashboardScreen() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'profits' | 'wallet'>('analytics');
  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Wednesday (matches screenshot)

  // Owner Store State
  const {
    balancePaise,
    earnedPaise,
    spentPaise,
    cashbackPaise,
    weeklySalesPaise,
    selectedTimeFilter,
    payoutBank,
    transactions,
    withdrawPayout,
    setTimeFilter,
  } = useOwnerStore();

  // Modals
  const [isPayoutModalVisible, setIsPayoutModalVisible] = useState(false);
  const [payoutInput, setPayoutInput] = useState('');
  const [selectedTx, setSelectedTx] = useState<OwnerTransaction | null>(null);
  const [isFilterPickerVisible, setIsFilterPickerVisible] = useState(false);

  const weeklyData = [
    { day: 'Mon', heightPct: 0.35, paise: 1425000 },
    { day: 'Tue', heightPct: 0.65, paise: 2610000 },
    { day: 'Wed', heightPct: 0.88, paise: 3356700 },
    { day: 'Thu', heightPct: 0.52, paise: 2040000 },
    { day: 'Fri', heightPct: 0.24, paise: 980000 },
    { day: 'Sat', heightPct: 0.72, paise: 2895000 },
    { day: 'Sun', heightPct: 0.46, paise: 1830000 },
  ];

  const handleWithdrawConfirm = () => {
    mediumImpact();
    const rupees = parseInt(payoutInput, 10);
    if (isNaN(rupees) || rupees <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountPaise = rupeesToPaise(rupees);
    if (amountPaise > balancePaise) {
      toast.error('Amount exceeds your available balance');
      return;
    }

    const res = withdrawPayout(amountPaise);
    if (res.success) {
      setIsPayoutModalVisible(false);
      setPayoutInput('');
      toast.success(
        `₹${rupees.toLocaleString('en-IN')} transferred to ${payoutBank.bankName} (${payoutBank.accountNumberMasked}) via instant IMPS.`
      );
    } else {
      toast.error(res.message);
    }
  };

  const handleExportStatement = () => {
    mediumImpact();
    toast.success('Rental statement for October 2026 exported to PDF!');
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: activeTab === 'wallet' ? '#18191E' : '#F6F6F0' },
      ]}
    >
      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: activeTab === 'wallet' ? '#18191E' : '#F6F6F0',
            borderBottomColor: activeTab === 'wallet' ? '#26272F' : '#E8E8E0',
          },
        ]}
      >
        <View>
          <Text
            style={[
              styles.portalTitle,
              { color: activeTab === 'wallet' ? '#FFFFFF' : '#111827' },
            ]}
          >
            Owner Portal
          </Text>
          <Text
            style={[
              styles.portalSubtitle,
              { color: activeTab === 'wallet' ? '#9CA3AF' : '#71717A' },
            ]}
          >
            Student Nest Financial & Revenue Hub
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/dev')}
          style={[
            styles.devPill,
            { backgroundColor: activeTab === 'wallet' ? '#272830' : '#EAE9E2' },
          ]}
          accessibilityLabel="Open Dev Menu"
        >
          <Wrench size={12} color={activeTab === 'wallet' ? '#D1D5DB' : '#4B5563'} />
          <Text
            style={[
              styles.devPillText,
              { color: activeTab === 'wallet' ? '#D1D5DB' : '#4B5563' },
            ]}
          >
            Dev
          </Text>
        </TouchableOpacity>
      </View>

      {/* View Switcher: RubberSegment */}
      <View style={styles.segmentWrap}>
        <RubberSegment
          items={[
            { value: 'analytics', label: 'Analytics' },
            { value: 'profits', label: 'Profits' },
            { value: 'wallet', label: 'Wallet' },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'analytics' | 'profits' | 'wallet')}
          trackColor={activeTab === 'wallet' ? '#24252D' : '#EBEAE3'}
          thumbColor={activeTab === 'wallet' ? '#FFFFFF' : '#18191E'}
          textColor={activeTab === 'wallet' ? '#9CA3AF' : '#71717A'}
          activeTextColor={activeTab === 'wallet' ? '#111827' : '#FFFFFF'}
          size="md"
          radius={14}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 1: ANALYTICS & WEEKLY PERFORMANCE (Left Screen in Image)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <View style={{ position: 'relative' }}>
            {/* Peeking organic pastel shapes outside card (matching mockup) */}
            <View style={styles.leftSageBlob} pointerEvents="none" />
            <View style={styles.rightLavenderBlob} pointerEvents="none" />

            {/* Butter Yellow Sales Card with Organic Blobs & Sparkline */}
            <View style={styles.yellowSalesCard}>
              {/* Organic shape accents in corner */}
              <View style={styles.yellowWaveCircle} />

              <View style={styles.salesHeaderRow}>
                {/* % Sales Pill */}
                <View style={styles.salesTagPill}>
                  <Percent size={11} color="#78350F" />
                  <Text style={styles.salesTagText}>Sales</Text>
                </View>

                {/* +23% Growth Pill */}
                <View style={styles.growthPill}>
                  <Text style={styles.growthText}>+ 23%</Text>
                </View>
              </View>

              {/* Big Figure */}
              <Text style={styles.bigSalesNumber}>{formatINR(weeklySalesPaise)}</Text>

              {/* Sparkline Curve */}
              <View style={styles.sparklineWrap}>
                <SalesSparkline width={SCREEN_WIDTH - 64} />
              </View>
            </View>

            {/* "User in The Last Week" & Vertical Bar Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <View>
                  <Text style={styles.chartSectionTitle}>User in The Last Week</Text>
                  <Text style={styles.chartBigPct}>+ 3,2%</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(owner)/(tabs)/requests')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>

              {/* Bar Chart Container */}
              <View style={styles.barChartContainer}>
                {/* Left Y-axis Guide */}
                <View style={styles.yAxisGuide}>
                  <Text style={styles.yAxisLabel}>40 K</Text>
                  <Text style={styles.yAxisLabel}>20 K</Text>
                  <Text style={styles.yAxisLabel}>0 K</Text>
                </View>

                {/* 7 Day Capsule Columns */}
                <View style={styles.columnsRow}>
                  {weeklyData.map((item, idx) => {
                    const isSelected = idx === selectedDayIndex;
                    return (
                      <TouchableOpacity
                        key={item.day}
                        activeOpacity={0.8}
                        onPress={() => {
                          selectionFeedback();
                          setSelectedDayIndex(idx);
                        }}
                        style={styles.dayCol}
                      >
                        {/* Tooltip with stem on selected day (Wednesday) */}
                        {isSelected && (
                          <View style={styles.activeDayTooltip}>
                            <Text style={styles.activeDayTooltipText}>{formatINR(item.paise)}</Text>
                            <View style={styles.activeDayDot} />
                          </View>
                        )}

                        {/* Capsule Track */}
                        <View style={styles.capsuleTrack}>
                          {/* Animated Fill Bar */}
                          <View
                            style={[
                              styles.capsuleFill,
                              {
                                height: `${item.heightPct * 100}%`,
                                backgroundColor: isSelected ? '#111827' : '#27272A',
                              },
                            ]}
                          />
                        </View>

                        {/* Day Label */}
                        <Text
                          style={[
                            styles.dayLabelText,
                            isSelected && styles.dayLabelActive,
                          ]}
                        >
                          {item.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* "Last Orders" Section */}
            <View style={styles.lastOrdersCard}>
              <View style={styles.lastOrdersHeader}>
                <Text style={styles.lastOrdersTitle}>Last Orders</Text>

                <TouchableOpacity
                  onPress={() => {
                    lightImpact();
                    setIsFilterPickerVisible(true);
                  }}
                  style={styles.timeDropdownPill}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timeDropdownText}>{selectedTimeFilter}</Text>
                  <ChevronDown size={13} color="#4B5563" />
                </TouchableOpacity>
              </View>

              {/* Order Rows */}
              <View style={styles.orderRowsWrap}>
                {transactions.slice(0, 3).map((tx) => (
                  <TouchableOpacity
                    key={tx.id}
                    onPress={() => {
                      lightImpact();
                      setSelectedTx(tx);
                    }}
                    style={styles.orderRow}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{
                        uri:
                          tx.tenantAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                      }}
                      style={orderAvatarStyle}
                    />
                    <Text style={styles.orderName} numberOfLines={1}>
                      {tx.tenantName || tx.title}
                    </Text>
                    <Text style={styles.orderAmount}>{formatINR(tx.amountPaise)}</Text>
                    <View
                      style={[
                        styles.statusSquare,
                        { backgroundColor: tx.statusSquareColor || '#9FA8FF' },
                      ]}
                    />
                    <Text style={styles.orderDate}>{formatIST(tx.date, 'dd MMM yyyy')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 2: MONTHLY PROFITS & BREAKDOWN (Middle Screen in Image)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profits' && (
          <View>
            <View style={styles.profitsCard}>
              {/* Header Row with Filter Button */}
              <View style={styles.profitsHeaderRow}>
                <View>
                  <Text style={styles.profitsTitle}>Monthly Profits</Text>
                  <Text style={styles.profitsSubtitle}>Total Profit Growth of 26%</Text>
                </View>

                <TouchableOpacity
                  onPress={handleExportStatement}
                  style={styles.dotsButton}
                  activeOpacity={0.8}
                  accessibilityLabel="Export monthly statement"
                >
                  <MoreVertical size={16} color="#4B5563" />
                </TouchableOpacity>
              </View>

              {/* Donut Chart with Floating Badges */}
              <ProfitsDonutChart />

              {/* 3-Part Legend with Progress Bars */}
              <View style={styles.legendRow}>
                {/* Direct Bookings */}
                <View style={styles.legendCol}>
                  <Text style={styles.legendLabel}>Direct</Text>
                  <Text style={styles.legendPct}>60%</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: '60%', backgroundColor: '#9FA8FF' }]} />
                  </View>
                </View>

                {/* Affiliate / Portals */}
                <View style={styles.legendCol}>
                  <Text style={styles.legendLabel}>Portal</Text>
                  <Text style={styles.legendPct}>24%</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: '24%', backgroundColor: '#FDE68A' }]} />
                  </View>
                </View>

                {/* Offline Sales */}
                <View style={styles.legendCol}>
                  <Text style={styles.legendLabel}>Offline</Text>
                  <Text style={styles.legendPct}>16%</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: '16%', backgroundColor: '#CDE2B8' }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Recent Sales List */}
            <View style={styles.recentSalesCard}>
              <View style={styles.recentSalesHeader}>
                <Text style={styles.recentSalesTitle}>Recent Sales</Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('wallet')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.salesRowsWrap}>
                {transactions
                  .filter((t) => t.type === 'credit')
                  .slice(0, 3)
                  .map((tx) => (
                    <TouchableOpacity
                      key={tx.id}
                      onPress={() => {
                        lightImpact();
                        setSelectedTx(tx);
                      }}
                      style={styles.salesRow}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{
                          uri:
                            tx.tenantAvatar ||
                            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
                        }}
                        style={salesAvatarStyle}
                      />
                      <View style={styles.salesInfo}>
                        <Text style={styles.salesName}>{tx.tenantName || tx.title}</Text>
                        <Text style={styles.salesTime}>{formatIST(tx.date, 'hh:mm a, dd MMM')}</Text>
                      </View>
                      <Text style={styles.salesAmount}>+ {formatINR(tx.amountPaise)}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 3: WALLET & FINTECH CARD (Right Screen in Image)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'wallet' && (
          <View>
            {/* Top Row: Mini Owner Card & 3 Quick Action Buttons */}
            <View style={styles.walletTopRow}>
              {/* Butter Yellow Mini Credit Card / License */}
              <View style={styles.miniCreditCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHolderName}>{payoutBank.holderName}</Text>
                  {/* Mastercard Double Circle */}
                  <View style={styles.mastercardIcon}>
                    <View style={[styles.mcCircle, { backgroundColor: '#EA580C', opacity: 0.85 }]} />
                    <View style={[styles.mcCircle, { backgroundColor: '#FBBF24', marginLeft: -8, opacity: 0.85 }]} />
                  </View>
                </View>

                <View style={styles.cardBottomRow}>
                  <Text style={styles.cardNumber}>•••• 8969</Text>
                  <Text style={styles.cardExpiry}>10/25</Text>
                </View>
              </View>

              {/* 3 Quick Action Rounded Square Buttons */}
              <View style={styles.actionButtonsCol}>
                {/* 1. Add Listing (+) */}
                <TouchableOpacity
                  onPress={() => router.push('/property/new')}
                  style={[styles.actionSquare, { backgroundColor: '#23252E' }]}
                  activeOpacity={0.8}
                  accessibilityLabel="Add New Listing"
                >
                  <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
                </TouchableOpacity>

                {/* 2. Payout to Bank (Card) */}
                <TouchableOpacity
                  onPress={() => {
                    mediumImpact();
                    setPayoutInput(String(Math.floor(paiseToRupees(balancePaise))));
                    setIsPayoutModalVisible(true);
                  }}
                  style={[styles.actionSquare, { backgroundColor: '#B4B8FF' }]}
                  activeOpacity={0.8}
                  accessibilityLabel="Bank Payout"
                >
                  <CreditCard size={18} color="#1E1B4B" strokeWidth={2.2} />
                </TouchableOpacity>

                {/* 3. Export Statements (Arrow) */}
                <TouchableOpacity
                  onPress={handleExportStatement}
                  style={[styles.actionSquare, { backgroundColor: '#C8E2B2' }]}
                  activeOpacity={0.8}
                  accessibilityLabel="Export Statements"
                >
                  <ArrowUpRight size={18} color="#14532D" strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Big Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceAmount}>{formatINR(balancePaise)}</Text>
              <View style={styles.balanceProfitRow}>
                <TrendingUp size={14} color="#10B981" />
                <Text style={styles.balanceProfitText}>Total Week Profit +15,32%</Text>
              </View>

              {/* 3 Metrics Tags Row: Spent, Earned, Escrow */}
              <View style={styles.metricsRow}>
                {/* Spent */}
                <View style={styles.metricItem}>
                  <View style={styles.metricIconCircle}>
                    <ArrowDownLeft size={13} color="#EF4444" />
                  </View>
                  <Text style={styles.metricLabel}>Spent</Text>
                  <Text style={styles.metricValue}>{formatINR(spentPaise)}</Text>
                </View>

                {/* Earned */}
                <View style={styles.metricItem}>
                  <View style={styles.metricIconCircle}>
                    <ArrowUpRight size={13} color="#10B981" />
                  </View>
                  <Text style={styles.metricLabel}>Earned</Text>
                  <Text style={styles.metricValue}>{formatINR(earnedPaise)}</Text>
                </View>

                {/* Cashback */}
                <View style={styles.metricItem}>
                  <View style={styles.metricIconCircle}>
                    <Percent size={12} color="#F59E0B" />
                  </View>
                  <Text style={styles.metricLabel}>Cashback</Text>
                  <Text style={styles.metricValue}>{formatINR(cashbackPaise)}</Text>
                </View>
              </View>
            </View>

            {/* Bottom Off-White Curved Transactions Container */}
            <View style={styles.walletTransactionsCard}>
              <View style={styles.walletTxHeader}>
                <Text style={styles.walletTxTitle}>Transactions</Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('analytics')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.walletAnalyticsLink}>Analytics</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.walletTxList}>
                {transactions.map((tx, idx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <TouchableOpacity
                      key={tx.id}
                      onPress={() => {
                        lightImpact();
                        setSelectedTx(tx);
                      }}
                      style={idx === 2 ? styles.txRowHighlighted : styles.txRow}
                      activeOpacity={0.7}
                    >
                      {idx !== 2 && (
                        <View style={[styles.txIconCircle, { backgroundColor: '#FDE68A' }]}>
                          {tx.category === 'utility' ? (
                            <Music size={16} color="#78350F" />
                          ) : (
                            <ShoppingBag size={16} color="#78350F" />
                          )}
                        </View>
                      )}
                      <View style={styles.txDetails}>
                        <Text style={styles.txTitle}>{tx.title}</Text>
                        <Text style={styles.txTime}>{formatIST(tx.date, 'dd MMM, hh:mm a')}</Text>
                      </View>
                      <Text
                        style={[
                          styles.txAmount,
                          { color: isCredit ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {isCredit ? '+ ' : '- '}
                        {formatINR(tx.amountPaise)}
                      </Text>
                      {idx === 2 && (
                        <View style={styles.txMiniCardIcon}>
                          <Send size={14} color="#6B7280" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── MODAL 1: Bank Payout Sheet ───────────────────────────────────────── */}
      <Modal
        visible={isPayoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPayoutModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={modalStyles.overlay}>
            <View style={modalStyles.sheetContainer}>
              {/* Sheet Grabber */}
              <View style={modalStyles.grabber} />

              {/* Header */}
              <View style={modalStyles.sheetHeader}>
                <View>
                  <Text style={modalStyles.sheetTitle}>Withdraw Rental Revenue</Text>
                  <Text style={modalStyles.sheetSub}>
                    Instant IMPS bank transfer to your verified account
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsPayoutModalVisible(false)}
                  style={modalStyles.closeBtn}
                >
                  <X size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Bank Account Card */}
              <View style={modalStyles.bankCard}>
                <View style={modalStyles.bankIconCircle}>
                  <Building size={20} color="#1D4ED8" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={modalStyles.bankName}>{payoutBank.bankName}</Text>
                    <View style={modalStyles.verifiedPill}>
                      <ShieldCheck size={11} color="#059669" />
                      <Text style={modalStyles.verifiedText}>VERIFIED</Text>
                    </View>
                  </View>
                  <Text style={modalStyles.bankDetails}>
                    A/C {payoutBank.accountNumberMasked} • IFSC: {payoutBank.ifsc}
                  </Text>
                </View>
              </View>

              {/* Available Balance Banner */}
              <View style={modalStyles.availWrap}>
                <Text style={modalStyles.availLabel}>Available Balance:</Text>
                <Text style={modalStyles.availValue}>{formatINR(balancePaise)}</Text>
              </View>

              {/* Amount Input */}
              <View style={modalStyles.amountInputWrap}>
                <Text style={modalStyles.rupeeSymbol}>₹</Text>
                <TextInput
                  style={modalStyles.amountInput}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  value={payoutInput}
                  onChangeText={setPayoutInput}
                />
              </View>

              {/* Quick Preset Chips */}
              <View style={modalStyles.presetRow}>
                {['10000', '25000', String(Math.floor(paiseToRupees(balancePaise)))].map(
                  (presetVal, idx) => (
                    <TouchableOpacity
                      key={presetVal}
                      onPress={() => {
                        lightImpact();
                        setPayoutInput(presetVal);
                      }}
                      style={modalStyles.presetChip}
                      activeOpacity={0.8}
                    >
                      <Text style={modalStyles.presetChipText}>
                        {idx === 2 ? 'All ' : ''}₹{parseInt(presetVal, 10).toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                onPress={handleWithdrawConfirm}
                style={modalStyles.confirmBtn}
                activeOpacity={0.85}
              >
                <Text style={modalStyles.confirmBtnText}>Confirm Instant Withdrawal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── MODAL 2: Transaction Details Inspection Sheet ────────────────────── */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheetContainer}>
            <View style={modalStyles.grabber} />

            <View style={modalStyles.sheetHeader}>
              <View>
                <Text style={modalStyles.sheetTitle}>Transaction Details</Text>
                <Text style={modalStyles.sheetSub}>
                  Ref: {selectedTx?.id.toUpperCase() || 'NEST-TXN-2026'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedTx(null)}
                style={modalStyles.closeBtn}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <View style={modalStyles.txDetailBody}>
                {/* Amount Header */}
                <View style={modalStyles.txAmountHero}>
                  <Text
                    style={[
                      modalStyles.txHeroNumber,
                      { color: selectedTx.type === 'credit' ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {selectedTx.type === 'credit' ? '+' : '-'} {formatINR(selectedTx.amountPaise)}
                  </Text>
                  <View style={modalStyles.completedPill}>
                    <CheckCircle2 size={12} color="#059669" />
                    <Text style={modalStyles.completedText}>SETTLED VIA ESCROW</Text>
                  </View>
                </View>

                {/* Details Table */}
                <View style={modalStyles.detailRowsWrap}>
                  <View style={modalStyles.detailRow}>
                    <Text style={modalStyles.detailRowLabel}>Party / Tenant</Text>
                    <Text style={modalStyles.detailRowValue}>
                      {selectedTx.tenantName || selectedTx.title}
                    </Text>
                  </View>

                  <View style={modalStyles.detailRow}>
                    <Text style={modalStyles.detailRowLabel}>Description</Text>
                    <Text style={modalStyles.detailRowValue}>{selectedTx.subtitle}</Text>
                  </View>

                  <View style={modalStyles.detailRow}>
                    <Text style={modalStyles.detailRowLabel}>Date & Time</Text>
                    <Text style={modalStyles.detailRowValue}>
                      {formatIST(selectedTx.date, 'EEEE, dd MMM yyyy, hh:mm a')}
                    </Text>
                  </View>

                  <View style={modalStyles.detailRow}>
                    <Text style={modalStyles.detailRowLabel}>Payment Method</Text>
                    <Text style={modalStyles.detailRowValue}>
                      {selectedTx.paymentMethod || 'UPI • Direct Transfer'}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={modalStyles.txActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      lightImpact();
                      toast.success('Rent receipt downloaded to device (PDF)');
                      setSelectedTx(null);
                    }}
                    style={modalStyles.downloadBtn}
                    activeOpacity={0.8}
                  >
                    <Download size={16} color="#111827" style={{ marginRight: 6 }} />
                    <Text style={modalStyles.downloadBtnText}>Receipt PDF</Text>
                  </TouchableOpacity>

                  {selectedTx.tenantName && (
                    <TouchableOpacity
                      onPress={() => {
                        lightImpact();
                        setSelectedTx(null);
                        router.push('/chat/inquiry-1');
                      }}
                      style={modalStyles.chatBtn}
                      activeOpacity={0.8}
                    >
                      <MessageSquare size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={modalStyles.chatBtnText}>Message</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: Time Filter Picker ──────────────────────────────────────── */}
      <Modal
        visible={isFilterPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterPickerVisible(false)}
      >
        <TouchableOpacity
          style={modalStyles.overlayCenter}
          activeOpacity={1}
          onPress={() => setIsFilterPickerVisible(false)}
        >
          <View style={modalStyles.filterCard}>
            <Text style={modalStyles.filterCardTitle}>Select Time Window</Text>
            {(['Every 3 Hours', 'Today', 'This Week', 'This Month', 'All Time'] as const).map(
              (option) => {
                const isSelected = selectedTimeFilter === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      selectionFeedback();
                      setTimeFilter(option);
                      setIsFilterPickerVisible(false);
                      toast.info(`Time filter updated to ${option}`);
                    }}
                    style={[
                      modalStyles.filterOption,
                      isSelected && modalStyles.filterOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        modalStyles.filterOptionText,
                        isSelected && modalStyles.filterOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {isSelected && <CheckCircle2 size={16} color="#10B981" />}
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  portalTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.3,
  },
  portalSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  devPillText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },

  /* ── VIEW 1: Analytics & Sparkline ────────────────────────────────────────── */
  leftSageBlob: {
    position: 'absolute',
    top: 20,
    left: -20,
    width: 26,
    height: 72,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: '#CDE2B8',
    opacity: 0.9,
    zIndex: 1,
  },
  rightLavenderBlob: {
    position: 'absolute',
    top: 30,
    right: -20,
    width: 28,
    height: 78,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    backgroundColor: '#9FA8FF',
    opacity: 0.85,
    zIndex: 1,
  },
  yellowSalesCard: {
    backgroundColor: '#FEE388',
    borderRadius: 26,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 16,
  },
  yellowWaveCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  salesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  salesTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  salesTagText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#78350F',
  },
  growthPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  growthText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#78350F',
  },
  bigSalesNumber: {
    fontSize: 34,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#18191E',
    letterSpacing: -0.6,
    marginVertical: 4,
  },
  sparklineWrap: {
    marginTop: 6,
    alignItems: 'center',
  },

  /* Bar Chart */
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFEA',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  chartSectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#18191E',
  },
  chartBigPct: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#18191E',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 36,
  },
  yAxisGuide: {
    justifyContent: 'space-between',
    height: 120,
    paddingRight: 10,
    paddingBottom: 20,
  },
  yAxisLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#A1A1AA',
  },
  columnsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  capsuleTrack: {
    width: 22,
    height: 110,
    borderRadius: 11,
    backgroundColor: '#F3F2EB',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  capsuleFill: {
    width: '100%',
    borderRadius: 11,
  },
  dayLabelText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#71717A',
    marginTop: 8,
  },
  dayLabelActive: {
    color: '#18191E',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  activeDayTooltip: {
    position: 'absolute',
    top: -34,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    zIndex: 10,
  },
  activeDayTooltipText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  activeDayDot: {
    position: 'absolute',
    bottom: -11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111827',
  },

  /* Last Orders */
  lastOrdersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFEA',
  },
  lastOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lastOrdersTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#18191E',
  },
  timeDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  timeDropdownText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
  },
  orderRowsWrap: {
    gap: 14,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#111827',
    flex: 1,
  },
  orderAmount: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    marginRight: 10,
  },
  statusSquare: {
    width: 10,
    height: 10,
    borderRadius: 2.5,
    marginRight: 12,
  },
  orderDate: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
  },

  /* ── VIEW 2: Monthly Profits ──────────────────────────────────────────────── */
  profitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFEA',
  },
  profitsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profitsTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#18191E',
  },
  profitsSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#71717A',
    marginTop: 2,
  },
  dotsButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    gap: 12,
  },
  legendCol: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#71717A',
  },
  legendPct: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    marginVertical: 3,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  recentSalesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFEA',
  },
  recentSalesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentSalesTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#18191E',
  },
  salesRowsWrap: {
    gap: 14,
  },
  salesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salesInfo: {
    flex: 1,
  },
  salesName: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#111827',
  },
  salesTime: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
    marginTop: 1,
  },
  salesAmount: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },

  /* ── VIEW 3: Wallet & Fintech ─────────────────────────────────────────────── */
  walletTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  miniCreditCard: {
    flex: 1,
    backgroundColor: '#FEE388',
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 125,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHolderName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#18191E',
  },
  mastercardIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mcCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#18191E',
    letterSpacing: 1,
  },
  cardExpiry: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#78350F',
  },
  actionButtonsCol: {
    gap: 8,
    justifyContent: 'space-between',
  },
  actionSquare: {
    width: 44,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Balance Card */
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#71717A',
  },
  balanceAmount: {
    fontSize: 34,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    letterSpacing: -0.6,
    marginVertical: 4,
  },
  balanceProfitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 18,
  },
  balanceProfitText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#10B981',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    paddingTop: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10.5,
    fontFamily: 'Inter_500Medium',
    color: '#71717A',
  },
  metricValue: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    marginTop: 2,
  },

  /* Transactions Card */
  walletTransactionsCard: {
    backgroundColor: '#F7F7F2',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFEFEA',
  },
  walletTxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletTxTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  walletAnalyticsLink: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#71717A',
  },
  walletTxList: {
    gap: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  txRowHighlighted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#111827',
  },
  txTime: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
    marginTop: 1,
  },
  txAmount: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  txMiniCardIcon: {
    marginLeft: 8,
  },
});

// ─── Modal Stylesheet ─────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    justifyContent: 'flex-end',
  },
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 42 : 28,
  },
  grabber: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  sheetSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  bankIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1E3A8A',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  verifiedText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#065F46',
  },
  bankDetails: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#3B82F6',
    marginTop: 2,
  },
  availWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  availLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  availValue: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  rupeeSymbol: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    paddingVertical: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#374151',
  },
  confirmBtn: {
    backgroundColor: '#18191E',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  /* Transaction Detail Sheet */
  txDetailBody: {
    gap: 16,
  },
  txAmountHero: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txHeroNumber: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginTop: 6,
  },
  completedText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#065F46',
    letterSpacing: 0.3,
  },
  detailRowsWrap: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  detailRowValue: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#111827',
    maxWidth: '65%',
    textAlign: 'right',
  },
  txActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  downloadBtnText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#111827',
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#18191E',
  },
  chatBtnText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
  },

  /* Filter Picker */
  filterCard: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  filterCardTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    marginBottom: 14,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  filterOptionSelected: {
    backgroundColor: '#F3F4F6',
  },
  filterOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
  },
  filterOptionTextSelected: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
});
