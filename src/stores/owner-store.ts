import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

export interface OwnerTransaction {
  id: string;
  title: string;
  subtitle: string;
  amountPaise: number;
  type: 'credit' | 'debit';
  category: 'rent' | 'deposit' | 'maintenance' | 'utility' | 'payout';
  date: string; // ISO string
  tenantName?: string;
  tenantAvatar?: string;
  propertyTitle?: string;
  paymentMethod?: string;
  statusSquareColor?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumberMasked: string;
  ifsc: string;
  holderName: string;
  isVerified: boolean;
}

export interface OwnerState {
  balancePaise: number;
  earnedPaise: number;
  spentPaise: number;
  cashbackPaise: number;
  weeklySalesPaise: number;
  totalProfitsPaise: number;
  selectedTimeFilter: 'Every 3 Hours' | 'Today' | 'This Week' | 'This Month' | 'All Time';
  payoutBank: BankAccount;
  transactions: OwnerTransaction[];

  // Actions
  withdrawPayout: (amountPaise: number) => { success: boolean; message: string };
  addTransaction: (tx: OwnerTransaction) => void;
  setTimeFilter: (filter: 'Every 3 Hours' | 'Today' | 'This Week' | 'This Month' | 'All Time') => void;
  recordBookingApproval: (tenantName: string, propertyTitle: string, rentPaise: number, depositPaise: number) => void;
}

const INITIAL_TRANSACTIONS: OwnerTransaction[] = [
  {
    id: 'tx-1',
    title: 'David Astee',
    subtitle: 'Room 204 • Monthly Advance',
    amountPaise: 145600,
    type: 'credit',
    category: 'rent',
    date: '2026-09-11T10:30:00.000Z',
    tenantName: 'David Astee',
    tenantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    propertyTitle: 'Modern Studio in Koramangala',
    paymentMethod: 'UPI • Google Pay',
    statusSquareColor: '#9FA8FF',
  },
  {
    id: 'tx-2',
    title: 'Maria Hulama',
    subtitle: 'Flat 4B • Security Deposit',
    amountPaise: 4247800,
    type: 'credit',
    category: 'deposit',
    date: '2026-09-11T14:15:00.000Z',
    tenantName: 'Maria Hulama',
    tenantAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    propertyTitle: '2BHK Luxury Flat in Indiranagar',
    paymentMethod: 'NetBanking • HDFC',
    statusSquareColor: '#CDE2B8',
  },
  {
    id: 'tx-3',
    title: 'Arnold Swarz',
    subtitle: 'Twin Sharing • Amenity Split',
    amountPaise: 341200,
    type: 'credit',
    category: 'maintenance',
    date: '2026-09-11T18:45:00.000Z',
    tenantName: 'Arnold Swarz',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    propertyTitle: 'Student Nest PG near RV College',
    paymentMethod: 'PhonePe UPI',
    statusSquareColor: '#FDE68A',
  },
  {
    id: 'tx-4',
    title: 'High-speed WiFi & BESCOM Bill',
    subtitle: 'Property 101 Utilities',
    amountPaise: 55000,
    type: 'debit',
    category: 'utility',
    date: '2026-10-28T09:15:00.000Z',
    paymentMethod: 'Auto Debit • HDFC Bank',
  },
  {
    id: 'tx-5',
    title: 'Deep Cleaning & Pest Control',
    subtitle: 'Bi-monthly Property Care',
    amountPaise: 30000,
    type: 'debit',
    category: 'maintenance',
    date: '2026-10-27T13:20:00.000Z',
    paymentMethod: 'UPI • Razorpay',
  },
  {
    id: 'tx-6',
    title: 'Anna Jacobs (Deposit)',
    subtitle: 'Advance Room Token',
    amountPaise: 2351000,
    type: 'credit',
    category: 'deposit',
    date: '2026-10-26T20:25:00.000Z',
    tenantName: 'Anna Jacobs',
    tenantAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    propertyTitle: '1BHK Studio in HSR Layout',
    paymentMethod: 'UPI • Paytm',
  },
  {
    id: 'tx-7',
    title: 'Plumbing Repairs & Fittings',
    subtitle: 'Washroom Maintenance Block A',
    amountPaise: 120000,
    type: 'debit',
    category: 'maintenance',
    date: '2026-10-25T11:00:00.000Z',
    paymentMethod: 'Cash Payout',
  },
];

