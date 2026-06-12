/**
 * Colors — Design tokens de colores.
 *
 * WHAT: Paleta de colores completa extraída del proyecto Flutter original
 *       (app_colors.dart — AppColors). Define todos los colores usados en la UI.
 * WHY: Consistencia visual con la app Flutter original. Single source of truth.
 *      Si cambia la identidad visual, se actualiza en un solo archivo.
 * BENEFITS: Sin colores hardcodeados en componentes. Fácil de auditar y cambiar.
 *
 * TDD: GREEN — implementación mínima para pasar los tests definidos en RED.
 */
export const colors = {
  // ── Paleta principal ──────────────────────────────────────────────
  primary: '#1A237E', // Navy — AppColors.primary
  primaryLight: '#534BAE', // Navy claro
  primaryDark: '#000051', // Navy oscuro
  accent: '#FF6F00', // Naranja — color de acento para CTAs

  // ── Colores semánticos (estados) ──────────────────────────────────
  success: '#2E7D32', // Verde — éxito, confirmación
  warning: '#F57F17', // Amarillo oscuro — low stock warning
  error: '#C62828', // Rojo — errores, crítico
  errorLight: '#FFCDD2', // Rojo claro — fondo de error banner

  // ── Superficie y fondo ────────────────────────────────────────────
  background: '#F5F5F5', // Fondo general de pantallas
  surface: '#FFFFFF', // Superficie de cards, formularios, modales
  surfaceVariant: '#E8EAF6', // Superficie secundaria (fondo de list items alternados)

  // ── Texto ─────────────────────────────────────────────────────────
  textPrimary: '#212121', // Texto principal, alta legibilidad
  textSecondary: '#757575', // Texto secundario, subtítulos
  textOnPrimary: '#FFFFFF', // Texto sobre fondo primary (contraste)
  textOnError: '#FFFFFF', // Texto sobre fondo de error

  // ── Bordes y divisores ────────────────────────────────────────────
  border: '#E0E0E0', // Bordes de cards, inputs
  divider: '#BDBDBD', // Divisores entre secciones

  // ── Elementos deshabilitados ──────────────────────────────────────
  disabled: '#9E9E9E', // Texto de elementos deshabilitados
  disabledBackground: '#E0E0E0', // Fondo de elementos deshabilitados

  // ── Estados de stock (inventory) ──────────────────────────────────
  stockCritical: '#C62828', // Rojo — currentStock <= minStock * 0.5
  stockLow: '#F57F17', // Naranja — currentStock <= minStock
  stockNormal: '#2E7D32', // Verde — stock suficiente

  // ── Estados de backup ─────────────────────────────────────────────
  backupCompleted: '#2E7D32', // Backup exitoso
  backupFailed: '#C62828', // Backup fallido

  // ── OCR confidence ────────────────────────────────────────────────
  ocrConfidenceLow: '#FFF3E0', // Fondo naranja claro — confidence < 0.3
} as const;
