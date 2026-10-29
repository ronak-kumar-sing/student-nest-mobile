import React, { forwardRef, useMemo } from 'react';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetProps,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { cn } from '@/lib/cn';

export interface SheetProps extends Omit<BottomSheetProps, 'children'> {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  className?: string;
  onClose?: () => void;
}

export const Sheet = forwardRef<BottomSheet, SheetProps>(
  ({ children, snapPoints: customSnapPoints, className, onClose, ...props }, ref) => {
    const snapPoints = useMemo(() => customSnapPoints ?? ['50%', '90%'], [customSnapPoints]);

    const renderBackdrop = (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: 'transparent' }}
        handleIndicatorStyle={{ backgroundColor: 'hsl(var(--muted-foreground))', width: 40 }}
        onClose={onClose}
        {...props}
      >
        <BottomSheetView className={cn('flex-1 bg-card px-4 pb-6 pt-2 rounded-t-xl', className)}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

Sheet.displayName = 'Sheet';
