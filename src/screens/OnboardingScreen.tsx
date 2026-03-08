import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Dimensions,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useI18n } from '../i18n';

const { width } = Dimensions.get('window');

interface Page {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  titleKey: string;
  descKey: string;
}

const PAGES: Page[] = [
  {
    icon: 'checkmark-circle-outline',
    iconColor: '#34C759',
    titleKey: 'onboardingTitle1',
    descKey: 'onboardingDesc1',
  },
  {
    icon: 'stats-chart-outline',
    iconColor: '#5856D6',
    titleKey: 'onboardingTitle2',
    descKey: 'onboardingDesc2',
  },
  {
    icon: 'notifications-outline',
    iconColor: '#FF9500',
    titleKey: 'onboardingTitle3',
    descKey: 'onboardingDesc3',
  },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const { t } = useI18n();
  const isDark = useColorScheme() === 'dark';
  const flatListRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const isLastPage = currentPage === PAGES.length - 1;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      if (index !== currentPage) setCurrentPage(index);
    },
    [currentPage],
  );

  const handleNext = useCallback(() => {
    if (isLastPage) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
    }
  }, [isLastPage, currentPage, onComplete]);

  const bg = isDark ? '#000000' : '#FFFFFF';
  const textPrimary = isDark ? '#F5F5F5' : '#141414';
  const textSecondary = isDark ? '#8E8E93' : '#6B7280';
  const dotActive = isDark ? '#F5F5F5' : '#141414';
  const dotInactive = isDark ? '#3A3A3C' : '#D1D5DB';
  const buttonBg = isDark ? '#F5F5F5' : '#141414';
  const buttonText = isDark ? '#000000' : '#FFFFFF';

  const renderPage = useCallback(
    ({ item, index }: { item: Page; index: number }) => (
      <View
        style={{
          width,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 40,
          paddingBottom: 180,
        }}
      >
        <Animated.View
          entering={ZoomIn.delay(index * 100).duration(600)}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: item.iconColor + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <Ionicons name={item.icon} size={56} color={item.iconColor} />
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(index * 100 + 200).duration(500)}
          style={{
            fontSize: 28,
            fontWeight: '800',
            color: textPrimary,
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: -0.5,
          }}
        >
          {(t as any)[item.titleKey]}
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(index * 100 + 400).duration(500)}
          style={{
            fontSize: 16,
            lineHeight: 24,
            color: textSecondary,
            textAlign: 'center',
          }}
        >
          {(t as any)[item.descKey]}
        </Animated.Text>
      </View>
    ),
    [t, textPrimary, textSecondary],
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Skip button */}
      {!isLastPage && (
        <TouchableOpacity
          onPress={onComplete}
          style={{
            position: 'absolute',
            top: 60,
            right: 24,
            zIndex: 10,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 16, color: textSecondary, fontWeight: '500' }}>
            {t.onboardingSkip}
          </Text>
        </TouchableOpacity>
      )}

      {/* Pages */}
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
      />

      {/* Bottom area: dots + button */}
      <Animated.View
        entering={FadeInDown.delay(600).duration(500)}
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        {/* Dot indicator */}
        <View style={{ flexDirection: 'row', marginBottom: 32 }}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={{
                width: currentPage === i ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentPage === i ? dotActive : dotInactive,
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={{
            backgroundColor: buttonBg,
            paddingHorizontal: 48,
            paddingVertical: 16,
            borderRadius: 16,
            minWidth: 200,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: buttonText }}>
            {isLastPage ? t.onboardingGetStarted : t.onboardingNext}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
