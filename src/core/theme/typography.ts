/**
 * Typography — Design tokens de tipografía.
 *
 * WHAT: Jerarquía tipográfica completa basada en app_text_styles.dart del
 *       proyecto Flutter original. Define fontSize, fontWeight, lineHeight y
 *       color para cada variante de texto.
 * WHY: Consistencia tipográfica en toda la app. Sin estilos inline dispersos.
 *      Fácil de auditar y cambiar si se ajusta la identidad visual.
 * BENEFITS: Single source of truth. Los componentes importan la variante que
 *           necesitan sin repetir valores mágicos.
 *
 * TDD: GREEN — implementación mínima para pasar los tests definidos en RED.
 */
import { type TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  // ── Encabezados ──────────────────────────────────────────────────
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: '#212121',
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    color: '#212121',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#212121',
  },

  // ── Cuerpo ───────────────────────────────────────────────────────
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#212121',
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#757575',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#9E9E9E',
  },

  // ── Interactivos ─────────────────────────────────────────────────
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#212121',
  },

  // ── Especiales ───────────────────────────────────────────────────
  price: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: '#2E7D32', // Verde — señal visual de valor positivo
  },
  error: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#C62828', // Rojo — mensajes de error
  },
} as const;