export const useOwnerStore = create<OwnerState>()(
  persist(
    (set, get) => ({
      balancePaise: 5457500, // ₹54,575
      earnedPaise: 16032100, // ₹1,60,321
      spentPaise: 1245400, // ₹12,454
      cashbackPaise: 235400, // ₹2,354
      weeklySalesPaise: 2457500, // ₹24,575
      totalProfitsPaise: 7635600, // ₹76,356
      selectedTimeFilter: 'Every 3 Hours',
      payoutBank: {
        bankName: 'HDFC Bank',
        accountNumberMasked: '•••• 4821',
        ifsc: 'HDFC0001248',
        holderName: 'Amit Kumar',
        isVerified: true,
      },
      transactions: INITIAL_TRANSACTIONS,

      withdrawPayout: (amountPaise: number) => {
        const currentBalance = get().balancePaise;
        if (amountPaise <= 0 || amountPaise > currentBalance) {
          return { success: false, message: 'Invalid withdrawal amount' };
        }

        const newBalance = currentBalance - amountPaise;
        const payoutTx: OwnerTransaction = {
          id: `payout-${Date.now()}`,
          title: 'Bank Payout to HDFC Bank',
          subtitle: `A/C ${get().payoutBank.accountNumberMasked} • Instant IMPS`,
          amountPaise,
          type: 'debit',
          category: 'payout',
          date: new Date().toISOString(),
          paymentMethod: 'Direct Bank Transfer',
        };

        set((state) => ({
          balancePaise: newBalance,
          spentPaise: state.spentPaise + amountPaise,
          transactions: [payoutTx, ...state.transactions],
        }));

        return { success: true, message: 'Payout transferred successfully' };
      },

      addTransaction: (tx: OwnerTransaction) => {
        set((state) => {
          const isCredit = tx.type === 'credit';
          return {
            transactions: [tx, ...state.transactions],
            balancePaise: isCredit
              ? state.balancePaise + tx.amountPaise
              : Math.max(0, state.balancePaise - tx.amountPaise),
            earnedPaise: isCredit ? state.earnedPaise + tx.amountPaise : state.earnedPaise,
            spentPaise: !isCredit ? state.spentPaise + tx.amountPaise : state.spentPaise,
          };
        });
      },

      setTimeFilter: (filter) => {
        set({ selectedTimeFilter: filter });
      },

      recordBookingApproval: (
        tenantName: string,
        propertyTitle: string,
        rentPaise: number,
        depositPaise: number
      ) => {
        const totalPaise = rentPaise + depositPaise;
        const approvalTx: OwnerTransaction = {
          id: `book-appr-${Date.now()}`,
          title: tenantName,
          subtitle: `${propertyTitle} • Rent & Deposit`,
          amountPaise: totalPaise,
          type: 'credit',
          category: 'rent',
          date: new Date().toISOString(),
          tenantName,
          propertyTitle,
          paymentMethod: 'Razorpay Student Nest Escrow',
          statusSquareColor: '#10B981',
        };

        set((state) => ({
          balancePaise: state.balancePaise + totalPaise,
          earnedPaise: state.earnedPaise + totalPaise,
          totalProfitsPaise: state.totalProfitsPaise + totalPaise,
          transactions: [approvalTx, ...state.transactions],
        }));
      },
    }),
    {
      name: 'studentnest:owner',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        balancePaise: state.balancePaise,
        earnedPaise: state.earnedPaise,
        spentPaise: state.spentPaise,
        cashbackPaise: state.cashbackPaise,
        weeklySalesPaise: state.weeklySalesPaise,
        totalProfitsPaise: state.totalProfitsPaise,
        selectedTimeFilter: state.selectedTimeFilter,
        payoutBank: state.payoutBank,
        transactions: state.transactions,
      }),
    }
  )
);
