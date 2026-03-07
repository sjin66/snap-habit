import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert, useColorScheme } from 'react-native';
import ReAnimated, {
  FadeInDown,
  FadeOut,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { TodayHabitItem } from '../types/habit';

/** Separate component so useAnimatedStyle hooks run on the UI thread */
function RightActions({
  progress,
  dragX,
  totalWidth,
  btnWidth,
  cardHeight,
  onEdit,
  onDelete,
}: {
  progress: SharedValue<number>;
  dragX: SharedValue<number>;
  totalWidth: number;
  btnWidth: number;
  cardHeight: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [totalWidth, 0], Extrapolation.CLAMP) }],
  }));
  const editStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(dragX.value, [-totalWidth, -40, 0], [1, 0.9, 0.85], Extrapolation.CLAMP) }],
  }));
  const deleteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(dragX.value, [-totalWidth, -60, 0], [1, 0.92, 0.85], Extrapolation.CLAMP) }],
  }));

  return (
    <ReAnimated.View style={[{ flexDirection: 'row', alignItems: 'stretch', gap: 12, paddingLeft: 12 }, containerStyle]}>
      <ReAnimated.View style={editStyle}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onEdit}
          style={{
            width: btnWidth, height: cardHeight,
            backgroundColor: '#3B82F615', borderWidth: 1, borderColor: '#3B82F630',
            borderRadius: 12, justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Ionicons name="create" size={26} color="#3B82F6" />
        </TouchableOpacity>
      </ReAnimated.View>
      <ReAnimated.View style={deleteStyle}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onDelete}
          style={{
            width: btnWidth, height: cardHeight,
            backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444430',
            borderRadius: 12, justifyContent: 'center', alignItems: 'center',
          }}
        >
          <AntDesign name="delete" size={26} color="#EF4444" />
        </TouchableOpacity>
      </ReAnimated.View>
    </ReAnimated.View>
  );
}

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
  const swipeableRef = useRef<SwipeableMethods>(null);
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryColor = isDark ? '#EBEBEB' : '#141414';
  const bgColor = isDark ? '#111111' : '#FFFFFF';
  const mutedColor = isDark ? '#B4B4B4' : '#8E8E8E';
  const isRest = item.status === 'rest' && !item.isCompleted;
  const [cardHeight, setCardHeight] = useState(60);
  const btnWidth = Math.round(cardHeight * 0.6);

  // Delete animation values
  const deleteAnim = useRef(new Animated.Value(1)).current; // 1=visible, 0=gone
  const [isDeleting, setIsDeleting] = useState(false);

  const performDelete = useCallback(() => {
    if (isDeleting) return;
    setIsDeleting(true);
    Animated.timing(deleteAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onDelete?.(item.habitId);
    });
  }, [isDeleting, deleteAnim, onDelete, item.habitId]);

  const triggerDelete = useCallback(() => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ],
    );
  }, [item.name, performDelete]);

  // Jiggle animation — randomize per card for a natural iOS feel
  const jiggleRotation = useSharedValue(0);
  const angleRef = useRef(1.2 + Math.random() * 1.2);   // 1.2°–2.4°
  const durationRef = useRef(120 + Math.random() * 80);  // 120–200ms per step

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

  const totalWidth = 12 + btnWidth + 12 + btnWidth;

  const renderRightActions = useCallback(
    (progress: SharedValue<number>, dragX: SharedValue<number>) => (
      <RightActions
        progress={progress}
        dragX={dragX}
        totalWidth={totalWidth}
        btnWidth={btnWidth}
        cardHeight={cardHeight}
        onEdit={() => {
          swipeableRef.current?.close();
          onEdit?.(item.habitId);
        }}
        onDelete={() => {
          swipeableRef.current?.close();
          triggerDelete();
        }}
      />
    ),
    [item.habitId, triggerDelete, onEdit, cardHeight, totalWidth, btnWidth],
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
        // overflow: isDeleting ? 'hidden' as const : 'visible' as const,
        marginHorizontal: 20,
      }}
    >
    <ReAnimated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
    >
    <ReAnimated.View style={[jiggleStyle, isDragging && { opacity: 0.85 }]}>
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={isJiggling ? undefined : renderRightActions}
      overshootRight={false}
      friction={2}
      enabled={!isJiggling}
      rightThreshold={40}
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
        backgroundColor: isRest
          ? (isDark ? '#1A1A1A' : '#F0F0F0')
          : item.color + (item.isCompleted ? '20' : '15'),
        borderColor: isRest
          ? (isDark ? '#2D2D2D' : '#E0E0E0')
          : item.color + '30',
        opacity: isRest ? 0.7 : 1,
      }}
    >
      {/* Icon */}
      <View
        className="w-[52px] h-[52px] rounded-[14px] justify-center items-center mr-3.5"
        style={{ backgroundColor: isRest
          ? (isDark ? '#2A2A2A' : '#E0E0E0')
          : item.color + (item.isCompleted ? '33' : '15') }}
      >
        <Ionicons name={item.icon as any} size={24} color={isRest ? mutedColor : item.color} />
      </View>

      {/* Info */}
      <View className="flex-1">
        {isRest ? (
          <Text
            className="text-base font-semibold mb-1"
            style={{ color: mutedColor }}
          >
            {item.name}
          </Text>
        ) : (
          <Text
            className="text-base font-semibold mb-1 text-foreground dark:text-foreground-dark"
          >
            {item.name}
          </Text>
        )}
        <View className="flex-row items-center">
          {isRest ? (
            <Text style={{ fontSize: 13, color: mutedColor }}>
              Rest day
            </Text>
          ) : (
            <>
              <Text className="text-[13px] text-foreground dark:text-foreground-dark">
                {item.dailyTarget} {item.unit}
              </Text>
              {item.streak > 0 && (
                <>
                  <Text className="text-[13px] text-foreground dark:text-foreground-dark"> · </Text>
                  <Ionicons name="flame" size={13} color="#F97316" />
                  <Text className="text-[13px] font-medium text-foreground dark:text-foreground-dark ml-0.5">
                    {item.streak}d
                  </Text>
                </>
              )}
            </>
          )}
        </View>
      </View>

      {/* Check button / Rest indicator */}
      {isRest ? (
        <View className="w-[46px] h-[46px] rounded-full justify-center items-center">
          <Ionicons name="moon-outline" size={20} color={mutedColor} />
        </View>
      ) : (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className={`w-[46px] h-[46px] rounded-full justify-center items-center overflow-hidden ${
          item.isCompleted ? 'bg-primary dark:bg-primary-dark' : ''
        }`}
      >
        {item.isCompleted ? (
          <Ionicons name="checkmark" size={24} color={bgColor} />
        ) : (
          <Svg width={46} height={46} className="absolute">
            <Defs>
              <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={primaryColor} stopOpacity={0.18} />
                <Stop offset="60%" stopColor={primaryColor} stopOpacity={0.06} />
                <Stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={23} cy={23} r={23} fill="url(#grad)" />
            <Circle cx={23} cy={23} r={21.5} fill="none" stroke={primaryColor} strokeWidth={1.5} opacity={0.3} />
          </Svg>
        )}
      </TouchableOpacity>
      )}
    </Animated.View>
    </TouchableOpacity>
    </ReanimatedSwipeable>
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
