/**
 * App.tsx — Componente raíz de MundoLimpio (composition root).
 *
 * WHAT: Punto de entrada React que instancia dependencias concretas
 *       y las inyecta al RootNavigator.
 * WHY: El composition root es el ÚNICO lugar donde se instancian
 *      dependencias concretas. El resto de la app depende de
 *      abstracciones (ITokenStorage, no InMemoryTokenStorage).
 * BENEFITS: Una sola línea para cambiar implementación
 *           (InMemory → Keychain). Facilita testing y migraciones.
 */
import React from 'react';
import { RootNavigator } from '@core/navigation/RootNavigator';
import { InMemoryTokenStorage } from '@core/storage/tokenStorage';

// WHAT: Instancia concreta de almacenamiento de tokens para desarrollo.
// WHY: InMemoryTokenStorage no depende de módulos nativos — permite
//      desarrollar y testear sin dispositivo. Se reemplazará por
//      KeychainTokenStorage en PR de feature/auth.
const tokenStorage = new InMemoryTokenStorage();

export default function App() {
  return <RootNavigator tokenStorage={tokenStorage} />;
}
