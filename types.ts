export type DotType = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
export type CornerSquareType = 'square' | 'dot' | 'extra-rounded';
export type CornerDotType = 'square' | 'dot';

export type FrameStyle = 'solid' | 'dashed' | 'dotted' | 'double';

export interface QRConfig {
  data: string;
  width: number;
  height: number;
  margin?: number; // Outer margin of the QR code
  image?: string;
  dotsOptions: {
    color: string;
    type: DotType;
  };
  backgroundOptions: {
    color: string;
  };
  imageOptions: {
    crossOrigin: string;
    margin: number;
    imageSize?: number; // Ratio from 0 to 1
  };
  cornersSquareOptions?: {
    type: CornerSquareType;
    color?: string;
  };
  cornersDotOptions?: {
    type: CornerDotType;
    color?: string;
  };
  // New Frame Options
  frameOptions: {
    enabled: boolean;
    style: FrameStyle;
    color: string;
    thickness: number;
    cornerRadius: number; // Added for rounded corners
  };
}