declare module "qrcode" {
  export type QRCodeToBufferOptions = {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    type?: "png" | "svg" | "utf8";
  };

  export function toBuffer(
    text: string,
    options?: QRCodeToBufferOptions
  ): Promise<Buffer>;
}
