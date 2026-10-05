import type { Point } from './types';

export interface PalmFilterConfig {
  enablePalmRejection: boolean; // If true, only 'pen' inputs can draw; touch is rejected or reserved for gestures
  allowTouchDrawing: boolean;   // If false, touch is strictly reserved for panning/gestures
  minPressureThreshold: number; // Discard ghost hovering touches with near-zero pressure
}

export const DEFAULT_PALM_CONFIG: PalmFilterConfig = {
  enablePalmRejection: true,
  allowTouchDrawing: false,
  minPressureThreshold: 0.01,
};

export class StylusInputArbiter {
  private activePointerId: number | null = null;
  private activePointerType: string | null = null;
  private config: PalmFilterConfig;

  constructor(config: Partial<PalmFilterConfig> = {}) {
    this.config = { ...DEFAULT_PALM_CONFIG, ...config };
  }

  public updateConfig(config: Partial<PalmFilterConfig>) {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): PalmFilterConfig {
    return { ...this.config };
  }

  /**
   * Determine if an incoming pointerdown event should initiate a stroke
   */
  public shouldStartStroke(e: React.PointerEvent<Element> | PointerEvent): boolean {
    // If we are already tracking a stroke, ignore other pointers
    if (this.activePointerId !== null && this.activePointerId !== e.pointerId) {
      return false;
    }

    // Check pointer type against palm rejection rules
    if (e.pointerType === 'pen') {
      this.activePointerId = e.pointerId;
      this.activePointerType = 'pen';
      return true;
    }

    if (e.pointerType === 'mouse') {
      this.activePointerId = e.pointerId;
      this.activePointerType = 'mouse';
      return true;
    }

    if (e.pointerType === 'touch') {
      if (this.config.enablePalmRejection && !this.config.allowTouchDrawing) {
        // Palm rejection: reject finger touch for drawing (user is resting palm or gesturing)
        return false;
      }
      this.activePointerId = e.pointerId;
      this.activePointerType = 'touch';
      return true;
    }

    return false;
  }

  /**
   * Extract all hardware points (including 120Hz/240Hz coalesced events)
   */
  public extractPoints(
    e: React.PointerEvent<Element> | PointerEvent,
    canvasRect: DOMRect,
    zoom: number = 1,
    pan: { x: number; y: number } = { x: 0, y: 0 }
  ): Point[] {
    const rawEvents: (PointerEvent | React.PointerEvent<Element>)[] = [];

    // Extract coalesced sub-frame hardware events if supported
    if ('getCoalescedEvents' in e && typeof e.getCoalescedEvents === 'function') {
      const coalesced = e.getCoalescedEvents();
      if (coalesced && coalesced.length > 0) {
        rawEvents.push(...coalesced);
      } else {
        rawEvents.push(e);
      }
    } else {
      rawEvents.push(e);
    }

    return rawEvents.map((evt) => {
      // Transform screen client coordinates to local canvas space
      const screenX = evt.clientX - canvasRect.left;
      const screenY = evt.clientY - canvasRect.top;

      const x = (screenX - pan.x) / zoom;
      const y = (screenY - pan.y) / zoom;

      // Stylus pressure handling
      let pressure = evt.pressure;
      if (evt.pointerType === 'mouse') {
        pressure = 0.5;
      } else if (evt.pointerType === 'touch' && pressure === 0) {
        pressure = 0.5;
      }

      return {
        x,
        y,
        pressure,
        tiltX: evt.tiltX,
        tiltY: evt.tiltY,
        twist: evt.twist,
        time: evt.timeStamp || Date.now(),
      };
    });
  }

  public endStroke(pointerId: number) {
    if (this.activePointerId === pointerId) {
      this.activePointerId = null;
      this.activePointerType = null;
    }
  }

  public getActivePointerType(): string | null {
    return this.activePointerType;
  }
}
