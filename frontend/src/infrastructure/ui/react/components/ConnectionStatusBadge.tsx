import { useRealtimeStatus } from '../hooks/useRealtimeStatus';
import styles from './ConnectionStatusBadge.module.css';

export function ConnectionStatusBadge() {
  const status = useRealtimeStatus();

  if (status !== 'closed') return null;

  return (
    <p className={styles.badge} role="status" aria-live="polite">
      Conexión en tiempo real perdida
    </p>
  );
}
