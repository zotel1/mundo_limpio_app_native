/**
 * WHAT: Tests TDD para WarningBadge — badge de nivel de stock con color semántico.
 * WHY: Validar que el badge renderiza el color correcto según el nivel de stock
 *      y muestra el conteo de stock.
 * BENEFITS: Componente puramente presentacional — fácil de testear. Sin mocks.
 *
 * TDD: RED — tests escritos antes de la implementación, deben fallar.
 *
 * PR 3.4 — 3.4.1
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// ──── Import (dynamic — component doesn't exist yet, will fail in RED phase) ────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WarningBadge } = require(
  '@features/inventory/presentation/components/WarningBadge',
) as { WarningBadge: React.ComponentType<{ stock: number }> };

// ──── Suite ────

describe('WarningBadge — badge de nivel de stock', () => {
  // ═══════════════════════════════════════════════════════════════
  // COLOR SEMÁNTICO
  // ═══════════════════════════════════════════════════════════════

  it('renderiza en rojo cuando stock < 5 (crítico)', () => {
    render(<WarningBadge stock={2} />);

    const badge = screen.getByTestId('warning-badge');
    expect(badge).toBeOnTheScreen();
    expect(badge).toHaveStyle({ backgroundColor: '#C62828' });
  });

  it('renderiza en amarillo cuando stock entre 5 y 19 (bajo)', () => {
    render(<WarningBadge stock={8} />);

    const badge = screen.getByTestId('warning-badge');
    expect(badge).toBeOnTheScreen();
    expect(badge).toHaveStyle({ backgroundColor: '#F57F17' });
  });

  it('renderiza en verde cuando stock >= 20 (normal)', () => {
    render(<WarningBadge stock={25} />);

    const badge = screen.getByTestId('warning-badge');
    expect(badge).toBeOnTheScreen();
    expect(badge).toHaveStyle({ backgroundColor: '#2E7D32' });
  });

  // ═══════════════════════════════════════════════════════════════
  // CONTENIDO
  // ═══════════════════════════════════════════════════════════════

  it('renderiza el conteo de stock', () => {
    render(<WarningBadge stock={15} />);

    expect(screen.getByText('15')).toBeOnTheScreen();
  });
});
