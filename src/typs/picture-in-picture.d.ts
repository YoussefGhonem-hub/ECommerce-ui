export { };

declare global {
    interface TargetedPictureInPictureEvent<T extends EventTarget = EventTarget>
        extends PictureInPictureEvent {
        readonly target: T;
        readonly currentTarget: T;
    }
}
