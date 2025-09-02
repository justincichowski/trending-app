/**
 * Minimal ambient typings for the YouTube IFrame Player API.
 * - We declare a VALUE `YT` so `new YT.Player(...)` type-checks.
 * - We also declare a namespace for lightweight types if you reference `YT.PlayerEvent`.
 */
declare const YT: any;

declare global {
	interface Window {
		YT?: any;
		enableTrendingDebug?: (on?: boolean) => void;
	}
	namespace YT {
		interface Player {}
		interface PlayerEvent {
			target: any;
			data?: any;
		}
	}
}
export {};
