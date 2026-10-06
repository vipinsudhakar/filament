import { useState } from 'react'
import { Link } from 'react-router'
import { Popover } from 'radix-ui'
import { Bookmark, ChevronDown, Circle, Download, EyeOff, Link2, Maximize2, Square } from 'lucide-react'
import { presetById } from '@/model/presets'
import { useStudio } from '@/pages/studio/store'
import { IconButton } from '@/components/IconButton'
import { PresetSheet } from '@/pages/studio/components/PresetSheet'
import type { StudioActions } from '@/pages/studio/actions'
import styles from './TopBar.module.css'

export function TopBar({ actions }: { actions: StudioActions }) {
  const presetId = useStudio((s) => s.presetId)
  const recording = useStudio((s) => s.recording)
  const [sheetOpen, setSheetOpen] = useState(false)
  const preset = presetById(presetId)

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <Link to="/" className={styles.wordmark} aria-label="Filament home">
          Filament
        </Link>
        <Popover.Root open={sheetOpen} onOpenChange={setSheetOpen}>
          <Popover.Trigger className={styles.frame} aria-label="Choose a preset or one of your prints">
            <span className={styles.code}>{preset?.code ?? '—'}</span>
            <span className={styles.name}>{preset?.name ?? 'Your print'}</span>
            <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className={styles.sheet} sideOffset={10} align="start" collisionPadding={12}>
              <PresetSheet onPick={() => setSheetOpen(false)} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div className={styles.right}>
        <IconButton
          icon={<Bookmark />}
          label="Keep"
          className={styles.optional}
          onClick={() => void actions.keep()}
        />
        <IconButton icon={<Link2 />} label="Copy link" onClick={() => void actions.share()} />
        <IconButton
          icon={<Download />}
          label="Save print"
          shortcut="P"
          onClick={() => void actions.savePrint()}
        />
        <IconButton
          icon={recording ? <Square fill="currentColor" /> : <Circle fill="currentColor" />}
          label={recording ? 'Stop recording' : 'Record'}
          tone="live"
          showLabel={recording}
          className={recording ? styles.recording : styles.optional}
          onClick={actions.toggleRecording}
        />
        <span className={`${styles.divider} ${styles.optional}`} aria-hidden="true" />
        <IconButton
          icon={<Maximize2 />}
          label="Fullscreen"
          shortcut="F"
          className={styles.optional}
          onClick={actions.toggleFullscreen}
        />
        <IconButton
          icon={<EyeOff />}
          label="Hide controls"
          shortcut="H"
          tipSide="left"
          onClick={() => useStudio.getState().set({ uiHidden: true })}
        />
      </div>
    </header>
  )
}
