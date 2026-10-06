import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import styles from './Shortcuts.module.css'

const KEYS: [string, string][] = [
  ['Space', 'Play / pause'],
  ['.', 'Step one frame (paused)'],
  ['1 – 5', 'Food, Lure, Repel, Wall, Erase'],
  ['[  ]', 'Brush smaller / bigger'],
  ['Right-drag', 'Erase with any tool'],
  ['M', 'Mutate'],
  ['N', 'New seed'],
  ['R', 'Start over'],
  ['P', 'Save print'],
  ['F', 'Fullscreen'],
  ['H', 'Hide / show controls'],
  ['?', 'This sheet'],
]

export function Shortcuts({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.sheet}>
          <Dialog.Title className={styles.title}>Keys</Dialog.Title>
          <Dialog.Description className="visually-hidden">
            Keyboard shortcuts for the studio
          </Dialog.Description>
          <dl className={styles.list}>
            {KEYS.map(([k, v]) => (
              <div key={k} className={styles.row}>
                <dt>
                  <kbd>{k}</kbd>
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <Dialog.Close className={styles.close} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
