import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, useColorScheme } from 'react-native';
import ReAnimated, {
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { TodayHabitItem } from '../types/habit';

interface Props {
  item: TodayHabitItem;
  index: number;
  onCheckIn: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
  isJiggling?: boolean;
  onLongPress?: () => void;
  onDrag?: () => void;
  isDragging?: boolean;
}

export function HabitCard({ item, index, onCheckIn, onDelete, onEdit, isJiggling, onLongPress, onDrag, isDragging }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const swipeableRef = useRef<Swipeable>(null);
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryColor = isDark ? '#EBEBEB' : '#141414';
  const bgColor = isDark ? '#111111' : '#FFFFFF';
  const [cardHeight, setCardHeight] = useState(60);
  const btnWidth = Math.round(cardHeight * 0.6);

  // Delete animation values
  const deleteAnim = useRef(new Animated.Value(1)).current; // 1=visible, 0=gone
  const [isDeleting, setIsDeleting] = useState(false);

  const triggerDelete = useCallback(() => {
    if (isDeleting) return;
    setIsDeleting(true);
    Animated.timing(deleteAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false, // height animation needs native driver off
    }).start(() => {
      onDelete?.(item.habitId);
    });
  }, [isDeleting, deleteAnim, onDelete, item.habitId]);

  // Jiggle animation — randomize per card for a natural iOS feel
  const jiggleRotation = useSharedValue(0);
  const angleRef = useRef(1.2 + Math.random() * 1.2);   // 1.2°–2.4°
  const durationRef = useRef(120 + Math.random() * 80);   // 120–200ms per step

  useEffect(() => {
    if (isJiggling) {
      const a = angleRef.current;
      const d = durationRef.current;
      jiggleRotation.value = withRepeat(
        withSequence(
          withTiming(-a, { duration: d, easing: Easing.inOut(Easing.ease) }),
          withTiming(a, { duration: d, easing: Easing.inOut(Easing.ease) }),
          withTiming(-a * 0.6, { duration: d * 0.85, easing: Easing.inOut(Easing.ease) }),
          withTiming(a * 0.6, { duration: d * 0.85, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true, // reverse each cycle for variety
      );
    } else {
      jiggleRotation.value = withTiming(0, { duration: 150 });
    }
  }, [isJiggling]);

  const jiggleStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${jiggleRotation.value}deg` }],
  }));

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onCheckIn(item.habitId);
  }, [item.habitId, onCheckIn, scale]);

  const renderRightActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      // actions 总宽 = paddingLeft(12) + edit(btnWidth) + gap(12) + delete(btnWidth)
      const totalWidth = 12 + btnWidth + 12 + btnWidth;

      // 整体跟随卡片滑入：progress 0→1 时从右侧隐藏位置滑到最终位置
      const containerTranslateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [totalWidth, 0],
        extrapolate: 'clamp',
      });

      const editScale = dragX.interpolate({
        inputRange: [-totalWidth, -40, 0],
        outputRange: [1, 0.9, 0.85],
        extrapolate: 'clamp',
      });
      const deleteScale = dragX.interpolate({
        inputRange: [-totalWidth, -60, 0],
        outputRange: [1, 0.92, 0.85],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          className="flex-row items-stretch"
          style={{ gap: 12, paddingLeft: 12, transform: [{ translateX: containerTranslateX }] }}
        >
          <Animated.View style={{ transform: [{ scale: editScale }] }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                swipeableRef.current?.close();
                onEdit?.(item.habitId);
              }}
              className="rounded-xl justify-center items-center"
              style={{ width: btnWidth, height: cardHeight, backgroundColor: '#3B82F615', borderWidth: 1, borderColor: '#3B82F630' }}
            >
              <Ionicons name="create" size={26} color="#3B82F6" />
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                swipeableRef.current?.close();
                triggerDelete();
              }}
              className="rounded-xl justify-center items-center"
              style={{ width: btnWidth, height: cardHeight, backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444430' }}
            >
              <AntDesign name="delete" size={26} color="#EF4444" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      );
    },
    [item.habitId, triggerDelete, onEdit, cardHeight],
  );

  return (
    <Animated.View
      style={{
        opacity: deleteAnim,
        maxHeight: deleteAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 200],
        }),
        marginBottom: deleteAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 12],
        }),
        transform: [{
          scale: deleteAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.8, 0.95, 1],
          }),
        }],
        overflow: isDeleting ? 'hidden' as const : 'visible' as const,
        marginHorizontal: 20,
      }}
    >
    <ReAnimated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
    >
    <ReAnimated.View style={[jiggleStyle, isDragging && { opacity: 0.85 }]}>
    <Swipeable
      ref={swipeableRef}
      renderRightActions={isJiggling ? undefined : renderRightActions}
      overshootRight={false}
      friction={2}
      enabled={!isJiggling}
    >
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (!isJiggling) {
          navigation.navigate('HabitDetail', { habitId: item.habitId });
        }
      }}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
    <Animated.View
      className="flex-row items-center rounded-2xl py-4 px-4 shadow-sm border"
      onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
      style={{
        transform: [{ scale }],
        backgroundColor: item.color + (item.isCompleted ? '20' : '15'),
        borderColor: item.color + '30',
      }}
    >
      {/* Icon */}
      <View
        className="w-[52px] h-[52px] rounded-[14px] justify-center items-center mr-3.5"
        style={{ backgroundColor: item.color + (item.isCompleted ? '33' : '15') }}
      >
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text
          className="text-base font-semibold mb-1 text-foreground dark:text-foreground-dark"
        >
          {item.name}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-[13px] text-foreground dark:text-foreground-dark">
            {item.dailyTarget} {item.unit}
          </Text>
          <Text className="text-[13px] text-foreground dark:text-foreground-dark"> · </Text>
          <Text
            className={`text-[13px] text-foreground dark:text-foreground-dark ${
              item.isCompleted ? 'font-semibold' : ''
            }`}
          >
            {item.isCompleted ? 'Done' : 'Not done'}
          </Text>
        </View>
      </View>

      {/* Check button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className={`w-[38px] h-[38px] rounded-full justify-center items-center overflow-hidden ${
          item.isCompleted ? 'bg-primary dark:bg-primary-dark' : ''
        }`}
      >
        {item.isCompleted ? (
          <Ionicons name="checkmark" size={20} color={bgColor} />
        ) : (
          <Svg width={38} height={38} className="absolute">
            <Defs>
              <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={primaryColor} stopOpacity={0.18} />
                <Stop offset="60%" stopColor={primaryColor} stopOpacity={0.06} />
                <Stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={19} cy={19} r={19} fill="url(#grad)" />
            <Circle cx={19} cy={19} r={17.5} fill="none" stroke={primaryColor} strokeWidth={1.5} opacity={0.3} />
          </Svg>
        )}
      </TouchableOpacity>
    </Animated.View>
    </TouchableOpacity>
    </Swipeable>
    {/* Jiggle delete badge — outside Swipeable to avoid clipping */}
    {isJiggling && (
      <ReAnimated.View
        entering={FadeIn.duration(200)}
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: -8,
          left: -8,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => triggerDelete()}
          activeOpacity={0.7}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#EF4444',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
          }}
        >
          <Ionicons name="remove" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </ReAnimated.View>
    )}
    </ReAnimated.View>
    </ReAnimated.View>
    </Animated.View>
  );
}
