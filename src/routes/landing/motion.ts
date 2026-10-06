import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { frameLoop } from '@/engine/frameLoop'

gsap.registerPlugin(ScrollTrigger)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Smooth scroll and scroll-driven motion, both driven by the app's one frame loop rather than
 * their own rAFs: Lenis advances, then GSAP renders against the scroll position it produced.
 *
 * Everything here is progressive: content is laid out visible by default, and the timelines only
 * animate from a darker, undeveloped state when motion is allowed.
 */
export function useLandingMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return

    const lenis = new Lenis({ autoRaf: false, lerp: 0.11, wheelMultiplier: 0.9 })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.remove(gsap.updateRoot)
    gsap.ticker.lagSmoothing(0)
    const unsubscribe = frameLoop.add((time) => {
      lenis.raf(time)
      gsap.updateRoot(time / 1000)
    })
    frameLoop.start()

    const ctx = gsap.context(() => {
      // Hero: the name develops out of the dark, letter by letter, then the instruments come up.
      gsap.from('[data-wordmark] span', {
        opacity: 0,
        filter: 'blur(14px)',
        yPercent: 18,
        duration: 1.6,
        ease: 'expo.out',
        stagger: 0.06,
        delay: 0.35,
      })
      gsap.from('[data-hero-ui]', {
        opacity: 0,
        y: 10,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.08,
        delay: 1.1,
      })

      // Leaving the hero: the print sinks back into the dark as the paper rises over it.
      gsap.to('[data-hero-canvas]', {
        filter: 'brightness(0.35)',
        scale: 1.05,
        ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('[data-wordmark]', {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
      })

      // Contact sheet: each strip develops as it reaches the light.
      gsap.utils.toArray<HTMLElement>('[data-strip]').forEach((strip) => {
        gsap.from(strip.querySelectorAll('[data-develop]'), {
          filter: 'brightness(0) contrast(2.2)',
          duration: 2.2,
          ease: 'expo.out',
          stagger: 0.14,
          scrollTrigger: { trigger: strip, start: 'top 82%' },
        })
      })
      gsap.from('[data-sheet-title] span', {
        yPercent: 105,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '[data-sheet-title]', start: 'top 85%' },
      })

      // Test strip: scrolling is the exposure. Each band comes up in turn, each one longer.
      const bands = gsap.utils.toArray<HTMLElement>('[data-band]')
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '[data-teststrip]', start: 'top 70%', end: 'bottom 60%', scrub: 0.6 },
      })
      bands.forEach((band, i) => {
        tl.fromTo(
          band,
          { '--exposure': 0.04 },
          { '--exposure': Number(band.dataset.band), ease: 'power2.out', duration: 1 },
          i * 0.6,
        )
        tl.from(
          band.querySelectorAll('[data-band-copy]'),
          { opacity: 0, y: 14, duration: 0.6, ease: 'power2.out' },
          i * 0.6 + 0.2,
        )
      })

      gsap.from('[data-close] [data-line]', {
        yPercent: 110,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '[data-close]', start: 'top 75%' },
      })
    }, el)

    return () => {
      ctx.revert()
      unsubscribe()
      lenis.destroy()
      gsap.ticker.add(gsap.updateRoot)
    }
  }, [root])
}
