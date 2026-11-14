import React from 'react';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const iconMap: Record<string, string> = {
  'leaf': 'feather',
  'clock': 'clock',
  'brain': 'cpu',
  'star': 'star',
  'shield-check': 'shield',
  'crown': 'award',
  'gem': 'hexagon',
  'trophy': 'award',
  'check': 'check',
  'gift': 'gift',
  'sparkles': 'zap',
  'flame': 'zap',
  'bar-chart': 'bar-chart-2',
  'users': 'users',
  'settings': 'settings',
  'bell': 'bell',
  'menu': 'menu',
  'chevron-right': 'chevron-right',
  'arrow-up-right': 'arrow-up-right',
  'x': 'x',
  'play': 'play',
  'pause': 'pause',
  'lock': 'lock',
  'zap': 'zap',
};

type Props = {
  name: string;
  size?: number;
  color?: string;
};

export default function Icon({ name, size = 20, color = COLORS.purple }: Props) {
  const featherName = iconMap[name] || 'circle';
  return <Feather name={featherName as any} size={size} color={color} />;
}
