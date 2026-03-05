import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, useColorScheme, ViewStyle } from 'react-native';

const ITEM_HEIGHT = 30;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerProps {
  data: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: number;
  style?: ViewStyle;
}

export default function WheelPicker({
  data,
  selectedIndex,
  onChange,
  width = 56,
  style,
}: WheelPickerProps) {
  const isDark = useColorScheme() === 'dark';
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      if (clamped !== selectedIndex) {
        onChange(clamped);
      }
    },
    [data.length, onChange, selectedIndex],
  );

  return (
    <View style={[{ width, height: PICKER_HEIGHT, overflow: 'hidden' }, style]}>
      {/* Selection highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT,
          left: 4,
          right: 4,
          height: ITEM_HEIGHT,
          borderRadius: 10,
          backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5',
          zIndex: 1,
        }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        nestedScrollEnabled
        style={{ zIndex: 2 }}
      >
        {/* Top padding */}
        <View style={{ height: ITEM_HEIGHT }} />
        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <View
              key={index}
              style={{
                height: ITEM_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: isSelected ? 20 : 14,
                  fontWeight: isSelected ? '700' : '400',
                  color: isSelected
                    ? isDark ? '#EBEBEB' : '#141414'
                    : isDark ? '#555' : '#BBB',
                }}
              >
                {item}
              </Text>
            </View>
          );
        })}
        {/* Bottom padding */}
        <View style={{ height: ITEM_HEIGHT }} />
      </ScrollView>
    </View>
  );
}
