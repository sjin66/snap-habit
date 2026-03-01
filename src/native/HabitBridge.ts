import { NativeModules } from 'react-native';
import type { Habit, HabitEntry, TodaySnapshot } from '@types/habit';

const { HabitBridge } = NativeModules;

/**
 * JS 侧 Native Module 桥接封装
 * 对应 ios/SnapHabit/HabitBridge.swift
 */
export const habitBridge = {
  /**
   * 打卡 - 写入原生存储并刷新 Widget
   */
  checkIn: async (habitId: string, date: string): Promise<void> => {
    return HabitBridge.checkIn(habitId, date);
  },

  /**
   * 读取今日习惯列表
   */
  getTodayHabits: async (): Promise<TodaySnapshot> => {
    return HabitBridge.getTodayHabits();
  },

  /**
   * 调度本地通知
   */
  scheduleNotification: async (habitId: string, time: string): Promise<void> => {
    return HabitBridge.scheduleNotification(habitId, time);
  },

  /**
   * 取消通知
   */
  cancelNotification: async (habitId: string): Promise<void> => {
    return HabitBridge.cancelNotification(habitId);
  },

  /**
   * 手动触发 Widget 刷新
   */
  reloadWidget: async (): Promise<void> => {
    return HabitBridge.reloadWidget();
  },
};
