export class StickerSetActionError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}
