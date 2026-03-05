import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, FlatList, useColorScheme, ViewStyle } from 'react-native';

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
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_HEIGHT,
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

  // 1 padding item top/bottom for 3-visible centering
  const paddedData = ['__pad__', ...data, '__pad__'];

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const realIndex = index - 1;
      const isPad = item === '__pad__';
      const isSelected = realIndex === selectedIndex;

      if (isPad) {
        return <View style={{ height: ITEM_HEIGHT }} />;
      }

      return (
        <View
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
    },
    [isDark, selectedIndex],
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
      <FlatList
        ref={flatListRef}
        data={paddedData}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        style={{ zIndex: 2 }}
        initialScrollIndex={selectedIndex > 0 ? selectedIndex : undefined}
      />
    </View>
  );
}
